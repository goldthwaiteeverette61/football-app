import { API_ENDPOINTS } from '@/config/api';
import { apiClient, ApiResponse } from './apiClient';

// 交易记录接口
export interface TransactionRecord {
  id: number | string; // 支持大数字ID
  transactionType?: string; // 可能为undefined
  amount?: any; // 可能是number、string或其他类型
  otherPartyUsername?: string; // 可能为undefined
  remarks?: string; // 可能为undefined
  status?: string; // 可能为undefined
  createdAt?: string; // 可能为undefined
  createTime?: string; // 交易详情API返回的时间字段
  // 交易详情API的额外字段
  blockchainNetwork?: string;
  currency?: string;
  sourceId?: string;
  toAddress?: string;
  userId?: number;
  withdrawalDetails?: any;
}

// 交易记录列表响应接口
export interface TransactionHistoryResponse {
  total: number;
  rows: TransactionRecord[];
  code: number;
  msg: string;
}

// 交易记录查询参数接口
export interface TransactionHistoryParams {
  transactionType?: string;
  status?: string;
  pageSize?: number;
  pageNum?: number;
}

/**
 * 获取交易记录历史
 */
export async function getTransactionHistory(params: TransactionHistoryParams = {}): Promise<ApiResponse<TransactionHistoryResponse>> {
  try {
    console.log('🔄 获取交易记录，参数:', params);
    
    // 构建查询参数
    const queryParams: Record<string, any> = {};
    
    if (params.transactionType && params.transactionType !== 'all') {
      queryParams.transactionType = params.transactionType;
    }
    
    if (params.status && params.status !== 'all') {
      queryParams.status = params.status;
    }
    
    queryParams.pageSize = params.pageSize || 10;
    queryParams.pageNum = params.pageNum || 1;
    
    console.log('🔄 构建的查询参数:', queryParams);
    
    // 使用缓存优化的API请求
    const response = await apiClient.request<TransactionHistoryResponse>(
      API_ENDPOINTS.TRANSACTION.HISTORY, 
      { 
        method: 'GET',
        params: queryParams
      }
    );
    
    console.log('📊 交易记录获取成功');
    
    return response;
  } catch (error) {
    console.error('获取交易记录失败:', error);
    throw error;
  }
}

/**
 * 获取最近交易记录（简化版，只获取前几条）
 */
export async function getRecentTransactions(limit: number = 5): Promise<ApiResponse<TransactionHistoryResponse>> {
  try {
    const params: TransactionHistoryParams = {
      pageSize: limit,
      pageNum: 1,
    };
    
    console.log('🔄 获取最近交易记录...');
    const response = await getTransactionHistory(params);
    
    console.log('📊 最近交易记录获取成功');
    
    return response;
  } catch (error) {
    console.error('获取最近交易记录失败:', error);
    throw error;
  }
}

/**
 * 获取交易详情
 */
export async function getTransactionDetail(transactionId: number | string): Promise<ApiResponse<TransactionRecord>> {
  try {
    console.log('🔄 获取交易详情，ID:', transactionId, '类型:', typeof transactionId);
    console.log('🔄 API端点:', `${API_ENDPOINTS.TRANSACTION.DETAIL}/${transactionId}`);
    
    const response = await apiClient.get<TransactionRecord>(`${API_ENDPOINTS.TRANSACTION.DETAIL}/${transactionId}`);
    
    console.log('📊 交易详情API响应:', {
      success: response.success,
      hasData: !!response.data,
      message: response.message,
      code: response.code,
      dataType: typeof response.data
    });
    
    return response;
  } catch (error) {
    console.error('❌ 获取交易详情API失败:', error);
    throw error;
  }
}

/**
 * 站內轉帳
 * POST /app/transaction/transfer
 */
export async function postInternalTransfer(data: {
  toUserName: string;
  amount: number;
  remark?: string;
  payPassword: string;
}): Promise<ApiResponse<any>> {
  try {
    // 該接口不需要加密，使用普通 POST
    const response = await apiClient.post<any>('/app/transaction/transfer', data);
    return response;
  } catch (error) {
    console.error('❌ 站內轉帳失敗:', error);
    throw error;
  }
}