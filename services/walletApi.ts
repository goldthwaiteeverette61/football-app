import { apiClient, ApiResponse } from './apiClient';

// 钱包地址接口
export interface WalletAddress {
  id: number;
  name: string;
  address: string;
  network: string;
  isDefault: boolean;
  createTime: string;
  updateTime: string;
}

// 钱包地址列表响应接口
export interface WalletAddressListResponse {
  total: number;
  rows: Array<{
    walletId: string;
    userId: number;
    address: string;
    privateKeyEncrypted: string | null;
    createdAt: string;
    name: string;
    note: string;
  }>;
  code: number;
  msg: string;
  extra: any;
}

// wallet API服务类
export class WalletApi {
  // 修改用户钱包地址
  async edit(data: BizUserWalletsBo): Promise<ApiResponse<void>> {
    return apiClient.putEncrypted<void>('/app/userWallets', data);
  }

  // 新增用户钱包地址
  async add(data: BizUserWalletsBo): Promise<ApiResponse<void>> {
    return apiClient.postEncrypted<void>('/app/userWallets', data);
  }

  // 获取用户钱包地址详细信息
  async getInfo_1(walletId: number): Promise<ApiResponse<void>> {
    return apiClient.get<void>('/app/userWallets/{walletId}');
  }

  // 查询用户钱包地址列表
  async list(bo: BizUserWalletsBo, pageQuery: PageQuery): Promise<ApiResponse<void>> {
    return apiClient.get<void>('/app/userWallets/list');
  }

  // 获取用户钱包地址列表（用于提现界面）
  async getAddressList(network?: string): Promise<ApiResponse<WalletAddressListResponse>> {
    const params = network ? { network } : {};
    return apiClient.get<WalletAddressListResponse>('/app/userWallets/list', { params });
  }

  // 删除用户钱包地址
  async remove(walletIds: number[]): Promise<ApiResponse<void>> {
    return apiClient.delete<void>('/app/userWallets/{walletIds}');
  }

  // 申请提现
  async applyWithdrawal(data: {
    amount: number;
    toWalletAddress: string;
    payPassword: string;
  }): Promise<ApiResponse<any>> {
    return apiClient.postEncrypted<any>('/app/withdrawals/apply', data);
  }

}

// 创建wallet API实例
export const walletApi = new WalletApi();