/**
 * 图片缓存管理组件
 * 显示缓存统计信息和管理功能
 */

import { enhancedImageCache } from '@/services/enhancedImageCache';
import React, { memo, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, ProgressBar, Text, useTheme } from 'react-native-paper';

interface CacheStats {
  fileCount: number;
  totalSize: number;
  totalSizeMB: string;
  maxSizeMB: string;
  hitRate: number;
  missRate: number;
  compressionRatio: number;
}

interface ImageCacheManagerProps {
  onStatsUpdate?: (stats: CacheStats) => void;
}

export const ImageCacheManager = memo(function ImageCacheManager({
  onStatsUpdate,
}: ImageCacheManagerProps) {
  const theme = useTheme();
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 加载缓存统计
  const loadStats = async () => {
    try {
      setRefreshing(true);
      const cacheStats = await enhancedImageCache.getCacheStats();
      setStats(cacheStats);
      onStatsUpdate?.(cacheStats);
    } catch (error) {
      console.error('加载缓存统计失败:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // 清除所有缓存
  const clearAllCache = async () => {
    Alert.alert(
      '清除缓存',
      '确定要清除所有图片缓存吗？这将删除所有已缓存的图片。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await enhancedImageCache.clearAllCache();
              await loadStats();
              Alert.alert('成功', '缓存已清除');
            } catch (error) {
              Alert.alert('错误', '清除缓存失败');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // 重置统计信息
  const resetStats = () => {
    Alert.alert(
      '重置统计',
      '确定要重置缓存统计信息吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => {
            enhancedImageCache.resetStats();
            loadStats();
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (!stats) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text>加载中...</Text>
        </Card.Content>
      </Card>
    );
  }

  const cacheUsagePercent = (parseFloat(stats.totalSizeMB) / parseFloat(stats.maxSizeMB)) * 100;

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="图片缓存统计" />
        <Card.Content>
          {/* 缓存使用情况 */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              缓存使用情况
            </Text>
            <View style={styles.progressContainer}>
              <Text variant="bodyMedium">
                {stats.totalSizeMB} MB / {stats.maxSizeMB} MB
              </Text>
              <ProgressBar
                progress={cacheUsagePercent / 100}
                color={cacheUsagePercent > 80 ? theme.colors.error : theme.colors.primary}
                style={styles.progressBar}
              />
            </View>
          </View>

          {/* 文件统计 */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              文件统计
            </Text>
            <View style={styles.statsRow}>
              <Chip icon="file-image" style={styles.chip}>
                文件数量: {stats.fileCount}
              </Chip>
            </View>
          </View>

          {/* 性能统计 */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              性能统计
            </Text>
            <View style={styles.statsRow}>
              <Chip icon="check-circle" style={[styles.chip, { backgroundColor: theme.colors.primaryContainer }]}>
                命中率: {stats.hitRate}%
              </Chip>
              <Chip icon="close-circle" style={[styles.chip, { backgroundColor: theme.colors.errorContainer }]}>
                未命中: {stats.missRate}%
              </Chip>
            </View>
            <View style={styles.statsRow}>
              <Chip icon="compress" style={styles.chip}>
                压缩率: {stats.compressionRatio}%
              </Chip>
            </View>
          </View>

          {/* 操作按钮 */}
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={loadStats}
              loading={refreshing}
              disabled={loading}
              style={styles.button}
            >
              刷新统计
            </Button>
            <Button
              mode="outlined"
              onPress={resetStats}
              disabled={loading}
              style={styles.button}
            >
              重置统计
            </Button>
            <Button
              mode="contained"
              onPress={clearAllCache}
              loading={loading}
              disabled={loading}
              buttonColor={theme.colors.error}
              style={styles.button}
            >
              清除缓存
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    minWidth: 100,
  },
});

export default ImageCacheManager;
