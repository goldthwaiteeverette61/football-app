/**
 * 增强的错误显示组件
 * 提供丰富的错误信息展示和交互功能
 */

import { ErrorInfo, ErrorSeverity, ErrorType, RecoveryStrategy } from '@/services/errorService';
import React, { memo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Divider, IconButton, Text, useTheme } from 'react-native-paper';

interface EnhancedErrorDisplayProps {
  error: ErrorInfo;
  onRetry?: () => void;
  onDismiss?: () => void;
  onReport?: () => void;
  showDetails?: boolean;
  compact?: boolean;
}

export const EnhancedErrorDisplay = memo(function EnhancedErrorDisplay({
  error,
  onRetry,
  onDismiss,
  onReport,
  showDetails = false,
  compact = false,
}: EnhancedErrorDisplayProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(showDetails);

  const getErrorIcon = (type: ErrorType): string => {
    switch (type) {
      case ErrorType.NETWORK:
        return 'wifi-off';
      case ErrorType.API:
        return 'api';
      case ErrorType.AUTHENTICATION:
        return 'lock';
      case ErrorType.AUTHORIZATION:
        return 'shield-account';
      case ErrorType.VALIDATION:
        return 'alert-circle';
      case ErrorType.TIMEOUT:
        return 'clock-alert';
      case ErrorType.STORAGE:
        return 'database';
      case ErrorType.CRYPTO:
        return 'key';
      case ErrorType.IMAGE:
        return 'image-broken';
      default:
        return 'alert';
    }
  };

  const getSeverityColor = (severity: ErrorSeverity): string => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return theme.colors.error;
      case ErrorSeverity.HIGH:
        return theme.colors.error;
      case ErrorSeverity.MEDIUM:
        return theme.colors.tertiary;
      case ErrorSeverity.LOW:
        return theme.colors.outline;
      default:
        return theme.colors.outline;
    }
  };

  const getSeverityText = (severity: ErrorSeverity): string => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return '严重';
      case ErrorSeverity.HIGH:
        return '高';
      case ErrorSeverity.MEDIUM:
        return '中';
      case ErrorSeverity.LOW:
        return '低';
      default:
        return '未知';
    }
  };

  const getRecoveryText = (strategy: RecoveryStrategy): string => {
    switch (strategy) {
      case RecoveryStrategy.RETRY:
        return '可重试';
      case RecoveryStrategy.FALLBACK:
        return '已回退';
      case RecoveryStrategy.IGNORE:
        return '已忽略';
      case RecoveryStrategy.LOGOUT:
        return '需重新登录';
      case RecoveryStrategy.RESTART:
        return '需重启应用';
      default:
        return '未知';
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const canRetry = error.recovery?.strategy === RecoveryStrategy.RETRY;

  if (compact) {
    return (
      <Card style={[styles.compactCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.compactContent}>
          <View style={styles.compactHeader}>
            <IconButton
              icon={getErrorIcon(error.type)}
              size={20}
              iconColor={getSeverityColor(error.severity)}
            />
            <Text variant="bodyMedium" style={[styles.compactMessage, { color: theme.colors.onSurface }]}>
              {error.message}
            </Text>
            {onDismiss && (
              <IconButton
                icon="close"
                size={16}
                onPress={onDismiss}
                iconColor={theme.colors.onSurfaceVariant}
              />
            )}
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.content}>
        {/* 错误头部 */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <IconButton
              icon={getErrorIcon(error.type)}
              size={24}
              iconColor={getSeverityColor(error.severity)}
            />
            <View style={styles.titleContainer}>
              <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
                {error.message}
              </Text>
              <View style={styles.chipContainer}>
                <Chip
                  icon="tag"
                  style={[styles.chip, { backgroundColor: theme.colors.surfaceVariant }]}
                  textStyle={{ color: theme.colors.onSurfaceVariant }}
                >
                  {error.type}
                </Chip>
                <Chip
                  icon="alert"
                  style={[styles.chip, { backgroundColor: getSeverityColor(error.severity) + '20' }]}
                  textStyle={{ color: getSeverityColor(error.severity) }}
                >
                  {getSeverityText(error.severity)}
                </Chip>
                {error.recovery && (
                  <Chip
                    icon="refresh"
                    style={[styles.chip, { backgroundColor: theme.colors.primaryContainer }]}
                    textStyle={{ color: theme.colors.onPrimaryContainer }}
                  >
                    {getRecoveryText(error.recovery.strategy)}
                  </Chip>
                )}
              </View>
            </View>
            {onDismiss && (
              <IconButton
                icon="close"
                size={20}
                onPress={onDismiss}
                iconColor={theme.colors.onSurfaceVariant}
              />
            )}
          </View>
        </View>

        {/* 错误详情 */}
        {expanded && (
          <View style={styles.details}>
            <Divider style={styles.divider} />
            
            {/* 基本信息 */}
            <View style={styles.detailSection}>
              <Text variant="labelMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                错误信息
              </Text>
              <Text variant="bodySmall" style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                类型: {error.type}
              </Text>
              <Text variant="bodySmall" style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                严重程度: {getSeverityText(error.severity)}
              </Text>
              <Text variant="bodySmall" style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                时间: {formatTimestamp(error.timestamp)}
              </Text>
              {error.code && (
                <Text variant="bodySmall" style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                  错误代码: {error.code}
                </Text>
              )}
            </View>

            {/* 上下文信息 */}
            {error.context && (
              <View style={styles.detailSection}>
                <Text variant="labelMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  上下文信息
                </Text>
                {Object.entries(error.context).map(([key, value]) => (
                  <Text key={key} variant="bodySmall" style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                    {key}: {String(value)}
                  </Text>
                ))}
              </View>
            )}

            {/* 恢复策略 */}
            {error.recovery && (
              <View style={styles.detailSection}>
                <Text variant="labelMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  恢复策略
                </Text>
                <Text variant="bodySmall" style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                  策略: {getRecoveryText(error.recovery.strategy)}
                </Text>
                {error.recovery.maxRetries && (
                  <Text variant="bodySmall" style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                    最大重试次数: {error.recovery.maxRetries}
                  </Text>
                )}
                {error.recovery.retryDelay && (
                  <Text variant="bodySmall" style={[styles.detailValue, { color: theme.colors.onSurface }]}>
                    重试延迟: {error.recovery.retryDelay}ms
                  </Text>
                )}
              </View>
            )}

            {/* 调试信息 */}
            {__DEV__ && error.stack && (
              <View style={styles.detailSection}>
                <Text variant="labelMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                  堆栈信息
                </Text>
                <ScrollView style={[styles.stackContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Text variant="bodySmall" style={[styles.stackText, { color: theme.colors.onSurfaceVariant }]}>
                    {error.stack}
                  </Text>
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* 操作按钮 */}
        <View style={styles.actions}>
          <Button
            icon="chevron-down"
            mode="text"
            onPress={() => setExpanded(!expanded)}
            style={styles.expandButton}
          >
            {expanded ? '收起' : '详情'}
          </Button>
          
          <View style={styles.actionButtons}>
            {canRetry && onRetry && (
              <Button
                icon="refresh"
                mode="contained"
                onPress={onRetry}
                style={styles.actionButton}
              >
                重试
              </Button>
            )}
            
            {onReport && (
              <Button
                icon="bug-report"
                mode="outlined"
                onPress={onReport}
                style={styles.actionButton}
              >
                报告
              </Button>
            )}
          </View>
        </View>
      </Card.Content>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    margin: 8,
    elevation: 2,
  },
  compactCard: {
    margin: 4,
    elevation: 1,
  },
  content: {
    padding: 16,
  },
  compactContent: {
    padding: 8,
  },
  header: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontWeight: '600',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    marginRight: 4,
    marginBottom: 4,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactMessage: {
    flex: 1,
    marginLeft: 8,
  },
  details: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 12,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  stackContainer: {
    maxHeight: 120,
    padding: 8,
    borderRadius: 4,
  },
  stackText: {
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  expandButton: {
    flex: 0,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    minWidth: 80,
  },
});

export default EnhancedErrorDisplay;
