import { apiClient, ApiResponse } from './apiClient';

// matches API服务类
export class MatchesApi {
  // 获取足球计算器比赛列表 (支持按状态和日期筛选)
  async getCalculatorList(bo: BizMatchesBo): Promise<ApiResponse<void>> {
    return apiClient.get<void>('/app/matches/list');
  }

}

// 创建matches API实例
export const matchesApi = new MatchesApi();