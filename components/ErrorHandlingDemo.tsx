/**
 * 错误处理演示组件
 * 展示各种错误处理功能的使用方法
 */

import { useAsyncErrorHandling, useErrorHandling, useFormErrorHandling } from '@/hooks/useErrorHandling';
import { errorService, ErrorSeverity, ErrorType, RecoveryStrategy } from '@/services/errorService';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, TextInput, useTheme } from 'react-native-paper';
import { EnhancedErrorDisplay } from './EnhancedErrorDisplay';
import { ErrorBoundary } from './ErrorBoundary';

// 模拟API调用
const mockApiCall = async (shouldFail: boolean = false): Promise<string> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error('API请求失败'));
      } else {
        resolve('API调用成功');
      }
    }, 1000);
  });
};

// 模拟网络错误
const mockNetworkError = (): Error => {
  const error = new Error('网络连接失败');
  error.name = 'NetworkError';
  return error;
};

// 模拟验证错误
const mockValidationError = (value: string): Error | null => {
  if (!value.trim()) {
    return new Error('输入不能为空');
  }
  if (value.length < 3) {
    return new Error('输入长度至少3个字符');
  }
  return null;
};

// 会抛出错误的组件
const ErrorThrowingComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('这是一个测试错误');
  }
  return <Text>组件正常渲染</Text>;
};

export const ErrorHandlingDemo: React.FC = () => {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [shouldThrowError, setShouldThrowError] = useState(false);

  // 基本错误处理
  const basicErrorHandling = useErrorHandling({
    onError: (error) => console.log('基本错误处理:', error.message),
    maxRetries: 3,
  });

  // 异步错误处理
  const asyncErrorHandling = useAsyncErrorHandling({
    onSuccess: (result) => console.log('异步操作成功:', result),
    onError: (error) => console.log('异步操作失败:', error.message),
  });

  // 表单错误处理
  const formErrorHandling = useFormErrorHandling({
    onValidationError: (field, message) => console.log(`字段 ${field} 验证失败: ${message}`),
  });

  // 处理API错误
  const handleApiError = async () => {
    try {
      await mockApiCall(true);
    } catch (error) {
      await basicErrorHandling.handleApiError(error, {
        endpoint: '/api/demo',
        method: 'GET',
      });
    }
  };

  // 处理网络错误
  const handleNetworkError = async () => {
    const error = mockNetworkError();
    await basicErrorHandling.handleNetworkError(error, {
      screen: 'ErrorDemo',
      action: 'test_network',
    });
  };

  // 处理验证错误
  const handleValidationError = () => {
    const error = mockValidationError(inputValue);
    if (error) {
      formErrorHandling.setFieldError('input', error.message);
    } else {
      formErrorHandling.clearFieldError('input');
    }
  };

  // 处理图片错误
  const handleImageError = async () => {
    const error = new Error('图片加载失败');
    await basicErrorHandling.handleImageError(error, {
      imageUri: 'https://example.com/invalid-image.jpg',
      component: 'ErrorDemo',
    }, () => {
      console.log('使用备用图片');
    });
  };

  // 创建自定义错误
  const handleCustomError = async () => {
    const customError = errorService.createError(
      ErrorType.VALIDATION,
      '这是一个自定义错误',
      {
        severity: ErrorSeverity.MEDIUM,
        details: { customField: 'customValue' },
        recovery: {
          strategy: RecoveryStrategy.RETRY,
          maxRetries: 2,
        },
      }
    );
    await basicErrorHandling.handleError(customError);
  };

  // 异步操作演示
  const handleAsyncOperation = async () => {
    await asyncErrorHandling.execute(async () => {
      return await mockApiCall(false);
    });
  };

  // 异步操作失败演示
  const handleAsyncOperationFail = async () => {
    await asyncErrorHandling.execute(async () => {
      return await mockApiCall(true);
    });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>
        错误处理演示
      </Text>

      {/* 基本错误处理演示 */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
            基本错误处理
          </Text>
          
          {basicErrorHandling.error && (
            <EnhancedErrorDisplay
              error={basicErrorHandling.error}
              onRetry={basicErrorHandling.retry}
              onDismiss={basicErrorHandling.clearError}
            />
          )}

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleApiError}
              style={styles.button}
            >
              API错误
            </Button>
            <Button
              mode="contained"
              onPress={handleNetworkError}
              style={styles.button}
            >
              网络错误
            </Button>
            <Button
              mode="contained"
              onPress={handleImageError}
              style={styles.button}
            >
              图片错误
            </Button>
            <Button
              mode="contained"
              onPress={handleCustomError}
              style={styles.button}
            >
              自定义错误
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* 异步错误处理演示 */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
            异步错误处理
          </Text>
          
          {asyncErrorHandling.error && (
            <EnhancedErrorDisplay
              error={asyncErrorHandling.error}
              onRetry={asyncErrorHandling.retry}
              onDismiss={asyncErrorHandling.clearError}
            />
          )}

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleAsyncOperation}
              loading={asyncErrorHandling.isLoading}
              style={styles.button}
            >
              成功操作
            </Button>
            <Button
              mode="contained"
              onPress={handleAsyncOperationFail}
              loading={asyncErrorHandling.isLoading}
              style={styles.button}
            >
              失败操作
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* 表单错误处理演示 */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
            表单错误处理
          </Text>
          
          <TextInput
            label="输入内容"
            value={inputValue}
            onChangeText={setInputValue}
            error={!!formErrorHandling.fieldErrors.input}
            style={styles.input}
          />
          
          {formErrorHandling.fieldErrors.input && (
            <Text style={[styles.errorText, { color: theme.colors.error }]}>
              {formErrorHandling.fieldErrors.input}
            </Text>
          )}

          {formErrorHandling.submitError && (
            <EnhancedErrorDisplay
              error={formErrorHandling.submitError}
              onDismiss={() => formErrorHandling.clearAllErrors()}
            />
          )}

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleValidationError}
              style={styles.button}
            >
              验证输入
            </Button>
            <Button
              mode="outlined"
              onPress={formErrorHandling.clearAllErrors}
              style={styles.button}
            >
              清除错误
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* 错误边界演示 */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
            错误边界演示
          </Text>
          
          <ErrorBoundary
            maxRetries={2}
            resetOnPropsChange={true}
            resetKeys={[shouldThrowError ? 'true' : 'false']}
            onError={(error, errorInfo) => {
              console.log('错误边界捕获错误:', error.message);
            }}
          >
            <ErrorThrowingComponent shouldThrow={shouldThrowError} />
          </ErrorBoundary>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={() => setShouldThrowError(!shouldThrowError)}
              style={styles.button}
            >
              {shouldThrowError ? '恢复正常' : '抛出错误'}
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* 错误统计 */}
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
            错误统计
          </Text>
          
          <Button
            mode="outlined"
            onPress={() => {
              const stats = errorService.getErrorStats();
              console.log('错误统计:', stats);
            }}
            style={styles.button}
          >
            查看错误统计
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  button: {
    flex: 1,
    minWidth: 120,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    marginBottom: 8,
    fontSize: 12,
  },
});

export default ErrorHandlingDemo;
