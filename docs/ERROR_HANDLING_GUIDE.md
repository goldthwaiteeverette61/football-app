# 错误处理系统使用指南

## 概述

本项目实现了一套完整的错误处理系统，包括错误分类、处理、恢复和报告功能。

## 核心组件

### 1. ErrorService

增强的错误处理服务，提供：
- 错误分类和严重程度评估
- 自动错误处理和恢复
- 错误报告和统计
- 全局错误拦截

```typescript
import { errorService, ErrorType, ErrorSeverity, RecoveryStrategy } from '@/services/errorService';

// 处理API错误
await errorService.handleApiError(error, {
  endpoint: '/api/user/profile',
  method: 'GET',
});

// 处理网络错误
await errorService.handleNetworkError(error, {
  screen: 'ProfileScreen',
  action: 'load_user_data',
});

// 处理验证错误
await errorService.handleValidationError('用户名不能为空', {
  field: 'username',
  value: '',
});

// 创建自定义错误
const customError = errorService.createError(
  ErrorType.VALIDATION,
  '密码强度不够',
  {
    severity: ErrorSeverity.MEDIUM,
    details: { minLength: 8, hasSpecialChar: false },
    recovery: {
      strategy: RecoveryStrategy.RETRY,
      maxRetries: 3,
    },
  }
);
```

### 2. ErrorBoundary 组件

React错误边界，提供：
- 组件错误捕获
- 自动重试机制
- 用户友好的错误显示
- 开发环境调试信息

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

// 基本使用
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// 带自定义配置
<ErrorBoundary
  maxRetries={5}
  resetOnPropsChange={true}
  resetKeys={[userId]}
  onError={(error, errorInfo) => {
    console.log('组件错误:', error.message);
  }}
>
  <UserProfile userId={userId} />
</ErrorBoundary>

// 自定义fallback
<ErrorBoundary
  fallback={<CustomErrorComponent />}
>
  <YourComponent />
</ErrorBoundary>
```

### 3. useErrorHandling Hook

错误处理Hook，提供：
- 错误状态管理
- 自动重试功能
- 多种错误类型处理
- 表单错误处理

```typescript
import { useErrorHandling, useAsyncErrorHandling, useFormErrorHandling } from '@/hooks/useErrorHandling';

// 基本错误处理
function MyComponent() {
  const { error, handleError, retry, clearError } = useErrorHandling({
    onError: (error) => console.log('错误:', error.message),
    maxRetries: 3,
  });

  const handleApiCall = async () => {
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      await handleError(error, { action: 'api_call' });
    }
  };

  return (
    <View>
      {error && <EnhancedErrorDisplay error={error} onRetry={retry} />}
      <Button onPress={handleApiCall}>执行操作</Button>
    </View>
  );
}

// 异步操作错误处理
function AsyncComponent() {
  const { execute, isLoading, error } = useAsyncErrorHandling({
    onSuccess: (result) => console.log('成功:', result),
    onError: (error) => console.log('失败:', error.message),
  });

  const handleSubmit = async () => {
    const result = await execute(async () => {
      return await submitData();
    });
    
    if (result) {
      console.log('提交成功');
    }
  };

  return (
    <View>
      {error && <EnhancedErrorDisplay error={error} />}
      <Button onPress={handleSubmit} loading={isLoading}>
        提交
      </Button>
    </View>
  );
}

// 表单错误处理
function FormComponent() {
  const { fieldErrors, submitError, setFieldError, clearFieldError } = useFormErrorHandling({
    onValidationError: (field, message) => {
      console.log(`字段 ${field} 验证失败: ${message}`);
    },
  });

  const validateField = (field: string, value: string) => {
    if (!value.trim()) {
      setFieldError(field, `${field}不能为空`);
    } else {
      clearFieldError(field);
    }
  };

  return (
    <View>
      <TextInput
        onChangeText={(text) => validateField('username', text)}
        error={!!fieldErrors.username}
      />
      {fieldErrors.username && (
        <Text style={{ color: 'red' }}>{fieldErrors.username}</Text>
      )}
      
      {submitError && <EnhancedErrorDisplay error={submitError} />}
    </View>
  );
}
```

### 4. EnhancedErrorDisplay 组件

增强的错误显示组件，提供：
- 丰富的错误信息展示
- 错误类型和严重程度标识
- 可展开的详细信息
- 操作按钮（重试、报告等）

```typescript
import { EnhancedErrorDisplay } from '@/components/EnhancedErrorDisplay';

// 基本使用
<EnhancedErrorDisplay
  error={error}
  onRetry={() => console.log('重试')}
  onReport={() => console.log('报告错误')}
  onDismiss={() => setError(null)}
/>

// 紧凑模式
<EnhancedErrorDisplay
  error={error}
  compact={true}
  onDismiss={() => setError(null)}
/>

// 显示详细信息
<EnhancedErrorDisplay
  error={error}
  showDetails={true}
  onRetry={handleRetry}
/>
```

## 错误类型和严重程度

### 错误类型 (ErrorType)

- `NETWORK`: 网络连接错误
- `API`: API请求错误
- `VALIDATION`: 数据验证错误
- `AUTHENTICATION`: 认证错误
- `AUTHORIZATION`: 授权错误
- `TIMEOUT`: 请求超时
- `STORAGE`: 存储错误
- `CRYPTO`: 加密错误
- `IMAGE`: 图片处理错误
- `UNKNOWN`: 未知错误

### 错误严重程度 (ErrorSeverity)

- `LOW`: 低严重程度（如验证错误）
- `MEDIUM`: 中等严重程度（如网络错误）
- `HIGH`: 高严重程度（如认证错误）
- `CRITICAL`: 严重错误（如系统崩溃）

### 恢复策略 (RecoveryStrategy)

- `RETRY`: 重试操作
- `FALLBACK`: 使用备用方案
- `IGNORE`: 忽略错误
- `LOGOUT`: 清除认证并重新登录
- `RESTART`: 重启应用

## 使用场景

### 1. API请求错误处理

```typescript
import { useErrorHandling } from '@/hooks/useErrorHandling';

