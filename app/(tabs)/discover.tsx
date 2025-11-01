import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
    Card,
    List,
    useTheme
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { createShadowStyle, fixAndroidTitleDisplay, fixWebTitleDisplay } from '@/utils/webCompatibility';

export default function DiscoverScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { refreshUserInfo } = useAuth();

  // 頁面顯示時刷新用戶信息
  useEffect(() => {
    const refreshUserData = async () => {
      try {
        console.log('🔄 發現頁面：開始刷新用戶信息...');
        await refreshUserInfo();
        console.log('✅ 發現頁面：用戶信息刷新完成');
      } catch (error) {
        console.error('❌ 發現頁面：刷新用戶信息失敗:', error);
      }
    };

    refreshUserData();
    
    // Web平台修复标题显示
    fixWebTitleDisplay();
    
    // Android平台修复标题显示
    fixAndroidTitleDisplay();
  }, [refreshUserInfo]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
    
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 + insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 足球賽事 */}
        <Card style={styles.menuCard} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <List.Item
              title="足球賽事"
              description="查看最新足球比賽信息"
              left={(props) => <List.Icon {...props} icon="soccer" color={theme.colors.primary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
              onPress={() => router.push('/discover/football-matches')}
              style={styles.menuItem}
            />
          </Card.Content>
        </Card>

        {/* 足球計算器 */}
        <Card style={styles.menuCard} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <List.Item
              title="足球計算器"
              description="足球賠率計算工具"
              left={(props) => <List.Icon {...props} icon="calculator" color={theme.colors.secondary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
              onPress={() => router.push('/discover/football-calculator')}
              style={styles.menuItem}
            />
          </Card.Content>
        </Card>

        {/* 比分預測 */}
        <Card style={styles.menuCard} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <List.Item
              title="比分預測"
              description="AI智能比分預測分析"
              left={(props) => <List.Icon {...props} icon="chart-line" color={theme.colors.tertiary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
              onPress={() => router.push('/discover/score-prediction')}
              style={styles.menuItem}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerContainer: {
    elevation: 4,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    }),
  },
  safeArea: {
    backgroundColor: 'transparent',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  menuCard: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  cardContent: {
    padding: 0,
  },
  menuItem: {
    paddingVertical: 4,
  },
});