import AsyncStorage from '@react-native-async-storage/async-storage';

// 用户权限信息接口
export interface UserPermissions {
  userId: number;
  permissions: string[]; // 权限列表
  roles: string[]; // 角色列表
  deptId: number;
  deptName: string;
  deptCategory: string;
  clientid: string;
  tenantId: string;
  loginType: string;
  loginId: string;
  rnStr: string;
  // 可以根据实际API响应添加更多权限相关字段
  [key: string]: any;
}

// 缓存键名
const USER_PERMISSIONS_CACHE_KEY = 'user_permissions_cache';
const PERMISSIONS_CACHE_TIMESTAMP_KEY = 'user_permissions_cache_timestamp';

// 权限缓存有效期（毫秒）- 默认30分钟，比用户信息缓存更长
const PERMISSIONS_CACHE_DURATION = 30 * 60 * 1000;

class UserPermissionsCache {
  private static instance: UserPermissionsCache;
  private cache: UserPermissions | null = null;
  private lastUpdateTime: number = 0;

  private constructor() {}

  static getInstance(): UserPermissionsCache {
    if (!UserPermissionsCache.instance) {
      UserPermissionsCache.instance = new UserPermissionsCache();
    }
    return UserPermissionsCache.instance;
  }

  /**
   * 从本地存储加载用户权限信息
   */
  async loadFromStorage(): Promise<UserPermissions | null> {
    try {
      const [permissionsStr, timestampStr] = await Promise.all([
        AsyncStorage.getItem(USER_PERMISSIONS_CACHE_KEY),
        AsyncStorage.getItem(PERMISSIONS_CACHE_TIMESTAMP_KEY)
      ]);

      if (!permissionsStr || !timestampStr) {
        console.log('📭 没有找到用户权限信息缓存');
        return null;
      }

      const permissions = JSON.parse(permissionsStr);
      const timestamp = parseInt(timestampStr, 10);
      const now = Date.now();

      console.log('📖 从缓存加载用户权限信息:', permissions);

      // 检查缓存是否过期
      if (now - timestamp > PERMISSIONS_CACHE_DURATION) {
        console.log('⏰ 用户权限信息缓存已过期，清除缓存');
        await this.clearCache();
        return null;
      }

      this.cache = permissions;
      this.lastUpdateTime = timestamp;
      console.log('✅ 用户权限信息缓存加载成功');
      return permissions;
    } catch (error) {
      console.error('加载用户权限信息缓存失败:', error);
      return null;
    }
  }

  /**
   * 保存用户权限信息到本地存储
   */
  async saveToStorage(permissions: UserPermissions): Promise<void> {
    try {
      console.log('💾 保存用户权限信息到缓存:', permissions);
      
      const timestamp = Date.now();
      await Promise.all([
        AsyncStorage.setItem(USER_PERMISSIONS_CACHE_KEY, JSON.stringify(permissions)),
        AsyncStorage.setItem(PERMISSIONS_CACHE_TIMESTAMP_KEY, timestamp.toString())
      ]);

      this.cache = permissions;
      this.lastUpdateTime = timestamp;
      console.log('✅ 用户权限信息缓存保存成功');
    } catch (error) {
      console.error('保存用户权限信息缓存失败:', error);
    }
  }

  /**
   * 获取缓存的用户权限信息
   */
  getCachedPermissions(): UserPermissions | null {
    return this.cache;
  }

  /**
   * 检查缓存是否有效
   */
  isCacheValid(): boolean {
    if (!this.cache || !this.lastUpdateTime) {
      return false;
    }
    return Date.now() - this.lastUpdateTime < PERMISSIONS_CACHE_DURATION;
  }

  /**
   * 强制更新用户权限信息
   */
  async forceUpdate(permissions: UserPermissions): Promise<void> {
    await this.saveToStorage(permissions);
  }

  /**
   * 清除缓存
   */
  async clearCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(USER_PERMISSIONS_CACHE_KEY),
        AsyncStorage.removeItem(PERMISSIONS_CACHE_TIMESTAMP_KEY)
      ]);
      this.cache = null;
      this.lastUpdateTime = 0;
      console.log('✅ 用户权限信息缓存已清除');
    } catch (error) {
      console.error('清除用户权限信息缓存失败:', error);
    }
  }

  /**
   * 获取用户权限信息（优先从缓存，缓存无效时返回null）
   */
  async getPermissions(): Promise<UserPermissions | null> {
    // 如果内存中有有效缓存，直接返回
    if (this.isCacheValid()) {
      return this.cache;
    }

    // 尝试从本地存储加载
    const permissions = await this.loadFromStorage();
    return permissions;
  }

  /**
   * 更新用户权限信息
   */
  async updatePermissions(permissions: UserPermissions): Promise<void> {
    await this.saveToStorage(permissions);
  }

  /**
   * 检查是否需要更新
   */
  needsUpdate(): boolean {
    return !this.isCacheValid();
  }

  /**
   * 检查用户是否有特定权限
   */
  hasPermission(permission: string): boolean {
    if (!this.cache || !this.cache.permissions) {
      return false;
    }
    return this.cache.permissions.includes(permission);
  }

  /**
   * 检查用户是否有特定角色
   */
  hasRole(role: string): boolean {
    if (!this.cache || !this.cache.roles) {
      return false;
    }
    return this.cache.roles.includes(role);
  }

  /**
   * 获取用户所有权限
   */
  getAllPermissions(): string[] {
    return this.cache?.permissions || [];
  }

  /**
   * 获取用户所有角色
   */
  getAllRoles(): string[] {
    return this.cache?.roles || [];
  }
}

export default UserPermissionsCache.getInstance();
