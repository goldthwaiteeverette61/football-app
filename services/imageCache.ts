import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// 图片缓存配置
const CACHE_DIR = Platform.OS === 'web' ? 'imageCache/' : `${FileSystem.documentDirectory}imageCache/`;
const MAX_CACHE_SIZE = Platform.OS === 'web' ? 20 * 1024 * 1024 : 50 * 1024 * 1024; // Web: 20MB, Native: 50MB
const CACHE_EXPIRY = Platform.OS === 'web' ? 3 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // Web: 3天, Native: 7天
const MAX_CONCURRENT_DOWNLOADS = Platform.OS === 'web' ? 3 : 5; // 并发下载限制

// 缓存元数据接口
interface CacheMetadata {
  url: string;
  localPath: string;
  timestamp: number;
  size: number;
  expiresAt: number;
}

class ImageCacheService {
  private metadata: Map<string, CacheMetadata> = new Map();
  private downloadQueue: Array<() => Promise<void>> = [];
  private activeDownloads: Set<string> = new Set();

  constructor() {
    this.initializeCache();
  }

  // 初始化缓存
  private async initializeCache() {
    try {
      // Web平台跳过文件系统操作
      if (Platform.OS === 'web') {
        console.log('🌐 Web平台：跳过文件系统缓存初始化');
        await this.loadCacheMetadata();
        return;
      }

      // 确保缓存目录存在
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }

      // 加载缓存元数据
      await this.loadCacheMetadata();
      
      // 清理过期缓存
      await this.cleanExpiredCache();
    } catch (error) {
      console.error('初始化图片缓存失败:', error);
    }
  }

  // 加载缓存元数据
  private async loadCacheMetadata() {
    try {
      if (Platform.OS === 'web') {
        // Web平台使用localStorage，但需要检查是否存在
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            const metadataStr = localStorage.getItem('imageCacheMetadata');
            if (metadataStr) {
              const metadata = JSON.parse(metadataStr);
              
              // 恢复元数据到Map
              Object.entries(metadata).forEach(([key, value]) => {
                this.metadata.set(key, value as CacheMetadata);
              });
              
              console.log('📖 加载图片缓存元数据 (Web):', this.metadata.size, '个文件');
            }
          } catch (error) {
            console.warn('⚠️ Web平台加载缓存元数据失败:', error);
          }
        } else {
          console.log('🌐 Web平台：localStorage不可用，跳过缓存元数据加载');
        }
        return;
      }

      // 原生平台使用文件系统
      const metadataPath = `${CACHE_DIR}metadata.json`;
      const metadataInfo = await FileSystem.getInfoAsync(metadataPath);
      
      if (metadataInfo.exists) {
        const metadataContent = await FileSystem.readAsStringAsync(metadataPath);
        const metadata = JSON.parse(metadataContent);
        
        // 恢复元数据到Map
        Object.entries(metadata).forEach(([key, value]) => {
          this.metadata.set(key, value as CacheMetadata);
        });
        
        console.log('📖 加载图片缓存元数据:', this.metadata.size, '个文件');
      }
    } catch (error) {
      console.error('加载缓存元数据失败:', error);
    }
  }

  // 保存缓存元数据
  private async saveCacheMetadata() {
    try {
      const metadata = Object.fromEntries(this.metadata);
      
      if (Platform.OS === 'web') {
        // Web平台使用localStorage，但需要检查是否存在
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            localStorage.setItem('imageCacheMetadata', JSON.stringify(metadata));
          } catch (error) {
            console.warn('⚠️ Web平台保存缓存元数据失败:', error);
          }
        } else {
          console.log('🌐 Web平台：localStorage不可用，跳过缓存元数据保存');
        }
        return;
      }

      // 原生平台使用文件系统
      const metadataPath = `${CACHE_DIR}metadata.json`;
      await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify(metadata));
    } catch (error) {
      console.error('保存缓存元数据失败:', error);
    }
  }

  // 生成缓存键
  private async generateCacheKey(url: string): Promise<string> {
    const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, url, {
      encoding: Crypto.CryptoEncoding.BASE64,
    });
    // 将 BASE64 转换为 BASE64URL 格式（替换 +/= 字符）
    return hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  // 获取缓存的图片URI
  async getCachedImageUri(url: string): Promise<string | null> {
    try {
      if (!url || url.trim() === '' || url === 'null' || url === 'undefined') {
        return null;
      }

      const cacheKey = await this.generateCacheKey(url);
      const metadata = this.metadata.get(cacheKey);

      if (!metadata) {
        return null;
      }

      // Web平台直接返回URL，不检查文件系统
      if (Platform.OS === 'web') {
        // 检查是否过期
        if (Date.now() > metadata.expiresAt) {
          // 过期，清理元数据
          this.metadata.delete(cacheKey);
          await this.saveCacheMetadata();
          return null;
        }
        
        console.log('🌐 使用缓存的头像 (Web):', url);
        return url; // Web平台直接返回原始URL
      }

      // 原生平台检查文件是否存在
      const fileInfo = await FileSystem.getInfoAsync(metadata.localPath);
      if (!fileInfo.exists) {
        // 文件不存在，清理元数据
        this.metadata.delete(cacheKey);
        await this.saveCacheMetadata();
        return null;
      }

      // 检查是否过期
      if (Date.now() > metadata.expiresAt) {
        // 过期，删除文件
        await this.deleteCachedImage(cacheKey);
        return null;
      }

      console.log('📱 使用缓存的头像:', metadata.localPath);
      return metadata.localPath;
    } catch (error) {
      console.error('获取缓存图片失败:', error);
      return null;
    }
  }

  // 缓存图片
  async cacheImage(url: string): Promise<string | null> {
    try {
      if (!url || url.trim() === '' || url === 'null' || url === 'undefined') {
        return null;
      }

      const cacheKey = await this.generateCacheKey(url);
      
      // 检查是否已缓存
      const cachedUri = await this.getCachedImageUri(url);
      if (cachedUri) {
        return cachedUri;
      }

      // Web平台跳过文件下载，直接记录元数据
      if (Platform.OS === 'web') {
        console.log('🌐 Web平台：记录图片缓存元数据:', url);
        
        // 创建元数据（Web平台不下载文件）
        const metadata: CacheMetadata = {
          url,
          localPath: url, // Web平台使用原始URL作为localPath
          timestamp: Date.now(),
          size: 0, // Web平台无法获取文件大小
          expiresAt: Date.now() + CACHE_EXPIRY,
        };

        // 保存元数据
        this.metadata.set(cacheKey, metadata);
        await this.saveCacheMetadata();

        console.log('✅ 头像缓存记录成功 (Web):', url);
        return url;
      }

      console.log('📥 开始缓存头像:', url);

      // 原生平台下载图片
      const localPath = `${CACHE_DIR}${cacheKey}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(url, localPath);

      if (downloadResult.status === 200) {
        // 获取文件信息
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        
        // 创建元数据
        const metadata: CacheMetadata = {
          url,
          localPath,
          timestamp: Date.now(),
          size: fileInfo.size || 0,
          expiresAt: Date.now() + CACHE_EXPIRY,
        };

        // 保存元数据
        this.metadata.set(cacheKey, metadata);
        await this.saveCacheMetadata();

        // 检查缓存大小，必要时清理
        await this.manageCacheSize();

        console.log('✅ 头像缓存成功:', localPath);
        return localPath;
      } else {
        console.error('❌ 头像下载失败:', downloadResult.status);
        return null;
      }
    } catch (error) {
      console.error('❌ 缓存头像失败:', error);
      return null;
    }
  }

  // 管理缓存大小
  private async manageCacheSize() {
    try {
      let totalSize = 0;
      const entries = Array.from(this.metadata.entries());

      // 计算总大小
      entries.forEach(([_, metadata]) => {
        totalSize += metadata.size;
      });

      // 如果超过最大大小，删除最旧的缓存
      if (totalSize > MAX_CACHE_SIZE) {
        console.log('🧹 缓存大小超限，开始清理:', totalSize, 'bytes');
        
        // 按时间戳排序，删除最旧的
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        for (const [key, metadata] of entries) {
          await this.deleteCachedImage(key);
          totalSize -= metadata.size;
          
          if (totalSize <= MAX_CACHE_SIZE * 0.8) { // 清理到80%
            break;
          }
        }
      }
    } catch (error) {
      console.error('管理缓存大小失败:', error);
    }
  }

  // 清理过期缓存
  private async cleanExpiredCache() {
    try {
      const now = Date.now();
      const expiredKeys: string[] = [];

      this.metadata.forEach((metadata, key) => {
        if (now > metadata.expiresAt) {
          expiredKeys.push(key);
        }
      });

      for (const key of expiredKeys) {
        await this.deleteCachedImage(key);
      }

      if (expiredKeys.length > 0) {
        console.log('🗑️ 清理过期缓存:', expiredKeys.length, '个文件');
      }
    } catch (error) {
      console.error('清理过期缓存失败:', error);
    }
  }

  // 删除缓存的图片
  private async deleteCachedImage(cacheKey: string) {
    try {
      const metadata = this.metadata.get(cacheKey);
      if (metadata) {
        // Web平台跳过文件删除
        if (Platform.OS !== 'web') {
          // 原生平台删除文件
          const fileInfo = await FileSystem.getInfoAsync(metadata.localPath);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(metadata.localPath);
          }
        }
        
        // 删除元数据
        this.metadata.delete(cacheKey);
        await this.saveCacheMetadata();
      }
    } catch (error) {
      console.error('删除缓存图片失败:', error);
    }
  }

  // 清除所有缓存
  async clearAllCache() {
    try {
      // Web平台跳过文件系统操作
      if (Platform.OS === 'web') {
        console.log('🌐 Web平台：清除图片缓存元数据');
        // 清空元数据
        this.metadata.clear();
        await this.saveCacheMetadata();
        console.log('🧹 已清除所有图片缓存 (Web)');
        return;
      }

      // 原生平台删除所有缓存文件
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(CACHE_DIR);
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }

      // 清空元数据
      this.metadata.clear();
      await this.saveCacheMetadata();

      console.log('🧹 已清除所有图片缓存');
    } catch (error) {
      console.error('清除缓存失败:', error);
    }
  }

  // 获取缓存统计信息
  async getCacheStats() {
    try {
      let totalSize = 0;
      let fileCount = 0;

      this.metadata.forEach((metadata) => {
        totalSize += metadata.size;
        fileCount++;
      });

      return {
        fileCount,
        totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        maxSizeMB: (MAX_CACHE_SIZE / 1024 / 1024).toFixed(2),
      };
    } catch (error) {
      console.error('获取缓存统计失败:', error);
      return null;
    }
  }
}

// 导出单例实例
export const imageCache = new ImageCacheService();
export default imageCache;
