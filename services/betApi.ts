import { apiClient, ApiResponse } from './apiClient';

// bet API服务类
export class BetApi {
  // 理赔金
  async getInfo_2(): Promise<ApiResponse<void>> {
    return apiClient.get<void>('/app/Bets/reserve');
  }

}

// 创建bet API实例
export const betApi = new BetApi();