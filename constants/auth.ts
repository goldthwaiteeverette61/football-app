/**
 * 认证相关常量
 */

// 登录配置常量
export const LOGIN_CONFIG = {
  CLIENT_ID: 'e5cd7e4891bf95d1d19206ce24a7b32e',
  GRANT_TYPE: 'password',
  TENANT_ID: '000000',
} as const;

// 注册配置常量
export const REGISTER_CONFIG = {
  CLIENT_ID: 'e5cd7e4891bf95d1d19206ce24a7b32e',
  GRANT_TYPE: 'password',
  USER_TYPE: 'app_user',
  TENANT_ID: '000000',
} as const;

// API请求头常量
export const API_HEADERS = {
  CLIENT_ID: 'e5cd7e4891bf95d1d19206ce24a7b32e',
} as const;

// 默认登录模型
export const DEFAULT_LOGIN_MODEL = {
  clientId: LOGIN_CONFIG.CLIENT_ID,
  grantType: LOGIN_CONFIG.GRANT_TYPE,
  tenantId: LOGIN_CONFIG.TENANT_ID,
  code: '',
  uuid: '',
  username: '',
  password: '',
} as const;

// 验证码相关常量
export const CAPTCHA_CONFIG = {
  COOLDOWN_DURATION: 30, // 验证码冷却时间（秒）
  MAX_RETRY_ATTEMPTS: 3, // 最大重试次数
} as const;

// 认证状态常量
export const AUTH_STATUS = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
} as const;

// 存储键常量
export const STORAGE_KEYS = {
  USER: 'user',
  AUTH_TOKEN: 'auth_token',
  EXPIRE_IN: 'expire_in',
  TOKEN_CREATE_TIME: 'token_create_time',
  ENCRYPTION_CONFIG: 'encryption_config',
} as const;
