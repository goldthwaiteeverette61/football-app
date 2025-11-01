import { apiClient, ApiResponse } from './apiClient';

// 登录请求接口
export interface LoginRequest {
  clientId: string;
  grantType: string;
  tenantId: string;
  code: string;
  uuid: string;
  username: string;
  password: string;
}

// 注册请求接口
export interface RegisterRequest {
  clientId: string;
  tenantId: string;
  grantType: string;
  username: string;
  password: string;
  userType: string;
  email: string;
  code: string;
  uuid: string;
  invitationCode: string;
}

// 旧版用户信息接口（保留兼容性）
export interface LegacyUserInfo {
  userId: string;
  username: string;
  email: string;
  avatar?: string;
  roles: string[];
}

// 登录响应接口
export interface LoginResponse {
  scope: string | null;
  openid: string | null;
  access_token: string;
  refresh_token: string | null;
  expire_in: number;
  refresh_expire_in: number | null;
  client_id: string;
}

// 用户信息接口（从JWT token中解析）
export interface UserInfo {
  loginType: string;
  loginId: string;
  rnStr: string;
  clientid: string;
  tenantId: string;
  userId: number;
  userName: string;
  deptId: number;
  deptName: string;
  deptCategory: string;
}

// 验证码响应接口
export interface CaptchaResponse {
  captchaEnabled: boolean;
  uuid: string;
  img: string;
}

// auth API服务类
export class AuthApi {
  // 用户登录
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiClient.postEncrypted<LoginResponse>('/app/auth/login', data);
  }

  // 用户注册
  async register(data: RegisterRequest): Promise<ApiResponse<void>> {
    return apiClient.postEncrypted<void>('/auth/register', data);
  }

  // 获取验证码
  async getCaptcha(): Promise<ApiResponse<CaptchaResponse>> {
    return apiClient.get<CaptchaResponse>('/app/auth/code');
  }

  // 用户登出
  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/logout');
  }

  // 刷新Token
  async refreshToken(token: string): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>('/auth/refresh', { token });
  }
}

// 创建auth API实例
export const authApi = new AuthApi();