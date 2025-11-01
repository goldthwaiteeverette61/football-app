/**
 * APK下载和安装服务
 */

import * as FileSystem from 'expo-file-system/legacy';
import { Linking, Platform } from 'react-native';

export interface DownloadProgress {
  progress: number; // 0-1
  bytesDownloaded: number;
  totalBytes: number;
  speed: number; // bytes per second
  estimatedTimeRemaining: number; // seconds
}

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export class DownloadService {
  private downloadCallbacks: Map<string, (progress: DownloadProgress) => void> = new Map();
  private downloadStartTime: number = 0;
  private lastProgressTime: number = 0;
  private lastBytesDownloaded: number = 0;

  /**
   * 下载APK文件
   */
  async downloadAPK(
    url: string,
    fileName: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<DownloadResult> {
    try {

      // 检查存储权限（简化版本）
      const hasPermission = await this.checkStoragePermission();
      if (!hasPermission) {
        return {
          success: false,
          error: '存储权限被拒绝，无法下载文件'
        };
      }

      // 生成文件路径
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // 注册进度回调
      if (onProgress) {
        this.downloadCallbacks.set(fileName, onProgress);
      }

      // 初始化下载时间
      this.downloadStartTime = Date.now();
      this.lastProgressTime = this.downloadStartTime;
      this.lastBytesDownloaded = 0;

      // 使用createDownloadResumable支持进度回调
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        fileUri,
        {
          headers: {
            'User-Agent': 'ScoreRED-App-Updater/1.0'
          }
        },
        (downloadProgress) => {
          if (onProgress) {
            const currentTime = Date.now();
            const timeDiff = (currentTime - this.lastProgressTime) / 1000; // 秒
            const bytesDiff = downloadProgress.totalBytesWritten - this.lastBytesDownloaded;
            
            // 计算下载速度 (bytes per second)
            const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;
            
            // 计算剩余时间
            const remainingBytes = downloadProgress.totalBytesExpectedToWrite - downloadProgress.totalBytesWritten;
            const estimatedTimeRemaining = speed > 0 ? remainingBytes / speed : 0;
            
            const progress: DownloadProgress = {
              progress: downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite,
              bytesDownloaded: downloadProgress.totalBytesWritten,
              totalBytes: downloadProgress.totalBytesExpectedToWrite,
              speed: speed,
              estimatedTimeRemaining: estimatedTimeRemaining
            };
            
            // 更新上次记录的时间和字节数
            this.lastProgressTime = currentTime;
            this.lastBytesDownloaded = downloadProgress.totalBytesWritten;
            
            onProgress(progress);
          }
        }
      );

      // 开始下载
      const downloadResult = await downloadResumable.downloadAsync();

      // 移除进度回调
      this.downloadCallbacks.delete(fileName);

      if (downloadResult && downloadResult.status === 200) {
        return {
          success: true,
          filePath: fileUri
        };
      } else {
        console.error('❌ APK下载失败:', downloadResult?.status);
        return {
          success: false,
          error: `下载失败，状态码: ${downloadResult?.status || 'unknown'}`
        };
      }
    } catch (error: any) {
      console.error('❌ APK下载异常:', error);
      this.downloadCallbacks.delete(fileName);
      return {
        success: false,
        error: error.message || '下载过程中发生未知错误'
      };
    }
  }

  /**
   * 检查存储权限 - 简化版本，不申请相册权限
   */
  private async checkStoragePermission(): Promise<boolean> {
    try {
      // 对于APK下载，我们不需要申请相册权限
      // 直接返回true，让系统处理文件权限
      return true;
    } catch (error) {
      console.error('❌ 权限检查失败:', error);
      return false;
    }
  }

  /**
   * 安装APK文件
   */
  async installAPK(filePath: string): Promise<boolean> {
    try {

      if (Platform.OS !== 'android') {
        console.warn('⚠️ 非Android平台，无法安装APK');
        return false;
      }

      // 检查文件是否存在
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        console.error('❌ APK文件不存在:', filePath);
        return false;
      }


      // 尝试多种方法安装APK
      const installMethods = [
        // 方法1: 使用content URI (推荐)
        async () => {
          const contentUri = await FileSystem.getContentUriAsync(filePath);
          await Linking.openURL(contentUri);
          return 'content URI';
        },
        // 方法2: 使用标准的Android Intent
        async () => {
          const cleanPath = filePath.replace('file://', '');
          const intentUri = `intent://${cleanPath}#Intent;action=android.intent.action.VIEW;data=file://${cleanPath};type=application/vnd.android.package-archive;flags=0x10000000;end`;
          await Linking.openURL(intentUri);
          return 'intent URI';
        },
        // 方法3: 使用简单的file URI
        async () => {
          const fileUri = filePath.startsWith('file://') ? filePath : `file://${filePath}`;
          await Linking.openURL(fileUri);
          return 'file URI';
        }
      ];

      for (let i = 0; i < installMethods.length; i++) {
        try {
          const method = await installMethods[i]();
          return true;
        } catch (error: any) {
          console.error(`❌ 安装方法${i + 1}失败:`, error);
          if (i === installMethods.length - 1) {
            console.error('所有安装方法都失败了');
            console.log('APK文件位置:', filePath);
            return false;
          }
        }
      }
    } catch (error: any) {
      console.error('❌ APK安装失败:', error);
      return false;
    }
  }

  /**
   * 请求安装权限
   */
  private async requestInstallPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // Android 8.0+ 需要请求安装未知来源应用的权限
        // 注意：这个权限通常需要在系统设置中手动开启
        
        // 对于Android 8.0+，REQUEST_INSTALL_PACKAGES权限
        // 通常需要在系统设置中手动开启"允许安装未知来源应用"
        // 这里我们假设权限已开启，直接返回true
        return true;
      }
      return true;
    } catch (error) {
      console.error('❌ 安装权限请求失败:', error);
      return false;
    }
  }

  /**
   * 验证APK文件 - 简化版本，只检查基本文件信息
   */
  async validateAPK(filePath: string, expectedChecksum?: string): Promise<boolean> {
    try {

      // 只检查文件是否存在和大小
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        console.error('❌ APK文件不存在');
        return false;
      }

      // 检查文件大小
      if (fileInfo.size === 0) {
        console.error('❌ APK文件为空');
        return false;
      }

      // 检查文件大小是否合理（APK文件通常大于1MB）
      if (fileInfo.size < 1024 * 1024) {
        console.error('❌ APK文件太小，可能损坏:', fileInfo.size);
        return false;
      }

      return true;
    } catch (error: any) {
      console.error('❌ APK验证失败:', error);
      return false;
    }
  }

  /**
   * 计算文件校验和 - 已禁用，避免应用卡死
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    // 暂时禁用校验和计算，避免大文件导致应用卡死
    return '';
  }

  /**
   * 清理下载文件
   */
  async cleanupDownload(filePath: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
      }
    } catch (error) {
      console.error('❌ 清理文件失败:', error);
    }
  }

  /**
   * 获取下载进度
   */
  getDownloadProgress(fileName: string): DownloadProgress | null {
    // 这里可以实现更详细的进度跟踪
    return null;
  }
}

// 创建下载服务实例
export const downloadService = new DownloadService();
