import { apiClient, ApiResponse } from './apiClient';

// dashboard API服务类
export class DashboardApi {
  // 数据摘要
  async getSchemeSummary(): Promise<ApiResponse<void>> {
    return apiClient.get<void>('/app/dashboard/scheme-summary');
  }

}

// 创建dashboard API实例
export const dashboardApi = new DashboardApi();