function ApiComponent() {
  const { error, handleApiError, retry } = useErrorHandling({
    maxRetries: 3,
    retryDelay: 1000,
  });

  const fetchData = async () => {
    try {
      const response = await apiClient.get('/api/data');
      return response.data;
    } catch (error) {
      await handleApiError(error, {
        endpoint: '/api/data',
        method: 'GET',
      });
    }
  };

  return (
    <View>
      {error && (
        <EnhancedErrorDisplay
          error={error}
          onRetry={retry}
        />
      )}
      <Button onPress={fetchData}>获取数据</Button>
    </View>
  );
}
```

### 2. 表单验证错误处理

```typescript
import { useFormErrorHandling } from '@/hooks/useErrorHandling';

function LoginForm() {
  const { fieldErrors, submitError, setFieldError, clearFieldError } = useFormErrorHandling();

  const validateForm = (data: LoginData) => {
    let isValid = true;

    if (!data.username) {
      setFieldError('username', '用户名不能为空');
      isValid = false;
    } else {
      clearFieldError('username');
    }

    if (!data.password) {
      setFieldError('password', '密码不能为空');
      isValid = false;
    } else {
      clearFieldError('password');
    }

    return isValid;
  };

  const handleSubmit = async (data: LoginData) => {
    if (!validateForm(data)) return;

    try {
      await loginApi(data);
    } catch (error) {
      // 处理提交错误
    }
  };

  return (
    <View>
      <TextInput
        label="用户名"
        error={!!fieldErrors.username}
        onChangeText={(text) => {
          if (text) clearFieldError('username');
        }}
      />
      {fieldErrors.username && (
        <Text style={{ color: 'red' }}>{fieldErrors.username}</Text>
      )}

      {submitError && <EnhancedErrorDisplay error={submitError} />}
    </View>
  );
}
```

### 3. 图片加载错误处理

```typescript
import { useErrorHandling } from '@/hooks/useErrorHandling';

function ImageComponent() {
  const { error, handleImageError } = useErrorHandling();

  const handleImageLoad = async (uri: string) => {
    try {
      const image = await loadImage(uri);
      return image;
    } catch (error) {
      await handleImageError(error as Error, {
        imageUri: uri,
        component: 'ImageComponent',
      }, () => {
        // 使用备用图片
        setImageUri(fallbackImageUri);
      });
    }
  };

  return (
    <View>
      {error && <EnhancedErrorDisplay error={error} />}
      <Image source={{ uri: imageUri }} onError={handleImageLoad} />
    </View>
  );
}
```

### 4. 全局错误处理

```typescript
// 在应用根组件中设置错误边界
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary
      maxRetries={3}
      resetOnPropsChange={true}
      onError={(error, errorInfo) => {
        // 报告错误到远程服务
        reportErrorToService(error, errorInfo);
      }}
    >
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </ErrorBoundary>
  );
}
```

## 配置和自定义

### 1. 添加自定义错误处理器

```typescript
import { ErrorHandler } from '@/services/errorService';

class CustomErrorHandler implements ErrorHandler {
  canHandle(error: ErrorInfo): boolean {
    return error.type === ErrorType.CUSTOM;
  }

  async handle(error: ErrorInfo): Promise<void> {
    // 自定义错误处理逻辑
    console.log('处理自定义错误:', error.message);
  }
}

// 注册自定义处理器
errorService.addHandler(new CustomErrorHandler());
```

### 2. 添加自定义错误报告器

```typescript
import { ErrorReporter } from '@/services/errorService';

class RemoteErrorReporter implements ErrorReporter {
  async report(error: ErrorInfo): Promise<void> {
    // 发送错误到远程服务
    await fetch('/api/errors', {
      method: 'POST',
      body: JSON.stringify(error),
    });
  }
}

// 注册自定义报告器
errorService.addReporter(new RemoteErrorReporter());
```

### 3. 错误统计和监控

```typescript
// 获取错误统计
const stats = errorService.getErrorStats();
console.log('错误统计:', {
  总数: stats.total,
  按类型: stats.byType,
  按严重程度: stats.bySeverity,
});

// 清除错误队列
errorService.clearErrors();
```

## 最佳实践

### 1. 错误分类
- 根据错误类型选择合适的处理策略
- 设置合适的严重程度
- 提供有用的上下文信息

### 2. 用户体验
- 提供清晰的错误信息
- 提供重试和恢复选项
- 避免技术术语，使用用户友好的语言

### 3. 开发调试
- 在开发环境中显示详细的调试信息
- 记录错误堆栈和上下文
- 提供错误报告功能

### 4. 性能考虑
- 避免在错误处理中进行重计算
- 使用异步错误处理避免阻塞UI
- 限制错误队列大小

### 5. 安全考虑
- 不要在生产环境中暴露敏感信息
- 过滤和清理错误详情
- 使用安全的错误报告机制

这套错误处理系统提供了完整的错误管理解决方案，能够显著提升应用的稳定性和用户体验。
