/**
 * 增强的错误处理服务
 * 提供统一的错误处理、分类、报告和恢复机制
 */

import { envConfig } from '@/config/env';
import { Platform } from 'react-native';

// 错误类型枚举
export enum ErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  TIMEOUT = 'TIMEOUT',
  STORAGE = 'STORAGE',
  CRYPTO = 'CRYPTO',
  IMAGE = 'IMAGE',
  UNKNOWN = 'UNKNOWN',
}

// 错误严重程度
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// 错误恢复策略
export enum RecoveryStrategy {
  RETRY = 'RETRY',
  FALLBACK = 'FALLBACK',
  IGNORE = 'IGNORE',
  LOGOUT = 'LOGOUT',
  RESTART = 'RESTART',
}

// 错误信息接口
export interface ErrorInfo {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string | number;
  details?: any;
  stack?: string;
  timestamp: number;
  context?: {
    userId?: string;
    screen?: string;
    action?: string;
    component?: string;
  };
  recovery?: {
    strategy: RecoveryStrategy;
    maxRetries?: number;
    retryDelay?: number;
    fallbackAction?: () => void;
  };
}

// 错误处理器接口
export interface ErrorHandler {
  canHandle(error: ErrorInfo): boolean;
  handle(error: ErrorInfo): Promise<void>;
}

// 错误报告器接口
export interface ErrorReporter {
  report(error: ErrorInfo): Promise<void>;
}

// 控制台错误报告器
class ConsoleErrorReporter implements ErrorReporter {
  async report(error: ErrorInfo): Promise<void> {
    const logLevel = this.getLogLevel(error.severity);
    const message = this.formatErrorMessage(error);
    
    switch (logLevel) {
      case 'error':
        console.error(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'info':
        console.info(message);
        break;
      default:
        console.log(message);
    }
  }

  private getLogLevel(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'log';
    }
  }

  private formatErrorMessage(error: ErrorInfo): string {
    const timestamp = new Date(error.timestamp).toISOString();
    const context = error.context ? ` [${Object.entries(error.context).map(([k, v]) => `${k}:${v}`).join(', ')}]` : '';
    return `[${error.type}] ${error.message}${context} (${timestamp})`;
  }
}

// 网络错误处理器
class NetworkErrorHandler implements ErrorHandler {
  canHandle(error: ErrorInfo): boolean {
    return error.type === ErrorType.NETWORK || 
           error.type === ErrorType.TIMEOUT ||
           (error.type === ErrorType.API && error.code === 'NETWORK_ERROR');
  }

  async handle(error: ErrorInfo): Promise<void> {
    // 网络错误通常可以重试
    if (error.recovery?.strategy === RecoveryStrategy.RETRY) {
      await this.retryWithBackoff(error);
    }
  }

  private async retryWithBackoff(error: ErrorInfo): Promise<void> {
    const maxRetries = error.recovery?.maxRetries || 3;
    const baseDelay = error.recovery?.retryDelay || 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)));
        // 这里应该重新执行原始操作
        console.log(`重试网络请求 (${attempt}/${maxRetries})`);
        break;
      } catch (retryError) {
        if (attempt === maxRetries) {
          throw retryError;
        }
      }
    }
  }
}

// 认证错误处理器
class AuthenticationErrorHandler implements ErrorHandler {
  canHandle(error: ErrorInfo): boolean {
    return error.type === ErrorType.AUTHENTICATION || 
           error.type === ErrorType.AUTHORIZATION ||
           (error.type === ErrorType.API && error.code === 401);
  }

  async handle(error: ErrorInfo): Promise<void> {
    if (error.recovery?.strategy === RecoveryStrategy.LOGOUT) {
      // 清除认证信息并跳转到登录页
      await this.clearAuthAndRedirect();
    }
  }

  private async clearAuthAndRedirect(): Promise<void> {
    try {
      // 清除存储的认证信息
      const { secureStorage } = await import('@/utils/secureStorage');
      await secureStorage.removeItem('auth_token');
      await secureStorage.removeItem('refresh_token');
      
      // 这里应该触发全局状态更新，跳转到登录页
      console.log('认证失败，已清除认证信息');
    } catch (error) {
      console.error('清除认证信息失败:', error);
    }
  }
}

// 验证错误处理器
class ValidationErrorHandler implements ErrorHandler {
  canHandle(error: ErrorInfo): boolean {
    return error.type === ErrorType.VALIDATION ||
           (error.type === ErrorType.API && error.code === 400);
  }

  async handle(error: ErrorInfo): Promise<void> {
    // 验证错误通常需要用户修正输入
    console.log('验证错误，需要用户修正输入:', error.message);
  }
}

