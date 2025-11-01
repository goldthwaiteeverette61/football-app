import { apiClient, ApiResponse } from './apiClient';

// 倍投策略接口
export interface BettingStrategy {
  id: string;
  name: string;
  description: string;
  baseAmount: number;
  multiplier: number;
  maxRounds: number;
  targetProfit: number;
  stopLoss: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 创建策略请求接口
export interface CreateStrategyRequest {
  name: string;
  description?: string;
  baseAmount: number;
  multiplier: number;
  maxRounds: number;
  targetProfit?: number;
  stopLoss?: number;
}

// 倍投API服务类
export class BettingApi {
  // 获取策略列表
  async getStrategies(): Promise<ApiResponse<BettingStrategy[]>> {
    return apiClient.get<BettingStrategy[]>('/betting/strategies');
  }

  // 创建策略
  async createStrategy(data: CreateStrategyRequest): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/betting/strategies', data);
  }
}

// 创建倍投API实例
export const bettingApi = new BettingApi();
