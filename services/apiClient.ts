import { API_CONFIG, ERROR_MESSAGES, HTTP_STATUS } from '@/config/api';
import { API_HEADERS } from '../constants/auth';
import { encryptBase64, encryptWithAes, encryptWithRSA, generateAesKey } from '../utils/crypto';
import secureStorage from '../utils/secureStorage';
import { getErrorService } from './errorService';

// 全局AuthContext引用，用于处理401错误
let authContextRef: any = null;

// 设置AuthContext引用的函数
export const setAuthContextRef = (ref: any) => {
  authContextRef = ref;
};

// 请求配置接口
interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>; // 查询参数
  timeout?: number;
  encrypt?: boolean; // 是否加密请求体
}

// API响应接口
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}

  // API客户端类
class ApiClient {
  private baseURL: string;
  private timeout: number;
  private activeRequests: Map<string, Promise<any>> = new Map();

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // 获取认证token
  private async getAuthToken(): Promise<string | null> {
    try {
      const token = await secureStorage.getItem('auth_token');
      return token;
    } catch (error) {
      console.error('❌ 获取token失败:', error);
      return null;
    }
  }

  // 设置认证token
  private async setAuthToken(token: string): Promise<void> {
    try {
      await secureStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('保存token失败:', error);
    }
  }

  // 清除认证token
  private async clearAuthToken(): Promise<void> {
    try {
      await secureStorage.removeItem('auth_token');
    } catch (error) {
      console.error('清除token失败:', error);
    }
  }


