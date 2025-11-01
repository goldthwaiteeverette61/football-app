/**
 * 足球计算器API服务
 */

import { apiClient } from './apiClient';
import { ApiResponse } from './index';

// 比赛请求参数接口
export interface MatchesRequest {
  poolCodes?: string[];
  status?: string;
  date?: string;
  pageNum?: number;
  pageSize?: number;
}

// 比赛响应接口
export interface MatchesResponse {
  list: any[];
  total: number;
  pageNum: number;
  pageSize: number;
}

// 订单列表请求参数接口
export interface BetOrderListRequest {
  pageNum?: number;
  pageSize?: number;
  status?: string; // 订单状态：待支付、已支付、已结算等
  startTime?: string;
  endTime?: string;
}

// 订单详情接口
export interface BetOrder {
  id: string;
  orderNo: string;
  betAmount: number;
  combinationType: string;
  totalOdds: number;
  expectedReturn: number;
  actualReturn?: number;
  status: string;
  createTime: string;
  settleTime?: string;
  details: Array<{
    matchId: number;
    poolCode: string;
    selection: string;
    homeTeam: string;
    awayTeam: string;
    odds: number;
    result?: string;
  }>;
}

// 订单列表响应接口
export interface BetOrderListResponse {
  list: BetOrder[];
  total: number;
  pageNum: number;
  pageSize: number;
}

// 足球计算器API服务类
export class FootballCalculatorApi {
  // 获取比赛列表
  async getMatchesList(params: MatchesRequest = {}): Promise<ApiResponse<MatchesResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params.poolCodes?.length) {
      queryParams.append('poolCodes', params.poolCodes.join(','));
    }
    if (params.status) {
      queryParams.append('status', params.status);
    }
    if (params.date) {
      queryParams.append('date', params.date);
    }
    if (params.pageNum) {
      queryParams.append('pageNum', params.pageNum.toString());
    }
    if (params.pageSize) {
      queryParams.append('pageSize', params.pageSize.toString());
    }

    const url = `/app/matches/list${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiClient.get<MatchesResponse>(url);
  }

  // 获取赔率数据
  async getOddsData(poolCodes: string[]): Promise<ApiResponse<any>> {
    const poolCodesStr = poolCodes.join(',');
    return apiClient.get<any>(`/app/odds/oddsList?poolCodes=${poolCodesStr}`);
  }

  // 获取足球计算器专用数据
  async getCalculatorData(poolCodes?: string[]): Promise<ApiResponse<any>> {
    // 使用赔率API获取足球计算器数据
    // 对应API: /app/odds/oddsList
    // 不传poolCodes参数，获取所有类型的赔率数据
    return apiClient.get<any>(`/app/odds/oddsList`);
  }

  // 获取比赛数据（简化版本）
  async getMatches(): Promise<ApiResponse<any>> {
    return this.getCalculatorData();
  }

  // 提交投注
  async submitBet(betData: {
    betAmount: number;
    combinationType: string;
    details: Array<{
      matchId: number;
      poolCode: string;
      selection: string;
    }>;
  }): Promise<ApiResponse<any>> {
    return apiClient.post<any>('/app/betOrder/placeOrder', betData);
  }

  // 获取足球计算器订单列表
  async getBetOrders(params: BetOrderListRequest = {}): Promise<ApiResponse<BetOrderListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params.pageNum) {
      queryParams.append('pageNum', params.pageNum.toString());
    }
    if (params.pageSize) {
      queryParams.append('pageSize', params.pageSize.toString());
    }
    if (params.status) {
      queryParams.append('status', params.status);
    }
    if (params.startTime) {
      queryParams.append('startTime', params.startTime);
    }
    if (params.endTime) {
      queryParams.append('endTime', params.endTime);
    }

    const url = `/app/betOrder/list${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiClient.get<BetOrderListResponse>(url);
  }

  // 获取订单详情
  async getBetOrderDetail(orderId: string): Promise<ApiResponse<BetOrder>> {
    return apiClient.get<BetOrder>(`/app/betOrder/detail/${orderId}`);
  }
}

// 导出单例实例
export const footballCalculatorApi = new FootballCalculatorApi();
