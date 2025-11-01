import AsyncStorage from '@react-native-async-storage/async-storage';

// 用户基本信息接口 - 基于实际API响应
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
  // 可以根据实际API响应添加更多字段
  [key: string]: any;
}

// 缓存键名
const USER_INFO_CACHE_KEY = 'user_info_cache';
const CACHE_TIMESTAMP_KEY = 'user_info_cache_timestamp';

// 缓存有效期（毫秒）- 默认5分钟
const CACHE_DURATION = 5 * 60 * 1000;

class UserInfoCache {
  private static instance: UserInfoCache;
  private cache: UserInfo | null = null;
  private lastUpdateTime: number = 0;

  private constructor() {}

  static getInstance(): UserInfoCache {
    if (!UserInfoCache.instance) {
      UserInfoCache.instance = new UserInfoCache();
    }
    return UserInfoCache.instance;
  }

  /**
   * 从本地存储加载用户信息
   */
  async loadFromStorage(): Promise<UserInfo | null> {
    try {
      const [userInfoStr, timestampStr] = await Promise.all([
        AsyncStorage.getItem(USER_INFO_CACHE_KEY),
        AsyncStorage.getItem(CACHE_TIMESTAMP_KEY)
      ]);

      if (!userInfoStr || !timestampStr) {
        console.log('📭 没有找到用户信息缓存');
        return null;
      }

      const userInfo = JSON.parse(userInfoStr);
      const timestamp = parseInt(timestampStr, 10);
      const now = Date.now();

      console.log('📖 从缓存加载用户信息:', userInfo);
      console.log('👤 缓存中的头像URL:', userInfo.avatar);

      // 检查缓存是否过期
      if (now - timestamp > CACHE_DURATION) {
        console.log('⏰ 用户信息缓存已过期，清除缓存');
        await this.clearCache();
        return null;
      }

      this.cache = userInfo;
      this.lastUpdateTime = timestamp;
      console.log('✅ 用户信息缓存加载成功');
      return userInfo;
    } catch (error) {
      console.error('加载用户信息缓存失败:', error);
      return null;
    }
  }

  /**
   * 保存用户信息到本地存储
   */
  async saveToStorage(userInfo: UserInfo): Promise<void> {
    try {
      console.log('💾 保存用户信息到缓存:', userInfo);
      console.log('👤 头像URL:', userInfo.avatar);
      
      const timestamp = Date.now();
      await Promise.all([
        AsyncStorage.setItem(USER_INFO_CACHE_KEY, JSON.stringify(userInfo)),
        AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp.toString())
      ]);

      this.cache = userInfo;
      this.lastUpdateTime = timestamp;
      console.log('✅ 用户信息缓存保存成功');
    } catch (error) {
      console.error('保存用户信息缓存失败:', error);
    }
  }

  /**
   * 获取缓存的用户信息
   */
  getCachedUserInfo(): UserInfo | null {
    return this.cache;
  }

  /**
   * 检查缓存是否有效
   */
  isCacheValid(): boolean {
    if (!this.cache || !this.lastUpdateTime) {
      return false;
    }
    return Date.now() - this.lastUpdateTime < CACHE_DURATION;
  }

  /**
   * 强制更新用户信息
   */
  async forceUpdate(userInfo: UserInfo): Promise<void> {
    await this.saveToStorage(userInfo);
  }

  /**
   * 清除缓存
   */
  async clearCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(USER_INFO_CACHE_KEY),
        AsyncStorage.removeItem(CACHE_TIMESTAMP_KEY)
      ]);
      this.cache = null;
      this.lastUpdateTime = 0;
    } catch (error) {
      console.error('清除用户信息缓存失败:', error);
    }
  }

  /**
   * 获取用户信息（优先从缓存，缓存无效时返回null）
   */
  async getUserInfo(): Promise<UserInfo | null> {
    // 如果内存中有有效缓存，直接返回
    if (this.isCacheValid()) {
      return this.cache;
    }

    // 尝试从本地存储加载
    const userInfo = await this.loadFromStorage();
    return userInfo;
  }

  /**
   * 更新用户信息
   */
  async updateUserInfo(userInfo: UserInfo): Promise<void> {
    await this.saveToStorage(userInfo);
  }

  /**
   * 检查是否需要更新
   */
  needsUpdate(): boolean {
    return !this.isCacheValid();
  }
}

export default UserInfoCache.getInstance();
