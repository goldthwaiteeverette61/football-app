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
  RSA_PUBLIC_KEY: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwE3M+KftxKOuY/ioGC6KpT2LWOwZTPNOt+npBh13fT+HG4+xBhhxwf+IZ0km+aRewUYUlhof/LUCo2h5aKjGwGjkg4REQW0XvactFCPFIm3lWyYS4ZrvOQX5aqSHhPQ6Ts0SA90iOPhRkzTAQcoB19ZvznvgVTzHmigrhWmQgbh/E3Sg486TjKn37cYWLhj9bg94UmcyRMfYd2K+0r6M7scWlXYZ7tnDf5zveAl6s6HUWdwyuDsTXmChjDacYwHYtrvWvNSbgc3OBxPDybsyaa3PhwMLgzsv52WU8fIofunOxTPo/MrLJOa2gbRkV1XjZp1FRCB9XB1lsHrNjL8JpQIDAQAB',
  RSA_PRIVATE_KEY: 'MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCePtqt0eKkxHmK+GNJ6YVDfaixM1fzVn9Iu6nl0iYaGFRA5jGKLtp4vT34q7JKAjsbp1qhNHSEuxY++RU7nQ8Ql0ar8ZnSmY4WPf0LFlnCPQQqdnRX9Z6obAdJ1K+agKY+9RPckGxAx3g2gCeAQkdtncHwAN8zysZuq6nqtL1lQuHHL3y6QypSpZLBDiYv1Tx1cAcmbYn5eyQDEuYktj/+yzRyS1oD7gR7+a/P9PLPEw1P/Aa363MhkUk72nvIvQqbzvf1Xxjij79/pKLTfZN3pT1W44l+Z5iYPKN4eF0Ff2qPn54AhEMqyN8bFZ5Q5sxLfkB4UV9kYHQXToSmLOnDAgMBAAECggEAC6BUkra77x0cTPCI4vJMPzQpQ7Og/5jYSzC2f9Mbx4kID6iZ9SwSExLcTbvXooZdb1+xUey3rtTMAp5sR+/3HmHu6E0c3xM3FD1DrR/cQmAXQUNostmx6W/ebTc6G6DeFfwNlIPr4CqHk4GA5XR5KP2RNR/rRjPctl7YYg0baSgOLsotX3djKx9Fj2JPvOZ04yIHkekal9i8SIcuieFbtLP4MmfU/D6ALublQwe58GdLN+iDIl+ALSsBHIQ+JaZfF//GTC/nXUgudR2bBq5yGwQSAUj6rSFES+g9HULxIUWsoFcdRbYAPMDY8mR9Jk0q4/CrH5d9ge+XOYTVwF1yiQKBgQDUGanZ9YEsbJHC7gpN5kfppncooN3Ugu93dK+3Yq610bsoKo8y9gybywgu2pxuysMbF4sye9ynCMPQ21dPYNbjAaj4IRMLcSwM5eXNE1wiXj1EhW3phik03cZHir8gDeWXVZd//LRvHLut0l2LauAW7fD0yvyE2ZalOK36a7EMdQKBgQC+/6Vr0Aq+cXVWWwYEq7A2YsgGPaS8e9hH8yrtn/Rr668uxAnPHJT8J9It9+X+xeGykZAyBxHMbvodpWXzC06x7GeyvSidJNpT10Gr/78loWYA7xMOErlXtA3HMYI+EoONrugvMnpkNEY0JG+T/+bZ4rS+Bp6k+umljYtCOr02VwKBgCWc33gdh2i/YCH3YLBr0/jlYmA8Ftqm1ZyTfs3AnEb2CICY+4gIBjhiivL0JaWoI21cgXzUZk7gyQjyvMsA21qqYrKN+vieezdWVahGdKJLoAXUu6cb+Za8dXseacJfdIWf0hwKTl0d9VJf6eLdcxvd2ksu7BULGSH3qTKtglo5AoGBAL7AOslN4S0JyxIPnhcUEMyAIxx4fAnx9bMF3B2t3kHaA/9EsjcyaGjcrEBUkFK99gaM8eHExbXSL+FjyknNRS7U10vfNqyanaGWHXRV2uUOJ/1Ox00KzigVHp2NiHHNs6zQvfpFA48H1gVFTloU/M0maTRPECncnXRFxIrEdyvJAoGBAIYNf7X4E+INU6ypZUEYyXDDRFZmn9Q2EWpl6++LDFYQRIBled2RmZ3Uu/ctVcdAUieR9OlNoCc4HW/PC2mN+RLqkvG1canwH9VoOTiaYiBnm0H58FZeDrd9c0Ara4sUe7IUsh4DtRswlaALiY6rAiGiqAl6e8ffEcTWRzQgkwZb',
  
  // 安全加密密钥
  SECURE_CRYPTO_KEY: 'score-app-secure-key-2024',
  
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
