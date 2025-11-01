// API配置文件
import { envConfig } from './env';

export const API_CONFIG = {
  BASE_URL: envConfig.API_BASE_URL,
  TIMEOUT: envConfig.API_TIMEOUT,
  VERSION: envConfig.API_VERSION,
  ENCRYPT: envConfig.API_ENCRYPT,
};

// RSA加密配置
export const RSA_CONFIG = {
  PUBLIC_KEY: envConfig.RSA_PUBLIC_KEY,
  PRIVATE_KEY: envConfig.RSA_PRIVATE_KEY,
};

// API端点
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    SEND_CAPTCHA: '/auth/captcha',
    VERIFY_CAPTCHA: '/auth/verify-captcha',
  },
  
  // 用户相关
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    CHANGE_PASSWORD: '/user/change-password',
    UPLOAD_AVATAR: '/user/avatar',
    USER_STATS: '/user/stats',
  },
  
  // 钱包相关
  WALLET: {
    BALANCE: '/wallet/balance',
    TRANSACTIONS: '/wallet/transactions',
    DEPOSIT: '/wallet/deposit',
    WITHDRAW: '/wallet/withdraw',
    TRANSFER: '/wallet/transfer',
    QR_CODE: '/wallet/qr-code',
  },
  
  // 交易相关
  TRANSACTION: {
    HISTORY: '/app/transaction/history',
    DETAIL: '/app/transaction',
  },
  
  // 倍投相关
  BETTING: {
    STRATEGIES: '/betting/strategies',
    CREATE_STRATEGY: '/betting/strategies',
    UPDATE_STRATEGY: '/betting/strategies',
    DELETE_STRATEGY: '/betting/strategies',
    START_BETTING: '/betting/start',
    STOP_BETTING: '/betting/stop',
    BETTING_HISTORY: '/betting/history',
    BETTING_STATS: '/betting/stats',
  },
  
  // 发现相关
  DISCOVER: {
    FEATURED: '/discover/featured',
    CATEGORIES: '/discover/categories',
    CONTENT: '/discover/content',
    UPDATES: '/discover/updates',
    SEARCH: '/discover/search',
  },
  
  // 系统相关
  SYSTEM: {
    CONFIG: '/system/config',
    VERSION: '/system/version',
    HEALTH: '/system/health',
    NOTIFICATIONS: '/system/notifications',
  },
};

// HTTP状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  TIMEOUT_ERROR: '请求超时，请稍后重试',
  SERVER_ERROR: '服务器错误，请稍后重试',
  UNAUTHORIZED: '登录已过期，请重新登录',
  FORBIDDEN: '没有权限访问此资源',
  NOT_FOUND: '请求的资源不存在',
  VALIDATION_ERROR: '输入信息有误，请检查后重试',
  CAPTCHA_FREQUENT: '验证码获取过于频繁，请稍后再试',
  CAPTCHA_EXPIRED: '验证码已过期，请重新获取',
  CAPTCHA_INVALID: '验证码错误，请重新输入',
};


