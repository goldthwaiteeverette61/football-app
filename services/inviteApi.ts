import { apiClient, ApiResponse } from './apiClient';

// 邀请统计接口
export interface InviteStats {
  totalInvites: number;        // 总邀请人数
  totalEarnings: string;      // 累计收益
  monthlyInvites: number;      // 本月邀请人数
  thisMonthEarnings: string;   // 本月收益
  todayEarnings: string;      // 今日收益
}

// 邀请记录接口
export interface InviteRecord {
  id: string;
  inviteeId: string;
  inviteeNickname: string;
  inviteeAvatar?: string;
  inviteTime: string;
  status: 'pending' | 'active' | 'inactive';
  totalBetAmount: number;
  totalCommission: number;
  lastActiveTime?: string;
}

// 邀请奖励记录接口
export interface InviteReward {
  id: string;
  inviteeId: string;
  inviteeNickname: string;
  rewardType: 'commission' | 'first_deposit' | 'bonus';
  amount: number;
  description: string;
  createTime: string;
  status: 'pending' | 'completed' | 'cancelled';
}

// 邀请排行榜接口
export interface InviteRanking {
  userId: string;
  nickname: string;
  avatar?: string;
  totalInvites: number;
  totalRewards: number;
  rank: number;
}

export class InviteApi {
  // 获取邀请统计信息
  async getInviteStats(): Promise<ApiResponse<InviteStats>> {
    return apiClient.get('/app/userInvitations/invitationStats');
  }

  // 获取邀请记录列表
  async getInviteRecords(pageNum: number = 1, pageSize: number = 20): Promise<ApiResponse<{
    total: number;
    rows: InviteRecord[];
  }>> {
    return apiClient.get('/app/invite/records', {
      params: { pageNum, pageSize }
    });
  }

  // 获取邀请奖励记录
  async getInviteRewards(pageNum: number = 1, pageSize: number = 20): Promise<ApiResponse<{
    total: number;
    rows: InviteReward[];
  }>> {
    return apiClient.get('/app/invite/rewards', {
      params: { pageNum, pageSize }
    });
  }

  // 获取邀请排行榜
  async getInviteRanking(limit: number = 10): Promise<ApiResponse<InviteRanking[]>> {
    return apiClient.get('/app/invite/ranking', {
      params: { limit }
    });
  }

  // 生成邀请链接
  async generateInviteLink(): Promise<ApiResponse<{
    inviteCode: string;
    inviteLink: string;
    qrCode: string;
  }>> {
    return apiClient.post('/app/invite/generate-link');
  }

  // 获取邀请规则
  async getInviteRules(): Promise<ApiResponse<{
    commissionRate: number;      // 佣金比例
    firstDepositRate: number;    // 首充奖励比例
    bonusAmount: number;         // 邀请奖励金额
    minBetAmount: number;        // 最小投注金额
    rules: string[];             // 规则说明
  }>> {
    return apiClient.get('/app/invite/rules');
  }

  // 申请提现邀请奖励
  async withdrawInviteRewards(amount: number): Promise<ApiResponse<{
    transactionId: string;
    amount: number;
    status: string;
  }>> {
    return apiClient.post('/app/invite/withdraw', {
      amount
    });
  }

  // 获取邀请详情
  async getInviteDetail(inviteeId: string): Promise<ApiResponse<{
    inviteRecord: InviteRecord;
    rewardHistory: InviteReward[];
    betHistory: Array<{
      id: string;
      amount: number;
      commission: number;
      createTime: string;
    }>;
  }>> {
    return apiClient.get(`/app/invite/detail/${inviteeId}`);
  }
}

export const inviteApi = new InviteApi();
export default inviteApi;
