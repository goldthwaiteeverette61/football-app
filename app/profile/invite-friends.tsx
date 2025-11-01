import { useWebCompatibleAlert } from '@/components/WebCompatibleAlert';
import { useAuth } from '@/contexts/AuthContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Clipboard, RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Divider,
    IconButton,
    Text,
    useTheme
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { inviteApi, InviteStats } from '../../services/inviteApi';

export default function InviteFriendsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const alert = useWebCompatibleAlert();
  const [copied, setCopied] = useState(false);
  const [inviteStats, setInviteStats] = useState<InviteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // 從用戶資訊中獲取邀請碼，保持原樣
  const inviteCode = user?.invitationCode || 'SCORE2024';

  // 加載邀請統計數據
  const loadInviteStats = async () => {
    try {
      setLoading(true);
      const response = await inviteApi.getInviteStats();
      
      if (response.success && response.data) {
        setInviteStats(response.data);
        console.log('📊 邀請統計數據:', response.data);
      } else {
        console.error('獲取邀請統計失敗:', response.message);
        // 使用預設數據
        setInviteStats({
          totalInvites: 0,
          totalEarnings: "0.00",
          monthlyInvites: 0,
          thisMonthEarnings: "0.00",
          todayEarnings: "0.00"
        });
      }
    } catch (error) {
      console.error('加載邀請統計失敗:', error);
      // 使用預設數據
      setInviteStats({
        totalInvites: 0,
        totalEarnings: "0.00",
        monthlyInvites: 0,
        thisMonthEarnings: "0.00",
        todayEarnings: "0.00"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadInviteStats();
  }, []);

  // 下拉刷新
  const onRefresh = () => {
    setRefreshing(true);
    loadInviteStats();
  };

  const handleCopyCode = async () => {
    try {
      await Clipboard.setString(inviteCode);
      setCopied(true);
      alert('複製成功', '邀請碼已複製到剪貼簿');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('複製失敗:', error);
      alert('複製失敗', '請稍後重試');
    }
  };

  const handleShare = async () => {
    try {
      const shareContent = `🎉 邀請您加入ScoreRED！\n\n使用邀請碼：${inviteCode}\n\n下載連結：https://score.red/app\n\n一起體驗智能投注策略！`;
      
      await Share.share({
        message: shareContent,
        title: '邀請好友加入ScoreRED',
      });
    } catch (error) {
      console.error('分享失敗:', error);
      alert('分享失敗', '請稍後重試');
    }
  };

  const inviteRewards = [
    {
      id: 1,
      title: '邀請獎勵',
      description: '每次投注獲取0.8%傭金',
      icon: 'gift'
    },
    {
      id: 2,
      title: '好友獎勵',
      description: '每次投注獲取0.8%傭金',
      icon: 'account-plus'
    }
  ];


  return (
    <>
      <Stack.Screen
        options={{
          title: '邀請好友',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: { fontWeight: '600' },
          headerTitleAlign: 'center',
        }}
      />
      <StatusBar style="light" />
      
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* 邀请概览 - 独立头部区域 */}
        <View style={[styles.inviteOverview, { backgroundColor: theme.colors.primary }]}>
          <IconButton
            icon="gift"
            size={32}
            iconColor={theme.colors.onPrimary}
            style={styles.giftIcon}
          />
          <Text variant="displayMedium" style={[styles.inviteCode, { color: theme.colors.onPrimary }]}>
            {inviteCode}
          </Text>
          <Text variant="titleMedium" style={[styles.overviewDescription, { color: theme.colors.onPrimary }]}>
            分享給好友，雙方都能獲得獎勵
          </Text>
          
          {/* 操作按钮 */}
          <View style={styles.headerActionButtons}>
            <Button
              mode="outlined"
              onPress={handleCopyCode}
              style={[styles.headerActionButton, { borderColor: theme.colors.onPrimary }]}
              textColor={theme.colors.onPrimary}
              icon="content-copy"
            >
              {copied ? '已複製' : '複製邀請碼'}
            </Button>
            <Button
              mode="outlined"
              onPress={handleShare}
              style={[styles.headerActionButton, { borderColor: theme.colors.onPrimary }]}
              textColor={theme.colors.onPrimary}
              icon="share"
            >
              分享邀請
            </Button>
          </View>
        </View>

        <SafeAreaView style={styles.scrollContainer} edges={['bottom']}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
          >


          {/* 邀请统计 */}
          <Card style={styles.statsCard} elevation={2}>
            <Card.Content style={[styles.cardContent, { justifyContent: 'center' }]}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}> 
                    加載統計數據中...
                  </Text>
                </View>
              ) : (
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text variant="headlineSmall" style={[styles.statNumber, { color: theme.colors.primary }]}>
                      {inviteStats?.totalInvites || 0}
                    </Text>
                    <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}> 
                      已邀請好友
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text variant="headlineSmall" style={[styles.statNumber, { color: theme.colors.secondary }]}>
                      {inviteStats?.totalEarnings || '0.00'}
                    </Text>
                    <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}> 
                      累計獎勵
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text variant="headlineSmall" style={[styles.statNumber, { color: theme.colors.tertiary }]}>
                      {inviteStats?.monthlyInvites || 0}
                    </Text>
                    <Text variant="bodySmall" style={[styles.statLabel, { color: theme.colors.onSurfaceVariant }]}> 
                      本月邀請
                    </Text>
                  </View>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* 邀请奖励 */}
          <Card style={styles.rewardsCard} elevation={2}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}> 
                邀請獎勵
              </Text>
              
              <View style={styles.rewardsList}>
                {inviteRewards.map((reward, index) => (
                  <View key={reward.id}>
                    <View style={styles.rewardItem}>
                      <View style={styles.rewardIcon}>
                        <IconButton
                          icon={reward.icon}
                          size={24}
                          iconColor={theme.colors.primary}
                        />
                      </View>
                      <View style={styles.rewardContent}>
                        <Text variant="titleSmall" style={[styles.rewardTitle, { color: theme.colors.onSurface }]}>
                          {reward.title}
                        </Text>
                        <Text variant="bodySmall" style={[styles.rewardDescription, { color: theme.colors.onSurfaceVariant }]}>
                          {reward.description}
                        </Text>
                      </View>
                    </View>
                    {index < inviteRewards.length - 1 && <Divider style={styles.rewardDivider} />}
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
          </ScrollView>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 16,
  },
  inviteOverview: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingLeft: 0,
    paddingRight: 0,
    alignItems: 'center',
  },
  giftIcon: {
    marginBottom: 8,
  },
  inviteCode: {
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 2,
  },
  overviewDescription: {
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 20,
  },
  headerActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  headerActionButton: {
    flex: 1,
    borderWidth: 1,
    minHeight: 36,
  },
  rewardsCard: {
    marginBottom: 16,
  },
  statsCard: {
    marginBottom: 16,
  },
  cardContent: {
    padding: 20,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  rewardsList: {
    gap: 16,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rewardIcon: {
    marginTop: 4,
  },
  rewardContent: {
    flex: 1,
    gap: 4,
  },
  rewardTitle: {
    fontWeight: '600',
  },
  rewardDescription: {
    lineHeight: 18,
  },
  rewardChip: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  rewardDivider: {
    marginTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
  },
});
