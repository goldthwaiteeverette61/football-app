/**
 * 倍投页面 - 重构后的主组件
 * 使用组合模式，将大型组件拆分为多个小组件
 */

import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useWebCompatibleAlert } from '@/components/WebCompatibleAlert';
import { createShadowStyle, getWebHeaderStyle, getWebTitleStyle } from '@/utils/webCompatibility';
import { ScrollView } from 'react-native';
import { ActionButton } from './ActionButton';
import { InfoCard } from './InfoCard';
import { SchemeDisplay } from './SchemeDisplay';
import { useBettingScreen } from './useBettingScreen';

export default function BettingScreenRefactored() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const alert = useWebCompatibleAlert();
  
  const {
    countdown,
    showCompensationTip,
    showCostTip,
    showBetTip,
    showLossTip,
    showSchemeTip,
    schemeData,
    todayScheme,
    groupedMatches,
    loading,
    schemeLoading,
    user,
    setShowCompensationTip,
    setShowCostTip,
    setShowBetTip,
    setShowLossTip,
    setShowSchemeTip,
    parseDeadlineMs,
    getSchemeStatusText,
    shouldShowScheme,
  } = useBettingScreen();

  // 處理方案跟投點擊
  const handleSchemeFollowClick = useCallback(() => {
    // 檢查方案狀態
    if (!todayScheme) {
      alert('提示', '暫無方案數據，請稍後再試');
      return;
    }
    
    // 只有pending狀態才能進行投注
    if (todayScheme.status !== 'pending') {
      alert(
        '無法投注',
        '暫無可用方案，請等待下期方案',
        [{ text: '確定', style: 'default' }]
      );
      return;
    }

    // 檢查投注截止時間
    const now = new Date();
    const deadline = new Date(todayScheme.deadlineTime);
    if (now >= deadline) {
      alert(
        '無法投注',
        '投注截止時間已過，無法進行投注。',
        [{ text: '確定', style: 'default' }]
      );
      return;
    }

    // 檢查本單下注金額
    const currentBetAmount = typeof schemeData?.currentPeriodFollowAmount === 'number' 
      ? schemeData.currentPeriodFollowAmount 
      : parseFloat(schemeData?.currentPeriodFollowAmount || '0') || 0;
    
    if (currentBetAmount > 0) {
      alert(
        '無法投注',
        '您已經投注過本單，無法重複投注。',
        [{ text: '確定', style: 'default' }]
      );
      return;
    }

    // 所有條件都滿足，可以進入投注頁面
    router.push('/betting/scheme-betting');
  }, [todayScheme, schemeData, alert, router]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      {/* 狀態欄背景 */}
      <View style={[styles.statusBarBackground, { backgroundColor: theme.colors.primary }]} />
      
      {/* 現代極簡頂部導航 */}
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.primary }, getWebHeaderStyle()]}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={[styles.headerContent, getWebHeaderStyle()]}>
            {/* 主標題區域 */}
            <View style={[styles.titleSection, getWebTitleStyle()]}>
              <Text variant="titleLarge" style={[styles.pageTitle, { color: theme.colors.onPrimary }, getWebTitleStyle()]}>
                倍投
              </Text>
            </View>

            {/* 四塊信息區域 */}
            <View style={styles.infoGrid}>
              <InfoCard
                label="理賠獎池"
                value={typeof schemeData?.systemReserveAmount === 'number' ? schemeData.systemReserveAmount : parseFloat(schemeData?.systemReserveAmount || '0') || 0}
                unit="USDT"
                loading={loading}
                onHelpPress={() => setShowCompensationTip(true)}
              />

              <InfoCard
                label="連黑成本"
                value={typeof schemeData?.cumulativeLostAmountSinceWin === 'number' ? schemeData.cumulativeLostAmountSinceWin : parseFloat(schemeData?.cumulativeLostAmountSinceWin || '0') || 0}
                unit="USDT"
                loading={loading}
                onHelpPress={() => setShowCostTip(true)}
              />

              <InfoCard
                label="本單下注"
                value={typeof schemeData?.currentPeriodFollowAmount === 'number' ? schemeData.currentPeriodFollowAmount : parseFloat(schemeData?.currentPeriodFollowAmount || '0') || 0}
                unit="USDT"
                loading={loading}
                onHelpPress={() => setShowBetTip(true)}
              />

              <InfoCard
                label="連黑次數"
                value={typeof schemeData?.cumulativeLostBetCountSinceWin === 'number' ? schemeData.cumulativeLostBetCountSinceWin : 0}
                unit="次"
                loading={loading}
                onHelpPress={() => setShowLossTip(true)}
              />
            </View>

            {/* 功能按鈕區域 */}
            <View style={styles.actionButtonsContainer}>
              <ActionButton
                icon="plus-circle"
                label="方案跟投"
                onPress={handleSchemeFollowClick}
              />
              
              <ActionButton
                icon="chart-line"
                label="紅單趨勢"
                onPress={() => router.push('/betting/red-trend')}
              />
              
              <ActionButton
                icon="clipboard-list"
                label="我的訂單"
                onPress={() => router.push('/betting/orders')}
              />
              
              <ActionButton
                icon="hand-heart"
                label="理賠管理"
                onPress={() => router.push('/betting/claim-management')}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 60 + insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 今日方案區域 */}
        <SchemeDisplay
          schemeLoading={schemeLoading}
          todayScheme={todayScheme}
          groupedMatches={groupedMatches}
          countdown={countdown}
          parseDeadlineMs={parseDeadlineMs}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    zIndex: 1000,
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
  // 標題區域樣式
  titleSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  pageTitle: {
    fontWeight: 'bold',
  },
  // 四塊信息區域樣式
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  // 功能按鈕區域樣式
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    marginTop: 20,
    paddingHorizontal: 16,
    gap: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
});
