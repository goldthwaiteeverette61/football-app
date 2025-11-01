import { apiClient, ApiResponse } from './apiClient';

// reward API服务类
export class RewardApi {
  // 重置连输记录
  async resetLosses(): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/app/reward/reset-losses');
  }

  // 
  async claim(): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/app/reward/claim');
  }

  // 查询理赔状态
  async status(): Promise<ApiResponse<void>> {
    return apiClient.get<void>('/app/reward/status');
  }

  // 查询理赔申请列表
  async rewardClaimList(bo: BizRewardClaimBo, pageQuery: PageQuery): Promise<ApiResponse<void>> {
    return apiClient.get<void>('/app/reward/rewardClaimList');
  }

}

// 创建reward API实例
export const rewardApi = new RewardApi();