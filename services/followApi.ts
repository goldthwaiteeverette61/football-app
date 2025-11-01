import { apiClient, ApiResponse } from './apiClient';

// follow API服务类
export class FollowApi {
  // 跟投方案
  async follow(data: FollowSchemeDto): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/app/userFollows/follow', data);
  }

  // 查询我的跟投记录列表
  async myList(bo: BizUserFollowsBo, pageQuery: PageQuery): Promise<ApiResponse<void>> {
    return apiClient.get<void>('/app/userFollows/myList');
  }

  // 获取当前用户最小下注金额
  async getMinBetAmount(): Promise<ApiResponse<void>> {
    return apiClient.get<void>('/app/userFollows/min-bet-amount');
  }

}

// 创建follow API实例
export const followApi = new FollowApi();