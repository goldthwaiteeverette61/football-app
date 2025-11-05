import { setAuthContextRef } from '@/services/apiClient';
import { authApi, LoginRequest, LoginResponse, RegisterRequest } from '@/services/authApi';
import { userApi } from '@/services/userApi';
import userInfoCache, { UserInfo } from '@/services/userInfoCache';
import { useRouter } from 'expo-router';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LOGIN_CONFIG, STORAGE_KEYS } from '../constants/auth';
import { extractUserInfoFromToken, isTokenExpiredByExpireIn } from '../utils/jwt';
import secureStorage from '../utils/secureStorage';

type User = UserInfo;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string, captcha: string, captchaId?: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  refreshToken: () => Promise<void>;
  handleUnauthorized: () => Promise<void>;
  handleForbidden: () => Promise<void>;
  refreshUserInfo: () => Promise<void>;
  forceRefreshUserInfo: () => Promise<void>;
  clearUserInfoCache: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // 处理403禁止访问错误 - 跳转到首页
  const handleForbidden = useCallback(async () => {
    try {
      console.log('🚨 检测到403禁止访问错误，开始处理...');
      console.log('🔍 当前认证状态:', { isAuthenticated, loading, hasUser: !!user });
      
      // 记录错误信息
      console.log('📝 403错误详情:', {
        timestamp: new Date().toISOString(),
        user: user?.userName || '未登录用户',
        userId: user?.userId || '无用户ID'
      });
      
      // 跳转到首页
      console.log('🔄 跳转到首页...');
      router.replace('/');
      
      console.log('✅ 403错误处理完成');
    } catch (error) {
      console.error('❌ 处理403错误失败:', error);
      console.log('🔍 错误详情:', {
        errorMessage: (error as Error)?.message,
        errorStack: (error as Error)?.stack,
        errorName: (error as Error)?.name
      });
      
      // 即使处理失败，也尝试跳转到首页
      console.log('🔄 尝试备用跳转方案...');
      try {
        router.replace('/');
        console.log('✅ 备用跳转成功');
      } catch (routerError) {
        console.error('❌ 备用跳转也失败:', routerError);
      }
    }
  }, [isAuthenticated, loading, user, router]);

  // 处理401未授权错误 - 提前定义以避免初始化顺序问题
  const handleUnauthorized = useCallback(async () => {
    try {
      console.log('🚨 检测到401未授权错误，开始处理...');
      console.log('🔍 当前认证状态:', { isAuthenticated, loading, hasUser: !!user });
      
      // 清除所有认证信息 - 直接调用logout逻辑避免循环依赖
      console.log('🚪 开始登出流程...');
      
      // 调用API登出
      try {
        await authApi.logout();
        console.log('✅ API登出调用成功');
      } catch (error) {
        console.error('❌ API登出失败:', error);
      }
      
      // 无论API调用是否成功，都清除本地数据
      console.log('🧹 清除安全存储数据...');
      
      await secureStorage.removeItem(STORAGE_KEYS.USER);
      await secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await secureStorage.removeItem(STORAGE_KEYS.EXPIRE_IN);
      await secureStorage.removeItem(STORAGE_KEYS.TOKEN_CREATE_TIME);
      
      // 清除用户信息缓存
      await userInfoCache.clearCache();
      
      console.log('✅ 本地数据已清除');
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('🎉 登出流程完成！');
      
      // 跳转到登录页面
      console.log('🔄 跳转到登录页面...');
      console.log('🔍 路由跳转参数:', '/auth/login');
      
      router.replace('/auth/login');
      
      console.log('✅ 401错误处理完成');
    } catch (error) {
      console.error('❌ 处理401错误失败:', error);
      console.log('🔍 错误详情:', {
        errorMessage: (error as Error)?.message,
        errorStack: (error as Error)?.stack,
        errorName: (error as Error)?.name
      });
      
      // 即使处理失败，也尝试跳转到登录页面
      console.log('🔄 尝试备用跳转方案...');
      try {
        router.replace('/auth/login');
        console.log('✅ 备用跳转成功');
      } catch (routerError) {
        console.error('❌ 备用跳转也失败:', routerError);
      }
    }
  }, [isAuthenticated, loading, user, router]);

  useEffect(() => {
    const initializeAuth = async () => {
      await checkAuthState();
    };
    initializeAuth();
  }, []);

  // 设置API客户端的AuthContext引用
  useEffect(() => {
    setAuthContextRef({
      handleUnauthorized,
      handleForbidden,
    });
  }, [handleUnauthorized, handleForbidden]);

  // 异步加载用户数据（独立于认证状态）
  const loadUserData = async () => {
    try {
      const userData = await secureStorage.getItem(STORAGE_KEYS.USER);
      let user = null;
      
      if (userData) {
        try {
          user = JSON.parse(userData);
        } catch (error) {
          console.warn('⚠️ 解析用户数据失败:', error);
        }
      }
      
      // 如果没有用户数据，设置为null
      if (!user) {
        user = null;
      }
      
      setUser(user);
      
      // 将本地存储的用户信息同步到缓存
      try {
        await userInfoCache.updateUserInfo(user);
      } catch (error) {
        console.warn('⚠️ 同步用户信息到缓存失败:', error);
      }
    } catch (error) {
      console.error('❌ 加载用户数据失败:', error);
    }
  };

  const checkAuthState = async () => {
    const startTime = Date.now();
    try {
      
      // 开发环境调试已移除
      
      // 只检查认证相关的数据：token + expire_in + token_create_time
      const token = await secureStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const expireInStr = await secureStorage.getItem(STORAGE_KEYS.EXPIRE_IN);
      const tokenCreateTimeStr = await secureStorage.getItem(STORAGE_KEYS.TOKEN_CREATE_TIME);
      
      if (token && expireInStr && tokenCreateTimeStr) {
        console.log('📱 发现本地存储的认证信息');
        
        const expireIn = parseInt(expireInStr);
        const tokenCreateTime = parseInt(tokenCreateTimeStr);
        
        console.log('📊 Token创建时间:', new Date(tokenCreateTime).toISOString());
        console.log('📊 Token过期时间:', expireIn, '秒');
        
        // 检查token是否过期（基于expire_in）
        try {
          console.log('🔍 开始检查token是否过期...');
          const isExpired = isTokenExpiredByExpireIn(tokenCreateTime, expireIn);
          console.log('📊 Token过期检查结果:', isExpired);
          
          if (isExpired) {
            console.log('⏰ Token已过期，清除本地数据');
            await logout();
            return;
          } else {
            console.log('✅ Token仍然有效，继续认证流程');
          }
        } catch (error) {
          console.warn('⚠️ Token过期检查失败，但继续使用现有token:', error);
          // 如果过期检查失败，不强制登出，继续使用现有token
        }
        
        // 认证成功，设置认证状态
        setIsAuthenticated(true);
        console.log('✅ 认证状态已设置为true');

      } else {
        console.log('❌ 未找到有效的认证信息');
        console.log('📊 检查项目:', {
          token: !!token,
          expireIn: !!expireInStr,
          tokenCreateTime: !!tokenCreateTimeStr,
        });
        console.log('💡 认证需要: token + tokenCreateTime + expireIn');
      }
    } catch (error) {
      console.error('❌ 检查认证状态失败:', error);
      setIsAuthenticated(false);
    } finally {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`⏱️ 认证状态检查完成，耗时: ${duration}ms`);
      setLoading(false);
    }
  };

  const login = async (username: string, password: string, captcha: string, captchaId?: string) => {
    try {
      const loginData: LoginRequest = {
        clientId: LOGIN_CONFIG.CLIENT_ID,
        grantType: LOGIN_CONFIG.GRANT_TYPE,
        tenantId: LOGIN_CONFIG.TENANT_ID,
        code: captcha,
        uuid: captchaId || '',
        username,
        password,
      };

      console.log('🔐 开始登录流程...');
      const response = await authApi.login(loginData);
      
      if (response.success && response.data) {
        const loginData: LoginResponse = response.data;
        console.log('✅ 登录API调用成功');
        console.log('📊 登录响应数据:', loginData);
        
        // 从JWT token中提取用户信息
        const tokenUserInfo = extractUserInfoFromToken(loginData.access_token);
        
        // 转换为用户基本信息对象（不包含权限信息）
        const userInfo: UserInfo = {
          userId: tokenUserInfo.userId,
          userName: tokenUserInfo.userName,
          nickName: tokenUserInfo.userName, // 使用userName作为nickName
          email: '', // JWT中没有邮箱信息，需要从API获取
          loginIp: '',
          loginDate: new Date().toISOString(),
          balance: '0.00',
          balanceLock: '0.00',
          walletAddressTron: '',
          walletAddressTronQrCode: '',
          avatar: '',
          invitationCode: '',
          inviterId: '',
          payPasswordSeted: 0,
        };

        
        // 保存token创建时间
        const tokenCreateTime = Date.now();
        console.log('⏰ Token创建时间:', new Date(tokenCreateTime).toISOString());
        console.log('⏰ Token过期时间:', loginData.expire_in, '秒');
        
        // 保存完整的登录响应数据到安全存储
        await secureStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userInfo));
        await secureStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, loginData.access_token);
        
        // 保存expire_in和token创建时间
        await secureStorage.setItem(STORAGE_KEYS.EXPIRE_IN, loginData.expire_in.toString());
        await secureStorage.setItem(STORAGE_KEYS.TOKEN_CREATE_TIME, tokenCreateTime.toString());
        
        console.log('💾 登录信息已保存到本地存储');
        setUser(userInfo);
        setIsAuthenticated(true);
        
        // 同时更新用户信息缓存
        await userInfoCache.updateUserInfo(userInfo);
        console.log('💾 用户信息已保存到缓存');
        
        console.log('🎉 登录流程完成！');
      } else {
        throw new Error(response.message || '登录失败');
      }
    } catch (error) {
      console.error('❌ 登录失败:', error);
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const response = await authApi.register(data);
      
      if (response.success) {
        // 注册成功，不需要自动登录
        return;
      } else {
        throw new Error(response.message || '注册失败');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 开始登出流程...');
      
      // 调用API登出
      await authApi.logout();
      console.log('✅ API登出调用成功');
    } catch (error) {
      console.error('❌ API登出失败:', error);
    } finally {
      // 无论API调用是否成功，都清除本地数据
      console.log('🧹 清除安全存储数据...');
      
      await secureStorage.removeItem(STORAGE_KEYS.USER);
      await secureStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await secureStorage.removeItem(STORAGE_KEYS.EXPIRE_IN);
      await secureStorage.removeItem(STORAGE_KEYS.TOKEN_CREATE_TIME);
      
      // 清除用户信息缓存
      await userInfoCache.clearCache();
      
      console.log('✅ 本地数据已清除');
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('🎉 登出流程完成！');
    }
  };

  const refreshToken = async () => {
    // 注意：后台不返回refresh_token，不是标准JWT流程
    // 此函数保留接口兼容性，但实际不执行任何操作
    console.log('⚠️ refreshToken函数被调用，但后台不支持refresh_token');
    throw new Error('后台不支持refresh_token，请重新登录');
  };



  // 刷新用户信息（智能缓存策略）
  const refreshUserInfo = useCallback(async () => {
    try {
      // 检查缓存是否有效
      const isCacheValid = userInfoCache.isCacheValid();
      const cachedUserInfo = userInfoCache.getCachedUserInfo();
      console.log('🔍 缓存状态检查:', { 
        hasUser: !!user, 
        isCacheValid, 
        cacheExists: !!cachedUserInfo 
      });
      
      // 如果缓存有效且用户信息存在，使用缓存
      if (user && isCacheValid) {
        console.log('✅ 使用有效的用户信息缓存');
        return;
      }

      console.log('🔄 缓存无效或用户信息不存在，开始刷新用户信息...');
      const response = await userApi.refreshUserInfo();
      
      if (response.success && response.data) {
        console.log('📊 用户信息API响应:', response.data);
        
        // 更新内存状态
        setUser(response.data);
        // 更新缓存
        await userInfoCache.updateUserInfo(response.data);
        console.log('✅ 用户信息刷新成功并已缓存:', response.data);
      } else {
        console.warn('⚠️ 用户信息刷新失败:', response.message || '未知错误');
      }
    } catch (error) {
      console.error('❌ 刷新用户信息失败:', error);
    }
  }, [user]);

  // 强制刷新用户信息（绕过缓存检查）
  const forceRefreshUserInfo = useCallback(async () => {
    try {
      console.log('🔄 强制刷新用户信息（绕过缓存检查）...');
      const response = await userApi.refreshUserInfo();
      
      if (response.success && response.data) {
        console.log('📊 用户信息API响应:', response.data);
        
        // 更新内存状态
        setUser(response.data);
        // 更新缓存
        await userInfoCache.updateUserInfo(response.data);
        console.log('✅ 用户信息强制刷新成功并已缓存:', response.data);
      } else {
        console.warn('⚠️ 用户信息强制刷新失败:', response.message || '未知错误');
      }
    } catch (error) {
      console.error('❌ 强制刷新用户信息失败:', error);
    }
  }, []);


  // 清除用户信息缓存
  const clearUserInfoCache = async () => {
    try {
      await userApi.clearUserInfoCache();
      console.log('✅ 用户信息缓存已清除');
    } catch (error) {
      console.error('❌ 清除用户信息缓存失败:', error);
    }
  };



  const value: AuthContextType = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    refreshToken,
    handleUnauthorized,
    handleForbidden,
    refreshUserInfo,
    forceRefreshUserInfo,
    clearUserInfoCache,
  }), [user, loading, isAuthenticated, login, register, logout, refreshToken, handleUnauthorized, handleForbidden, refreshUserInfo, forceRefreshUserInfo, clearUserInfoCache]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

