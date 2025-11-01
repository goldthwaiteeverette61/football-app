/**
 * 下载进度对话框组件
 */

import React from 'react';
import { Dimensions, Modal, StyleSheet, View } from 'react-native';
import {
    Button,
    Card,
    Icon,
    ProgressBar,
    Text,
    useTheme
} from 'react-native-paper';

import { DownloadProgress } from '@/services/downloadService';

const { width } = Dimensions.get('window');

interface DownloadProgressDialogProps {
  visible: boolean;
  progress: DownloadProgress | null;
  fileName: string;
  onCancel: () => void;
  onRetry?: () => void;
  error?: string;
}

export const DownloadProgressDialog: React.FC<DownloadProgressDialogProps> = ({
  visible,
  progress,
  fileName,
  onCancel,
  onRetry,
  error
}) => {
  const theme = useTheme();

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}秒`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}分${remainingSeconds}秒`;
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatBytes(bytesPerSecond)}/s`;
  };

  const getProgressPercentage = (): number => {
    if (!progress) return 0;
    return Math.round(progress.progress * 100);
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.content}>
          {/* 标题 */}
          <View style={styles.header}>
            <Icon source="download" size={24} color={theme.colors.primary} />
            <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
              {error ? '下载失败' : '正在下载'}
            </Text>
          </View>

          {/* 文件名 */}
          <Text variant="bodyMedium" style={[styles.fileName, { color: theme.colors.onSurfaceVariant }]}>
            {fileName}
          </Text>

          {error ? (
            /* 错误状态 */
            <View style={styles.errorContainer}>
              <Icon source="alert-circle" size={48} color={theme.colors.error} />
              <Text variant="bodyMedium" style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
              {onRetry && (
                <Button
                  mode="contained"
                  onPress={onRetry}
                  style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
                >
                  重试下载
                </Button>
              )}
            </View>
          ) : progress ? (
            /* 下载进度 */
            <View style={styles.progressContainer}>
              {/* 进度条 */}
              <ProgressBar
                progress={progress.progress}
                color={theme.colors.primary}
                style={styles.progressBar}
              />

              {/* 进度信息 */}
              <View style={styles.progressInfo}>
                <Text variant="bodyMedium" style={[styles.progressText, { color: theme.colors.onSurface }]}>
                  {getProgressPercentage()}%
                </Text>
                <Text variant="bodySmall" style={[styles.progressSubtext, { color: theme.colors.onSurfaceVariant }]}>
                  {formatBytes(progress.bytesDownloaded)} / {formatBytes(progress.totalBytes)}
                </Text>
              </View>

              {/* 下载速度和时间 */}
              <View style={styles.downloadStats}>
                <View style={styles.statItem}>
                  <Icon source="speedometer" size={16} color={theme.colors.outline} />
                  <Text variant="bodySmall" style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
                    {formatSpeed(progress.speed)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Icon source="clock-outline" size={16} color={theme.colors.outline} />
                  <Text variant="bodySmall" style={[styles.statText, { color: theme.colors.onSurfaceVariant }]}>
                    {formatTime(progress.estimatedTimeRemaining)}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            /* 准备状态 */
            <View style={styles.preparingContainer}>
              <Icon source="loading" size={48} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={[styles.preparingText, { color: theme.colors.onSurfaceVariant }]}>
                准备下载...
              </Text>
            </View>
          )}

          {/* 操作按钮 */}
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={onCancel}
              style={styles.cancelButton}
            >
              取消
            </Button>
          </View>
          </Card.Content>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 12,
    elevation: 8,
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    marginLeft: 12,
    fontWeight: '600',
  },
  fileName: {
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    marginTop: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    marginTop: 8,
  },
  progressContainer: {
    paddingVertical: 20,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressText: {
    fontWeight: '600',
    fontSize: 18,
  },
  progressSubtext: {
    fontFamily: 'monospace',
  },
  downloadStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    fontFamily: 'monospace',
  },
  preparingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  preparingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  cancelButton: {
    minWidth: 100,
  },
});