// 图片错误处理器
class ImageErrorHandler implements ErrorHandler {
  canHandle(error: ErrorInfo): boolean {
    return error.type === ErrorType.IMAGE;
  }

  async handle(error: ErrorInfo): Promise<void> {
    if (error.recovery?.strategy === RecoveryStrategy.FALLBACK) {
      // 使用备用图片
      console.log('图片加载失败，使用备用图片');
      error.recovery.fallbackAction?.();
    }
  }
}

// 增强的错误处理服务
class EnhancedErrorService {
  private handlers: ErrorHandler[] = [];
  private reporters: ErrorReporter[] = [];
  private errorQueue: ErrorInfo[] = [];
  private isProcessing = false;

  constructor() {
    this.initializeHandlers();
    this.initializeReporters();
    // 延迟设置全局错误处理器，确保在客户端环境中运行
    if (Platform.OS === 'web') {
      // 使用setTimeout确保在下一个事件循环中执行
      setTimeout(() => {
        this.setupGlobalErrorHandlers();
      }, 0);
    } else {
      this.setupGlobalErrorHandlers();
    }
  }

  // 初始化错误处理器
  private initializeHandlers(): void {
    this.handlers = [
      new NetworkErrorHandler(),
      new AuthenticationErrorHandler(),
      new ValidationErrorHandler(),
      new ImageErrorHandler(),
    ];
  }

  // 初始化错误报告器
  private initializeReporters(): void {
    this.reporters = [
      new ConsoleErrorReporter(),
    ];

    // 在生产环境中可以添加远程错误报告器
    if (envConfig.APP_ENVIRONMENT === 'production') {
      // this.reporters.push(new RemoteErrorReporter());
    }
  }