  // 构建请求头
  private async buildHeaders(customHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
    const token = await this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Clientid': API_HEADERS.CLIENT_ID,
      ...customHeaders,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  // 处理响应
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    // 模拟403错误用于测试
    if (response.url.includes('/member/user/info')) {
      console.log('🧪 模拟403 Forbidden 错误');
      const errorResponse = new Response(JSON.stringify({ message: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
      response = errorResponse;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    let data: any;
    let rawResponseText: string = '';
    
    try {
      // 先获取原始响应文本
      rawResponseText = await response.text();
      
      if (isJson) {
        try {
          data = JSON.parse(rawResponseText);
        } catch (jsonError) {
          // 如果JSON解析失败，但响应状态是成功的，尝试返回原始文本
          if (response.ok) {
            return {
              success: true,
              data: rawResponseText as T,
              message: '响应解析为文本格式',
              code: response.status,
            };
          } else {
            const errorMsg = jsonError instanceof Error ? jsonError.message : String(jsonError);
            throw new Error(`JSON解析失败: ${errorMsg}。原始响应: ${rawResponseText.substring(0, 200)}...`);
          }
        }
      } else {
        data = rawResponseText;
      }
    } catch (error: any) {
      // 提供更详细的错误信息
      const errorMessage = `响应解析失败: ${error.message}。状态码: ${response.status}，原始响应: ${rawResponseText.substring(0, 200)}...`;
      throw new Error(errorMessage);
    }

    // 处理服务器返回的 {code, msg, data} 格式
    const serverCode = data.code;
    
    // 首先检查所有响应中的401错误（无论HTTP状态码如何）
    if (serverCode === 401) {
      console.log('API返回401未授权错误，调用AuthContext处理...');
      
      // 清除本地token
      await this.clearAuthToken();
      
      // 调用AuthContext的handleUnauthorized方法
      if (authContextRef && authContextRef.handleUnauthorized) {
        try {
          await authContextRef.handleUnauthorized();
        } catch (error) {
          console.error('❌ AuthContext处理401错误失败:', error);
        }
      } else {
        console.warn('⚠️ AuthContext引用未设置，无法处理401错误');
      }
      
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (response.status === HTTP_STATUS.FORBIDDEN) {
      console.log('API返回403禁止访问错误，调用AuthContext处理...');
      
      if (authContextRef && authContextRef.handleForbidden) {
        try {
          await authContextRef.handleForbidden();
        } catch (error) {
          console.error('❌ AuthContext处理403错误失败:', error);
        }
      } else {
        console.warn('⚠️ AuthContext引用未设置，无法处理403错误');
      }
      
      throw new Error(ERROR_MESSAGES.FORBIDDEN);
    }
    
    // 然后检查HTTP状态码的401错误
    if (response.status === HTTP_STATUS.UNAUTHORIZED) {
      console.log('API返回401未授权错误，调用AuthContext处理...');
      
      // 清除本地token
      await this.clearAuthToken();
      
      // 调用AuthContext的handleUnauthorized方法
      if (authContextRef && authContextRef.handleUnauthorized) {
        try {
          await authContextRef.handleUnauthorized();
        } catch (error) {
          console.error('❌ AuthContext处理401错误失败:', error);
        }
      } else {
        console.warn('⚠️ AuthContext引用未设置，无法处理401错误');
      }
      
      throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
    }
    
    if (response.ok) {
      const isSuccess = serverCode === 200 || serverCode === 0;
      
      // 更灵活的数据提取逻辑，适应不同的后台响应格式
      let extractedData = data;
      let extractedMessage = data.msg || data.message;
      
      // 如果响应包含嵌套的data字段，优先使用嵌套数据
      if (data.data !== undefined) {
        extractedData = data.data;
      }
      
      // 如果响应包含嵌套的msg字段，优先使用嵌套消息
      if (data.msg !== undefined) {
        extractedMessage = data.msg;
      }
      
      const result = {
        success: isSuccess,
        data: extractedData,
        message: extractedMessage,
        code: serverCode || response.status,
      };
      
      // 添加调试日志，帮助识别数据结构变化
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 API响应数据结构分析:', {
          hasNestedData: data.data !== undefined,
          hasNestedMsg: data.msg !== undefined,
          serverCode,
          extractedDataType: typeof extractedData,
          extractedDataKeys: extractedData && typeof extractedData === 'object' ? Object.keys(extractedData) : null
        });
      }
      
      return result;
    } else {
      // 处理其他错误
      const errorMessage = data.msg || data.message || data.error || this.getErrorMessage(response.status);
      
      // 特殊处理code=500的情况，用于验证码频繁访问
      if (serverCode === 500) {
        const frequentError = new Error('验证码获取过于频繁，请稍后再试');
        frequentError.name = 'CAPTCHA_FREQUENT';
        throw frequentError;
      }
      
      throw new Error(errorMessage);
    }
  }

  // 获取错误消息
  private getErrorMessage(status: number): string {
    switch (status) {
      case HTTP_STATUS.BAD_REQUEST:
        return ERROR_MESSAGES.VALIDATION_ERROR;
      case HTTP_STATUS.UNAUTHORIZED:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case HTTP_STATUS.FORBIDDEN:
        return ERROR_MESSAGES.FORBIDDEN;
      case HTTP_STATUS.NOT_FOUND:
        return ERROR_MESSAGES.NOT_FOUND;
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
        return ERROR_MESSAGES.SERVER_ERROR;
      default:
        return ERROR_MESSAGES.SERVER_ERROR;
    }
  }

  // 处理验证码相关错误
  private handleCaptchaError(error: any, endpoint: string): never {
    if (endpoint.includes('/auth/code')) {
      // 检查是否是验证码频繁访问错误
      if (error.message && error.message.includes('频繁')) {
        throw new Error(ERROR_MESSAGES.CAPTCHA_FREQUENT);
      }
      if (error.message && error.message.includes('过期')) {
        throw new Error(ERROR_MESSAGES.CAPTCHA_EXPIRED);
      }
    }
    throw error;
  }

  // 构建查询参数字符串
  private buildQueryString(params: Record<string, any>): string {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  // 发送请求
  async request<T = any>(
    endpoint: string,
    config: RequestConfig = { method: 'GET' }
  ): Promise<ApiResponse<T>> {
    // 构建完整的URL，包括查询参数
    let url = `${this.baseURL}${endpoint}`;
    if (config.params) {
      url += this.buildQueryString(config.params);
    }
    
    const headers = await this.buildHeaders(config.headers);

    // 检查重复请求
    const requestKey = `${config.method}:${url}`;
    const activeRequest = this.activeRequests.get(requestKey);
    if (activeRequest) {
      console.log('🔄 等待重复请求完成:', url);
      return activeRequest;
    }
    
    // 打印完整的请求信息
    console.log('🚀 API请求:', config.method, url, config.encrypt ? '(加密)' : '');
    
    // 简化请求头日志
    console.log('📤 请求头: 已设置认证和内容类型');
    
    // 处理请求体加密
    let requestBody: string | undefined;
    if (config.body) {
      if (config.encrypt) {
        console.log('🔐 加密请求数据...');
        
        // 生成AES密钥
        const aesKey = generateAesKey();
        
        // 将AES密钥用RSA公钥加密
        const encryptedAesKey = encryptWithRSA(encryptBase64(aesKey));
        
        // 用AES密钥加密请求数据
        const encryptedData = encryptWithAes(JSON.stringify(config.body), aesKey);
        
        // 设置请求头和请求体
        headers['Encrypt-Key'] = encryptedAesKey;
        requestBody = encryptedData;
        
      } else {
        requestBody = JSON.stringify(config.body);
      }
    }
    
    const requestConfig: RequestInit = {
      method: config.method,
      headers,
      body: requestBody,
    };

    try {
      // 创建超时控制器
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout || this.timeout);

      const requestPromise = fetch(url, {
        ...requestConfig,
        signal: controller.signal,
      }).then(async (response) => {
        clearTimeout(timeoutId);
        
        // 简化响应信息
        console.log('📥 API响应: 状态', response.status, response.statusText);
        
        const result = await this.handleResponse<T>(response);
        
        
        return result;
      }).finally(() => {
        // 清理活跃请求
        this.activeRequests.delete(requestKey);
      });

      // 记录活跃请求
      this.activeRequests.set(requestKey, requestPromise);
      
      return await requestPromise;
    } catch (error: any) {
      // 使用增强的错误处理服务（安全调用，不阻塞主流程）
      try {
        await getErrorService().handleApiError(error, {
          endpoint,
          method: config.method,
          timestamp: Date.now(),
        });
      } catch (errorServiceError) {
        console.warn('错误处理服务异常:', errorServiceError);
      }
      
      if (error.name === 'AbortError') {
        throw new Error(ERROR_MESSAGES.TIMEOUT_ERROR);
      }
      
      if (error.message && error.message.includes('Network request failed')) {
        throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }

      // 处理验证码相关错误
      this.handleCaptchaError(error, endpoint);
    } finally {
      console.log('🚀 ========== API请求结束 ==========');
    }
  }

  // GET请求
  async get<T = any>(
    endpoint: string, 
    options?: { 
      headers?: Record<string, string>; 
      params?: Record<string, any>; 
    }
  ): Promise<ApiResponse<T>> {
    let finalEndpoint = endpoint;
    
    // 处理query参数
    if (options?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      const queryString = searchParams.toString();
      if (queryString) {
        finalEndpoint = `${endpoint}?${queryString}`;
      }
    }
    
    return this.request<T>(finalEndpoint, { 
      method: 'GET', 
      headers: options?.headers 
    });
  }

  // POST请求
  async post<T = any>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data,
      headers,
    });
  }

  // 加密POST请求
  async postEncrypted<T = any>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data,
      headers,
      encrypt: true,
    });
  }

  // FormData POST请求（用于文件上传）
  async postFormData<T = any>(
    endpoint: string,
    formData: FormData,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const authToken = await this.getAuthToken();
    const requestHeaders: Record<string, string> = {
      ...headers,
      // 不设置 Content-Type，让浏览器自动设置 multipart/form-data 边界
    };

    if (authToken) {
      requestHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    console.log('🔐 头像上传认证信息:', {
      hasToken: !!authToken,
      tokenPreview: authToken ? `${authToken.substring(0, 20)}...` : 'null',
      endpoint: `${this.baseURL}${endpoint}`,
      headers: requestHeaders,
      withCredentials: true
    });

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: requestHeaders,
        body: formData,
        credentials: 'include', // 等同于 withCredentials: true
      });

      console.log('📤 头像上传响应: 状态', response.status);
      return await this.handleResponse<T>(response);
    } catch (error) {
      console.error('FormData POST请求失败:', error);
      return {
        success: false,
        message: '网络请求失败',
        code: 500,
      };
    }
  }

  // 加密PUT请求
  async putEncrypted<T = any>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data,
      headers,
      encrypt: true,
    });
  }

  // PUT请求
  async put<T = any>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    console.log('🔧 PUT请求:', endpoint);
    
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data,
      headers,
    });
  }

  // DELETE请求
  async delete<T = any>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  // PATCH请求
  async patch<T = any>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data,
      headers,
    });
  }

  // 上传文件
  async uploadFile<T = any>(
    endpoint: string,
    file: FormData,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    const authHeaders = await this.buildHeaders(headers);
    // 移除Content-Type，让浏览器自动设置multipart/form-data
    delete authHeaders['Content-Type'];

    return this.request<T>(endpoint, {
      method: 'POST',
      body: file,
      headers: authHeaders,
    });
  }
}

// 创建API客户端实例
export const apiClient = new ApiClient();

// 导出类型
export type { ApiResponse, RequestConfig };


