import { apiClient } from './apiClient';

export const getCustomerServiceInfo = async () => {
  try {
    const response = await apiClient.get('/app/dict/data/type/customer_service');
    return response.data;
  } catch (error) {
    console.error('获取客服信息失败:', error);
    throw error;
  }
};