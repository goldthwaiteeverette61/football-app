import { apiClient, type ApiResponse } from './apiClient';

// 理赔申请相关类型定义
export interface ClaimRequest {
  id?: string;
  orderId: string;
  claimType: 'refund' | 'compensation' | 'dispute';
  reason: string;
  description: string;
  amount?: number;
  attachments?: string[];
  status?: 'pending' | 'processing' | 'approved' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
}

export interface ClaimResponse {
  id: string;
  userId: number;
  amount: string;
  currency: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESET';
  remarks: string;
  createTime: string;
  lostCount: number;
  bizCode: string | null;
}

export interface ClaimListResponse {
  total: number;
  rows: ClaimResponse[];
  code: number;
  msg: string;
  extra: any;
}

// 重置倍投接口响应类型
export interface ResetLossesResponse {
  code: number;
  msg: string;
  data: any;
}

// 理赔API服务
export const claimApi = {
  // 提交理赔申请
  submitClaim: async (claimData: Omit<ClaimRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<ClaimResponse>> => {
    return apiClient.post('/claims', claimData);
  },

  // 获取理赔申请列表
  getClaims: async (params?: {
    pageNum?: number;
    pageSize?: number;
    status?: string;
    claimType?: string;
  }): Promise<ApiResponse<ClaimListResponse>> => {
    return apiClient.get('/app/reward/rewardClaimList', { params });
  },

  // 获取单个理赔申请详情
  getClaimById: async (claimId: string): Promise<ApiResponse<ClaimResponse>> => {
    return apiClient.get(`/claims/${claimId}`);
  },

  // 更新理赔申请
  updateClaim: async (claimId: string, updateData: Partial<ClaimRequest>): Promise<ApiResponse<ClaimResponse>> => {
    return apiClient.put(`/claims/${claimId}`, updateData);
  },

  // 取消理赔申请
  cancelClaim: async (claimId: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete(`/claims/${claimId}`);
  },

  // 上传理赔附件
  uploadClaimAttachment: async (claimId: string, file: FormData): Promise<ApiResponse<{ url: string }>> => {
    return apiClient.post(`/claims/${claimId}/attachments`, file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 获取理赔类型列表
  getClaimTypes: async (): Promise<ApiResponse<Array<{ value: string; label: string; description: string }>>> => {
    return apiClient.get('/claims/types');
  },

  // 获取理赔原因列表
  getClaimReasons: async (claimType: string): Promise<ApiResponse<Array<{ value: string; label: string }>>> => {
    return apiClient.get(`/claims/reasons?type=${claimType}`);
  },

  // 重置倍投
  resetLosses: async (payPassword: string): Promise<ApiResponse<ResetLossesResponse>> => {
    return apiClient.post(`/app/reward/reset-losses`, { payPassword });
  },

  // 申请理赔
  applyClaim: async (payPassword: string): Promise<ApiResponse<ResetLossesResponse>> => {
    return apiClient.post(`/app/reward/claim`, { payPassword });
  },
};
