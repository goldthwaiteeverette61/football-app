/**
 * 版本检查和升级API服务
 */

import { apiClient } from './apiClient';

// 导入apiClient的类型
import type { ApiResponse } from './apiClient';

// 版本信息接口
export interface VersionInfo {
  version: string;
  buildNumber: number;
  platform: 'android' | 'ios';
  updateType: 'optional' | 'required' | 'force';
  releaseNotes: string;
  downloadUrl: string;
  fileSize: number;
  checksum: string;
  minSupportedVersion: string;
  forceUpdate: boolean;
  updateDeadline?: string;
}

// 版本检查响应接口
export interface VersionCheckResponse {
  code: number;
  msg: string;
  data: {
    hasUpdate: boolean;
    latestVersion: string;
    currentVersion: string;
    updateType: string;
    updateSize: string;
    releaseNotes: string;
    downloadUrl: string;
    minSupportedVersion: string;
    forceUpdate: boolean;
    updateDeadline: string;
    checksum: string;
  };
}

// 版本检查请求参数
export interface VersionCheckRequest {
  platform: 'android' | 'ios';
  currentVersion: string;
  deviceId: string;
}

export class VersionApi {
  /**
   * 检查应用版本更新
   */
  async checkVersion(params: VersionCheckRequest, retryCount: number = 0): Promise<VersionCheckResponse> {
    console.log('🔍 版本检查API请求参数:', {
      url: '/app/appVersions/version/check',
      method: 'GET',
      params: params
    });
    
    try {
      // 构建查询参数
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      const finalEndpoint = queryString ? 
        `/app/appVersions/version/check?${queryString}` : 
        '/app/appVersions/version/check';
      
      // 版本检查使用更长的超时时间（30秒）
      const response = await (apiClient as any).request(finalEndpoint, {
        method: 'GET',
        timeout: 30000 // 30秒超时
      });

      
      // 将ApiResponse格式转换为VersionCheckResponse格式
      const versionResponse: VersionCheckResponse = {
        code: response.code === 200 ? 0 : response.code || 0,
        msg: response.message || response.msg || '',
        data: {
          hasUpdate: response.data?.hasUpdate || response.hasUpdate || false,
          latestVersion: response.data?.latestVersion || response.latestVersion || '',
          currentVersion: response.data?.currentVersion || response.currentVersion || '',
          updateType: response.data?.updateType || response.updateType || '',
          updateSize: response.data?.updateSize || '',
          releaseNotes: response.data?.releaseNotes || '',
          downloadUrl: response.data?.downloadUrl || response.downloadUrl || '',
          minSupportedVersion: response.data?.minSupportedVersion || '',
          forceUpdate: response.data?.forceUpdate || false,
          updateDeadline: response.data?.updateDeadline || '',
          checksum: response.data?.checksum || ''
        }
      };
      
      console.log('📱 版本检查API响应:', {
        code: versionResponse.code,
        msg: versionResponse.msg,
        data: versionResponse.data,
        hasUpdate: versionResponse.data?.hasUpdate,
        latestVersion: versionResponse.data?.latestVersion,
        currentVersion: versionResponse.data?.currentVersion,
        updateType: versionResponse.data?.updateType,
        downloadUrl: versionResponse.data?.downloadUrl
      });
      
      return versionResponse;
    } catch (error: any) {
      console.error('❌ 版本检查API错误:', {
        error: error,
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
        retryCount
      });
      
      // 如果是超时错误且重试次数少于2次，则重试
      if (error?.message?.includes('超时') && retryCount < 2) {
        console.log(`🔄 版本检查超时，进行第${retryCount + 1}次重试...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒后重试
        return this.checkVersion(params, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * 获取版本历史记录
   */
  async getVersionHistory(platform: 'android' | 'ios'): Promise<ApiResponse<VersionInfo[]>> {
    return apiClient.get('/api/app/version/history', { 
      params: { platform } 
    });
  }

  /**
   * 报告升级状态
   */
  async reportUpgradeStatus(data: {
    deviceId: string;
    platform: 'android' | 'ios';
    fromVersion: string;
    toVersion: string;
    status: 'started' | 'completed' | 'failed';
    errorMessage?: string;
  }): Promise<ApiResponse<null>> {
    return apiClient.post('/api/app/version/upgrade-status', data);
  }

  /**
   * 获取升级统计信息
   */
  async getUpgradeStats(): Promise<ApiResponse<{
    totalUsers: number;
    upgradedUsers: number;
    upgradeRate: number;
    averageUpgradeTime: number;
  }>> {
    return apiClient.get('/api/app/version/stats');
  }
}

// 创建版本API实例
export const versionApi = new VersionApi();
