import { useWebCompatibleAlert } from '@/components/WebCompatibleAlert';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
    Button,
    Card,
    Text,
    useTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { imageCache } from '../../services/imageCache';

interface CacheStats {
  fileCount: number;
  totalSize: number;
  totalSizeMB: string;
  maxSizeMB: string;
}

export default function CacheManagementScreen() {
  const theme = useTheme();
  const router = useRouter();
  const alert = useWebCompatibleAlert();
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCacheStats();
  }, []);

  const loadCacheStats = async () => {
    try {
      const stats = await imageCache.getCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('加載緩存統計失敗:', error);
    }
  };

  const handleClearCache = () => {
    alert(
      '清除緩存',
      '確定要清除所有圖片緩存嗎？這將刪除所有已緩存的頭像圖片。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '確定',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await imageCache.clearAllCache();
              await loadCacheStats();
              alert('成功', '緩存已清除');
            } catch (error) {
              console.error('清除緩存失敗:', error);
              alert('錯誤', '清除緩存失敗，請重試');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleRefreshStats = async () => {
    setLoading(true);
    try {
      await loadCacheStats();
    } catch (error) {
      console.error('刷新統計失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <Stack.Screen 
        options={{
          title: '緩存管理',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: { fontWeight: '600' },
          headerTitleAlign: 'center',
        }} 
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          
          {/* 緩存統計卡片 */}
          <Card style={styles.statsCard} elevation={2}>
            <Card.Content>
              <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                緩存統計
              </Text>
              
              {cacheStats ? (
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text variant="bodyLarge" style={[styles.statValue, { color: theme.colors.primary }]}>
                      {cacheStats.fileCount}
                    </Text>
                    <Text variant="bodyMedium" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                      緩存文件數
                    </Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text variant="bodyLarge" style={[styles.statValue, { color: theme.colors.primary }]}>
                      {cacheStats.totalSizeMB} MB
                    </Text>
                    <Text variant="bodyMedium" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                      已用空間
                    </Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text variant="bodyLarge" style={[styles.statValue, { color: theme.colors.outline }]}>
                      {cacheStats.maxSizeMB} MB
                    </Text>
                    <Text variant="bodyMedium" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}>
                      最大空間
                    </Text>
                  </View>
                </View>
              ) : (
                <Text variant="bodyMedium" style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
                  加載中...
                </Text>
              )}
            </Card.Content>
          </Card>

          {/* 緩存說明卡片 */}
          <Card style={styles.infoCard} elevation={1}>
            <Card.Content>
              <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>
                緩存說明
              </Text>
              
              <View style={styles.infoList}>
                <Text variant="bodyMedium" style={[styles.infoItem, { color: theme.colors.onSurfaceVariant }]}>
                  • 頭像和球隊logo圖片會自動緩存到本地，提升加載速度
                </Text>
                <Text variant="bodyMedium" style={[styles.infoItem, { color: theme.colors.onSurfaceVariant }]}>
                  • 緩存文件會在7天後自動過期
                </Text>
                <Text variant="bodyMedium" style={[styles.infoItem, { color: theme.colors.onSurfaceVariant }]}>
                  • 當緩存超過50MB時會自動清理舊文件
                </Text>
                <Text variant="bodyMedium" style={[styles.infoItem, { color: theme.colors.onSurfaceVariant }]}>
                  • 清除緩存不會影響您的個人數據
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* 操作按钮 */}
          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={handleRefreshStats}
              style={styles.button}
              loading={loading}
              disabled={loading}
              icon="refresh"
            >
              刷新統計
            </Button>
            
            <Button
              mode="contained"
              onPress={handleClearCache}
              style={[styles.button, styles.clearButton]}
              loading={loading}
              disabled={loading}
              icon="delete"
              buttonColor={theme.colors.error}
            >
              清除緩存
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  statsCard: {
    marginBottom: 16,
  },
  infoCard: {
    marginBottom: 24,
  },
  cardTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  loadingText: {
    textAlign: 'center',
    paddingVertical: 20,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    borderRadius: 8,
  },
  clearButton: {
    marginTop: 8,
  },
});
