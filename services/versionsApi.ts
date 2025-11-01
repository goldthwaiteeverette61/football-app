import { apiClient, ApiResponse } from './apiClient';

// versions API服务类
export class VersionsApi {
  // 获取应用版本管理详细信息
  async defaultOne(): Promise<ApiResponse<void>> {
    return apiClient.get<void>('/app/appVersion/update');
  }

}

// 创建versions API实例
export const versionsApi = new VersionsApi();