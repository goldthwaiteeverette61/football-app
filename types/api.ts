/**
 * API 相关类型定义
 * 统一管理所有 API 请求和响应的类型
 */

// 基础分页查询类型
export interface PageQuery {
  pageNum: number;
  pageSize: number;
}

// 基础分页响应类型
export interface PageResponse<T> {
  records: T[];
  total: number;
  pages: number;
  current: number;
  size: number;
}

// 跟投相关类型
export interface FollowSchemeDto {
  schemeId: string;
  betAmount: number;
}

export interface BizUserFollowsBo {
  userId?: string;
  schemeId?: string;
  status?: string;
}

// 比赛相关类型
export interface BizMatchesBo {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchTime: string;
  status: string;
}

// 奖励相关类型
export interface BizRewardClaimBo {
  rewardId: string;
  userId: string;
  amount: number;
  status: string;
}

// 钱包相关类型
export interface BizUserWalletsBo {
  userId: string;
  walletType: string;
  balance: number;
  frozenAmount: number;
}

// 提现相关类型
export interface WithdrawalApplyBo {
  userId: string;
  amount: number;
  address: string;
  network: string;
  password: string;
}

// 最小下注金额响应类型
export interface MinBetAmountResponse {
  minimumBetAmount: number;
  baseBetAmount: number;
}

// 方案相关类型
export interface SchemeSummaryData {
  schemeId: string;
  schemeName: string;
  status: string;
  totalAmount: number;
  systemReserveAmount: string;
  cumulativeLostAmountSinceWin: string;
  currentPeriodFollowAmount: string;
  cumulativeLostBetCountSinceWin: number;
  compensationStatus: boolean;
  betAmount: string | null;
  commissionRate: string;
  betType: 'normal' | 'double';
  winCount: number;
  loseCount: number;
  totalBetCount: number;
}

export interface SchemePeriodData {
  periodId: string;
  status: string;
  name: string;
  createTime: string;
  endTime: string;
  betAmount: number;
  result: string;
  resultTime: string;
  deadlineTime: string;
  details: any[];
}

export interface SchemeSummaryResponse {
  code: number;
  msg: string;
  data: SchemeSummaryData;
}

export interface SchemePeriodResponse {
  code: number;
  msg: string;
  data: SchemePeriodData;
}

// 订单状态类型
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// 用户信息类型
export interface UserInfo {
  userId: number;
  userName: string;
  nickName: string;
  email: string;
  loginIp: string;
  loginDate: string;
  balance: string;
  balanceLock: string;
  walletAddressTron: string;
  walletAddressTronQrCode: string;
  avatar: string;
  invitationCode: string;
  inviterId: string;
  payPasswordSeted: number;
  [key: string]: any;
}

// 文件信息类型
export interface FileInfo {
  exists: boolean;
  uri: string;
  isDirectory: boolean;
  size?: number;
}
