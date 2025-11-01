import { apiClient, ApiResponse } from './apiClient';

// withdrawal API服务类
export class WithdrawalApi {
  // 
  async applyWithdrawal(data: WithdrawalApplyBo): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/app/withdrawals/apply', data);
  }

}

// 创建withdrawal API实例
export const withdrawalApi = new WithdrawalApi();