  // 设置全局错误处理器
  private setupGlobalErrorHandlers(): void {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Web平台全局错误处理（仅在客户端）
      window.addEventListener('error', (event) => {
        this.handleGlobalError(event.error, {
          screen: window.location.pathname,
          action: 'global_error',
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.handleGlobalError(event.reason, {
          screen: window.location.pathname,
          action: 'unhandled_promise_rejection',
        });
      });
    } else {
      // React Native平台全局错误处理
      try {
        const { ErrorUtils } = require('react-native');
        
        // 检查ErrorUtils是否可用
        if (ErrorUtils && typeof ErrorUtils.getGlobalHandler === 'function') {
          const originalHandler = ErrorUtils.getGlobalHandler();
          
          ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
            this.handleGlobalError(error, {
              action: isFatal ? 'fatal_error' : 'non_fatal_error',
            });
            
            // 调用原始处理器
            if (originalHandler) {
              originalHandler(error, isFatal);
            }
          });
        } else {
          console.warn('ErrorUtils不可用，跳过全局错误处理器设置');
        }
      } catch (error) {
        console.warn('设置React Native全局错误处理器失败:', error);
      }
    }
  }

  // 处理全局错误
  private handleGlobalError(error: Error, context?: any): void {
    const errorInfo: ErrorInfo = {
      type: this.classifyError(error),
      severity: ErrorSeverity.HIGH,
      message: error.message || '未知错误',
      stack: error.stack,
      timestamp: Date.now(),
      context,
    };

    this.handleError(errorInfo);
  }

  // 错误分类
  private classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (name.includes('network') || message.includes('network')) {
      return ErrorType.NETWORK;
    }
    if (name.includes('timeout') || message.includes('timeout')) {
      return ErrorType.TIMEOUT;
    }
    if (name.includes('auth') || message.includes('unauthorized')) {
      return ErrorType.AUTHENTICATION;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    if (message.includes('storage') || message.includes('secure')) {
      return ErrorType.STORAGE;
    }
    if (message.includes('crypto') || message.includes('encrypt')) {
      return ErrorType.CRYPTO;
    }
    if (message.includes('image') || message.includes('picture')) {
      return ErrorType.IMAGE;
    }

    return ErrorType.UNKNOWN;
  }

  // 处理错误
  async handleError(error: ErrorInfo): Promise<void> {
    try {
      // 添加到错误队列
      this.errorQueue.push(error);

      // 异步处理错误
      this.processErrorQueue();

      // 立即报告严重错误
      if (error.severity === ErrorSeverity.CRITICAL || error.severity === ErrorSeverity.HIGH) {
        await this.reportError(error);
      }
    } catch (handlingError) {
      console.error('错误处理失败:', handlingError);
    }
  }

  // 处理错误队列
  private async processErrorQueue(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.errorQueue.length > 0) {
        const error = this.errorQueue.shift();
        if (error) {
          await this.processError(error);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  // 处理单个错误
  private async processError(error: ErrorInfo): Promise<void> {
    // 查找合适的处理器
    const handler = this.handlers.find(h => h.canHandle(error));
    
    if (handler) {
      try {
        await handler.handle(error);
      } catch (handlingError) {
        console.error('错误处理器执行失败:', handlingError);
      }
    }

    // 报告错误
    await this.reportError(error);
  }

  // 报告错误
  private async reportError(error: ErrorInfo): Promise<void> {
    for (const reporter of this.reporters) {
      try {
        await reporter.report(error);
      } catch (reportError) {
        console.error('错误报告失败:', reportError);
      }
    }
  }

  // 创建错误信息
  createError(
    type: ErrorType,
    message: string,
    options: {
      severity?: ErrorSeverity;
      code?: string | number;
      details?: any;
      context?: any;
      recovery?: {
        strategy: RecoveryStrategy;
        maxRetries?: number;
        retryDelay?: number;
        fallbackAction?: () => void;
      };
    } = {}
  ): ErrorInfo {
    return {
      type,
      severity: options.severity || ErrorSeverity.MEDIUM,
      message,
      code: options.code,
      details: options.details,
      timestamp: Date.now(),
      context: options.context,
      recovery: options.recovery,
    };
  }

  // 处理API错误
  async handleApiError(error: any, context?: any): Promise<void> {
    const errorInfo = this.createError(
      ErrorType.API,
      error.message || 'API请求失败',
      {
        severity: this.getApiErrorSeverity(error.code),
        code: error.code,
        details: error.details,
        context,
        recovery: this.getApiErrorRecovery(error.code),
      }
    );

    await this.handleError(errorInfo);
  }

  // 获取API错误严重程度
  private getApiErrorSeverity(code: number): ErrorSeverity {
    if (code >= 500) return ErrorSeverity.HIGH;
    if (code === 401 || code === 403) return ErrorSeverity.HIGH;
    if (code === 404) return ErrorSeverity.MEDIUM;
    if (code >= 400) return ErrorSeverity.MEDIUM;
    return ErrorSeverity.LOW;
  }

  // 获取API错误恢复策略
  private getApiErrorRecovery(code: number): any {
    if (code === 401) {
      return { strategy: RecoveryStrategy.LOGOUT };
    }
    if (code >= 500) {
      return { strategy: RecoveryStrategy.RETRY, maxRetries: 3, retryDelay: 1000 };
    }
    if (code === 404) {
      return { strategy: RecoveryStrategy.IGNORE };
    }
    return undefined;
  }

  // 处理网络错误
  async handleNetworkError(error: Error, context?: any): Promise<void> {
    const errorInfo = this.createError(
      ErrorType.NETWORK,
      error.message || '网络连接失败',
      {
        severity: ErrorSeverity.MEDIUM,
        context,
        recovery: {
          strategy: RecoveryStrategy.RETRY,
          maxRetries: 3,
          retryDelay: 1000,
        },
      }
    );

    await this.handleError(errorInfo);
  }

  // 处理验证错误
  async handleValidationError(message: string, details?: any, context?: any): Promise<void> {
    const errorInfo = this.createError(
      ErrorType.VALIDATION,
      message,
      {
        severity: ErrorSeverity.LOW,
        details,
        context,
      }
    );

    await this.handleError(errorInfo);
  }

  // 处理图片错误
  async handleImageError(error: Error, context?: any, fallbackAction?: () => void): Promise<void> {
    const errorInfo = this.createError(
      ErrorType.IMAGE,
      error.message || '图片加载失败',
      {
        severity: ErrorSeverity.LOW,
        context,
        recovery: {
          strategy: RecoveryStrategy.FALLBACK,
          fallbackAction,
        },
      }
    );

    await this.handleError(errorInfo);
  }

  // 添加自定义错误处理器
  addHandler(handler: ErrorHandler): void {
    this.handlers.push(handler);
  }

  // 添加自定义错误报告器
  addReporter(reporter: ErrorReporter): void {
    this.reporters.push(reporter);
  }

  // 获取错误统计
  getErrorStats(): { total: number; byType: Record<string, number>; bySeverity: Record<string, number> } {
    const stats = {
      total: this.errorQueue.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
    };

    this.errorQueue.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }

  // 清除错误队列
  clearErrors(): void {
    this.errorQueue = [];
  }
}

// 安全的单例实例创建
let errorServiceInstance: EnhancedErrorService | null = null;

export const getErrorService = (): EnhancedErrorService => {
  if (!errorServiceInstance) {
    errorServiceInstance = new EnhancedErrorService();
  }
  return errorServiceInstance;
};

// 导出单例实例（向后兼容）
export const errorService = getErrorService();
export default errorService;
