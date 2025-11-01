import { apiClient, ApiResponse } from './apiClient';

// config API服务类
export class ConfigApi {
  // 配置
  async getConfigs(): Promise<ApiResponse<void>> {
    return apiClient.get<void>('/app/config/configs');
  }

}

// 创建config API实例
export const configApi = new ConfigApi();