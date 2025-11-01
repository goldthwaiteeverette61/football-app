import { apiClient, ApiResponse } from './apiClient';
import userInfoCache, { UserInfo } from './userInfoCache';

// 用户信息更新接口类型（不包含avatar，avatar有独立接口）
export interface SysUserProfileShortBo {
  nickName: string;
  email: string;
}

// 密码更新接口类型
export interface SysUserPasswordBo {
  oldPassword: string;
  newPassword: string;
  [key: string]: any;
}

// 支付密码设置接口类型
export interface SetPayPasswordBo {
  payPassword: string;
  [key: string]: any;
}

// user API服务类
export class UserApi {
  // 修改用户信息
  async updateProfile(data: SysUserProfileShortBo): Promise<ApiResponse<null>> {
    return apiClient.put<null>('/app/users', data);
  }

  // 修改密码
  async updatePwd(data: SysUserPasswordBo): Promise<ApiResponse<void>> {
    return apiClient.putEncrypted<void>('/app/users/updatePwd', data);
  }

  // ��置或修改支付密码
  async setPayPassword(data: SetPayPasswordBo): Promise<ApiResponse<void>> {
    return apiClient.postEncrypted<void>('/app/users/setPayPassword', data);
  }

  // 头像上传
  async uploadAvatar(fileUri: string): Promise<ApiResponse<{ imgUrl: string }>> {
    const formData = new FormData();
    formData.append('avatarfile', {
      uri: fileUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);
    
    // 添加额外的请求头
    const headers = {
      'clientid': 'e5cd7e4891bf95d1d19206ce24a7b32e',
    };
    
    return apiClient.postFormData<{ imgUrl: string }>('/app/users/avatar', formData, headers);
  }

  // 获取用户信息详细信息（带缓存）
  async getInfo(): Promise<ApiResponse<UserInfo>> {
    // 先尝试从缓存获取
    const cachedUserInfo = await userInfoCache.getUserInfo();
    if (cachedUserInfo) {
      return {
        code: 200,
        msg: '操作成功',
        data: cachedUserInfo
      };
    }

    // 缓存无效或不存在，从API获取
    try {
      // 使用缓存优化的API请求
      const response = await apiClient.request<UserInfo>(
        '/app/users/userInfo',
        { method: 'GET' }
      );
      
      // 如果API调用成功，保存到缓存
      if (response.code === 200 && response.data) {
        await userInfoCache.updateUserInfo(response.data);
      }
      
      return response;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  }

  // 强制刷新用户信息
  async refreshUserInfo(): Promise<ApiResponse<UserInfo>> {
    try {
      console.log('🔄 强制刷新用户信息...');
      const response = await apiClient.get<UserInfo>('/app/users/userInfo');
      
      console.log('📊 用户信息API响应: 成功');
      
      // 强制更新缓存（无论API响应是否成功）
      if (response.success && response.data) {
        console.log('👤 用户信息更新成功');
        await userInfoCache.forceUpdate(response.data);
        console.log('✅ 用户信息缓存强制更新完成');
      } else {
        console.warn('⚠️ API响应失败，但继续强制刷新缓存');
        // 即使API失败，也尝试清除旧缓存
        await userInfoCache.clearCache();
      }
      
      return response;
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      // 即使出错，也清除缓存确保下次重新获取
      await userInfoCache.clearCache();
      throw error;
    }
  }

  // 申请充值钱包地址（用于充值界面）
  async applyDepositWallet(): Promise<ApiResponse<{ address?: string; walletAddress?: string; network?: string; [key: string]: any }>> {
    // 使用加密POST以符合后端敏感接口规范
    return apiClient.postEncrypted('/app/users/applyDepositWallet', {});
  }

  // 清除用户信息缓存
  async clearUserInfoCache(): Promise<void> {
    await userInfoCache.clearCache();
  }

  // 切换参与状态（betType）
  async updateBetType(betType: 'normal' | 'double'): Promise<ApiResponse<null>> {
    return apiClient.put<null>(`/app/userProgress/betType?betType=${betType}`, null);
  }

}

// 创建user API实例
export const userApi = new UserApi();