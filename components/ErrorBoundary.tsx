/**
 * 增强的错误边界组件
 * 提供错误捕获、恢复和用户友好的错误显示
 */

import { errorService, ErrorSeverity, ErrorType } from '@/services/errorService';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });

    // 报告错误到错误服务
    errorService.handleError(
      errorService.createError(
        ErrorType.UNKNOWN,
        error.message || '组件渲染错误',
        {
          severity: ErrorSeverity.HIGH,
          details: {
            componentStack: errorInfo.componentStack,
            errorBoundary: true,
          },
          context: {
            component: 'ErrorBoundary',
            action: 'component_did_catch',
          },
        }
      )
    );

    // 调用自定义错误处理函数
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange) {
      if (resetKeys) {
        const hasResetKeyChanged = resetKeys.some((key, index) => 
          key !== prevProps.resetKeys?.[index]
        );
        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      } else {
        // 检查所有props是否发生变化
        const hasPropsChanged = Object.keys(this.props).some(
          key => key !== 'children' && (this.props as any)[key] !== (prevProps as any)[key]
        );
        if (hasPropsChanged) {
          this.resetErrorBoundary();
        }
      }
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = (): void => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    } else {
      // 超过最大重试次数，保持错误状态
      console.warn('错误边界重试次数已达上限');
    }
  };

  handleRetry = (): void => {
    this.resetErrorBoundary();
  };

  handleReportError = (): void => {
    const { error, errorInfo } = this.state;
    if (error && errorInfo) {
      // 这里可以添加错误报告逻辑
      console.log('报告错误:', error.message);
    }
  };

  render(): ReactNode {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, maxRetries = 3 } = this.props;

    if (hasError) {
      // 如果提供了自定义fallback，使用它
      if (fallback) {
        return fallback;
      }

      // 渲染默认错误UI
      return <ErrorFallback 
        error={error} 
        retryCount={retryCount}
        maxRetries={maxRetries}
        onRetry={this.handleRetry}
        onReport={this.handleReportError}
      />;
    }

    return children;
  }
}

// 错误回退组件
interface ErrorFallbackProps {
  error: Error | null;
  retryCount: number;
  maxRetries: number;
  onRetry: () => void;
  onReport: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  retryCount,
  maxRetries,
  onRetry,
  onReport,
}) => {
  const theme = useTheme();
  const canRetry = retryCount < maxRetries;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.content}>
          <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.error }]}>
            出现错误
          </Text>
          
          <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
            {error?.message || '发生了未知错误'}
          </Text>

          {retryCount > 0 && (
            <Text variant="bodySmall" style={[styles.retryInfo, { color: theme.colors.onSurfaceVariant }]}>
              重试次数: {retryCount}/{maxRetries}
            </Text>
          )}

          <View style={styles.actions}>
            {canRetry && (
              <Button
                mode="contained"
                onPress={onRetry}
                style={styles.button}
              >
                重试
              </Button>
            )}
            
            <Button
              mode="outlined"
              onPress={onReport}
              style={styles.button}
            >
              报告问题
            </Button>
          </View>

          {__DEV__ && error && (
            <View style={[styles.debugInfo, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text variant="bodySmall" style={[styles.debugTitle, { color: theme.colors.onSurfaceVariant }]}>
                调试信息:
              </Text>
              <Text variant="bodySmall" style={[styles.debugText, { color: theme.colors.onSurfaceVariant }]}>
                {error.stack}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    elevation: 4,
  },
  content: {
    padding: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  retryInfo: {
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    minWidth: 100,
  },
  debugInfo: {
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  debugTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  debugText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16,
  },
});

export default ErrorBoundary;
