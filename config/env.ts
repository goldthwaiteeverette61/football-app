/**
 * 环境变量管理模块
 * 统一管理应用的环境变量配置
 */

import Constants from 'expo-constants';

// 环境变量接口定义
export interface EnvConfig {
  // API 配置
  API_BASE_URL: string;
  API_TIMEOUT: number;
  API_VERSION: string;
  API_ENCRYPT: boolean;
  
  // RSA 加密密钥
  RSA_PUBLIC_KEY: string;
  RSA_PRIVATE_KEY: string;
  
  // 安全加密密钥
  SECURE_CRYPTO_KEY: string;
  
  // 测试数据（仅用于开发环境）
  TEST_USERNAME: string;
  TEST_PASSWORD: string;
  TEST_PASSPHRASE: string;
  
  // 应用配置
  APP_NAME: string;
  APP_VERSION: string;
  APP_ENVIRONMENT: string;
  
  // 缓存配置
  CACHE_MAX_SIZE: number;
  CACHE_EXPIRE_TIME: number;
  
  // 日志配置
  LOG_LEVEL: string;
  LOG_ENABLE_CONSOLE: boolean;
}

// 默认配置（开发环境）
const DEFAULT_CONFIG: EnvConfig = {
  // API 配置
  API_BASE_URL: 'https://api.score.red',
  API_TIMEOUT: 10000,
  API_VERSION: 'v1',
  API_ENCRYPT: true,
  
  // RSA 加密密钥
  RSA_PUBLIC_KEY: '',
  RSA_PRIVATE_KEY: '',
  
  // 安全加密密钥
  SECURE_CRYPTO_KEY: '',
  
  // 测试数据（仅用于开发环境）
  TEST_USERNAME: 'admin',
  TEST_PASSWORD: 'admin123',
  TEST_PASSPHRASE: 'testpass123',
  
  // 应用配置
  APP_NAME: 'ScoreGPT',
  APP_VERSION: '1.3.8',
  APP_ENVIRONMENT: 'development',
  
  // 缓存配置
  CACHE_MAX_SIZE: 100000000,
  CACHE_EXPIRE_TIME: 86400000,
  
  // 日志配置
  LOG_LEVEL: 'info',
  LOG_ENABLE_CONSOLE: true,
};

/**
 * 获取环境变量值
 * @param key 环境变量键名
 * @param defaultValue 默认值
 * @returns 环境变量值
 */
function getEnvValue(key: string, defaultValue: string): string {
  // 优先从 Expo Constants 获取
  if (Constants.expoConfig?.extra?.env?.[key]) {
    return Constants.expoConfig.extra.env[key];
  }
  
  // 从 process.env 获取（Web 环境）
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key];
  }
  
  return defaultValue;
}

/**
 * 获取布尔类型环境变量
 * @param key 环境变量键名
 * @param defaultValue 默认值
 * @returns 布尔值
 */
function getBooleanEnvValue(key: string, defaultValue: boolean): boolean {
  const value = getEnvValue(key, defaultValue.toString());
  return value.toLowerCase() === 'true';
}

/**
 * 获取数字类型环境变量
 * @param key 环境变量键名
 * @param defaultValue 默认值
 * @returns 数字值
 */
function getNumberEnvValue(key: string, defaultValue: number): number {
  const value = getEnvValue(key, defaultValue.toString());
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 获取环境配置
 * @returns 环境配置对象
 */
export function getEnvConfig(): EnvConfig {
  return {
    // API 配置
    API_BASE_URL: getEnvValue('API_BASE_URL', DEFAULT_CONFIG.API_BASE_URL),
    API_TIMEOUT: getNumberEnvValue('API_TIMEOUT', DEFAULT_CONFIG.API_TIMEOUT),
    API_VERSION: getEnvValue('API_VERSION', DEFAULT_CONFIG.API_VERSION),
    API_ENCRYPT: getBooleanEnvValue('API_ENCRYPT', DEFAULT_CONFIG.API_ENCRYPT),
    
    // RSA 加密密钥
    RSA_PUBLIC_KEY: getEnvValue('RSA_PUBLIC_KEY', DEFAULT_CONFIG.RSA_PUBLIC_KEY),
    RSA_PRIVATE_KEY: getEnvValue('RSA_PRIVATE_KEY', DEFAULT_CONFIG.RSA_PRIVATE_KEY),
    
    // 安全加密密钥
    SECURE_CRYPTO_KEY: getEnvValue('SECURE_CRYPTO_KEY', DEFAULT_CONFIG.SECURE_CRYPTO_KEY),
    
    // 测试数据（仅用于开发环境）
    TEST_USERNAME: getEnvValue('TEST_USERNAME', DEFAULT_CONFIG.TEST_USERNAME),
    TEST_PASSWORD: getEnvValue('TEST_PASSWORD', DEFAULT_CONFIG.TEST_PASSWORD),
    TEST_PASSPHRASE: getEnvValue('TEST_PASSPHRASE', DEFAULT_CONFIG.TEST_PASSPHRASE),
    
    // 应用配置
    APP_NAME: getEnvValue('APP_NAME', DEFAULT_CONFIG.APP_NAME),
    APP_VERSION: getEnvValue('APP_VERSION', DEFAULT_CONFIG.APP_VERSION),
    APP_ENVIRONMENT: getEnvValue('APP_ENVIRONMENT', DEFAULT_CONFIG.APP_ENVIRONMENT),
    
    // 缓存配置
    CACHE_MAX_SIZE: getNumberEnvValue('CACHE_MAX_SIZE', DEFAULT_CONFIG.CACHE_MAX_SIZE),
    CACHE_EXPIRE_TIME: getNumberEnvValue('CACHE_EXPIRE_TIME', DEFAULT_CONFIG.CACHE_EXPIRE_TIME),
    
    // 日志配置
    LOG_LEVEL: getEnvValue('LOG_LEVEL', DEFAULT_CONFIG.LOG_LEVEL),
    LOG_ENABLE_CONSOLE: getBooleanEnvValue('LOG_ENABLE_CONSOLE', DEFAULT_CONFIG.LOG_ENABLE_CONSOLE),
  };
}

// 导出单例实例
export const envConfig = getEnvConfig();

// 导出默认配置（用于类型检查）
export { DEFAULT_CONFIG };
