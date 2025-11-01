import apiClient, { ApiResponse } from './apiClient';
import { UserPermissions } from './userPermissionsCache';

/**
 * 获取用户权限信息
 */
export async function getUserPermissions(): Promise<ApiResponse<UserPermissions>> {
  try {
    console.log('🔄 获取用户权限信息...');
    const response = await apiClient.get<UserPermissions>('/app/users/permissions');
    
    console.log('📊 用户权限信息获取成功');
    
    return response;
  } catch (error) {
    console.error('获取用户权限信息失败:', error);
    throw error;
  }
}

/**
 * 刷新用户权限信息
 */
export async function refreshUserPermissions(): Promise<ApiResponse<UserPermissions>> {
  try {
    console.log('🔄 获取用户权限信息...');
    const response = await apiClient.get<UserPermissions>('/app/users/permissions');
    
    console.log('📊 用户权限信息获取成功');
    
    return response;
  } catch (error) {
    console.error('刷新用户权限信息失败:', error);
    throw error;
  }
}
