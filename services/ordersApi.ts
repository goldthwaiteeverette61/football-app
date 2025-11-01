import type { ApiResponse } from './apiClient';
import { apiClient } from './apiClient';

// 订单状态枚举 - 用于分类查询
export type OrderStatus = 'in_cart' | 'bought' | 'settled' | 'failed';

// 中奖结果状态枚举 - 用于显示中奖状态
export type ResultStatus = 'pending' | 'won' | 'lost';

// 订单接口 - 支持多种字段名
export interface Order {
  id?: string;
  orderId?: string;
  orderNumber?: string;
  orderNo?: string;
  createTime?: string;
  createTimeStr?: string;
  status?: OrderStatus;        // 订单状态：in_cart(待出票) -> bought(已出票) -> settled(已结算) -> failed(已取消)
  resultStatus?: ResultStatus; // 中奖结果：pending(待开奖) -> won(已中奖) -> lost(未中奖)
  totalAmount?: number;
  amount?: number;
  totalOdds?: number;
  odds?: number;
  expectedReturn?: number;
  expectedAmount?: number;
  actualReturn?: number;
  actualAmount?: number;
  matches?: OrderMatch[];
  selections?: OrderMatch[];
  // 兼容其他可能的字段
  [key: string]: any;
}

// 订单比赛接口
export interface OrderMatch {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchTime: string;
  selections: OrderSelection[];
}

// 订单选择接口
export interface OrderSelection {
  betType: string;
  selection: string;
  odds: number;
  isWinning?: boolean;
}

// 订单列表查询参数
export interface OrderListParams {
  pageNum: number;
  pageSize: number;
  status?: OrderStatus;
}

// 订单列表响应 - 支持多种数据结构
export interface OrderListResponse {
  list?: Order[];
  data?: Order[];
  records?: Order[];
  total?: number;
  pageNum?: number;
  pageSize?: number;
  pages?: number;
  // 兼容其他可能的字段名
  [key: string]: any;
}

/**
 * 获取我的订单列表
 * @param params 查询参数
 * @returns 订单列表
 */
export const getMyOrders = async (params: OrderListParams): Promise<ApiResponse<OrderListResponse>> => {
  const queryParams = new URLSearchParams();
  queryParams.append('pageNum', params.pageNum.toString());
  queryParams.append('pageSize', params.pageSize.toString());
  
  if (params.status) {
    queryParams.append('status', params.status);
  }

  return apiClient.get(`/app/userFollows/myList?${queryParams.toString()}`);
};

/**
 * 获取订单详情
 * @param orderId 订单ID
 * @returns 订单详情
 */
export const getOrderDetail = async (orderId: string): Promise<ApiResponse<Order>> => {
  return apiClient.get(`/app/userFollows/detail/${orderId}`);
};

// 导出API对象
export const ordersApi = {
  getMyOrders,
  getOrderDetail,
};
