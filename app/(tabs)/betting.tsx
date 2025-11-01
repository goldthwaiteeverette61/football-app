import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  Card,
  Icon,
  IconButton,
  Modal,
  Portal,
  Text,
  useTheme
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useWebCompatibleAlert } from '@/components/WebCompatibleAlert';
import { useAuth } from '@/contexts/AuthContext';
import { getSchemeSummary, getTodayScheme, SchemePeriodData, SchemeSummaryData } from '@/services/schemeApi';
import { getMatchResult, getMatchScoreDisplay, getMatchStatus } from '@/utils/matchStatus';
import { createShadowStyle, fixWebTitleDisplay, getWebHeaderStyle } from '@/utils/webCompatibility';

export default function BettingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, refreshUserInfo } = useAuth();
  const alert = useWebCompatibleAlert();
  
  // 狀態聲明
  const [countdown, setCountdown] = useState<string>('');
  const [showCompensationTip, setShowCompensationTip] = useState(false);
  const [showCostTip, setShowCostTip] = useState(false);
  const [showBetTip, setShowBetTip] = useState(false);
  const [showLossTip, setShowLossTip] = useState(false);
  const [showSchemeTip, setShowSchemeTip] = useState(false);
  const [schemeData, setSchemeData] = useState<SchemeSummaryData | null>(null);
  const [todayScheme, setTodayScheme] = useState<SchemePeriodData | null>(null);
  const [groupedMatches, setGroupedMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemeLoading, setSchemeLoading] = useState(true);

  // 統一的截止時間解析函數（兼容多種格式與安卓解析差異）
  const parseDeadlineMs = useCallback((value: any): number => {
    if (typeof value === 'number') return value;
    if (!value) return NaN;
    let s = String(value).trim();
    // 去掉毫秒小數（如: 2025-09-27 20:00:00.0）
    if (s.includes('.')) s = s.split('.')[0];
    // 優先用正則拆解為本地時間，避免 Android 將無時區 ISO 解析為 UTC
    const m = s.match(/^(\d{4})[-\/]?(\d{1,2})[-\/]?(\d{1,2})[ T]?(\d{1,2}):?(\d{1,2})(?::?(\d{1,2}))?$/);
    if (m) {
      const [_, Y, Mo, D, H, Mi, S] = m;
      const year = Number(Y);
      const month = Number(Mo) - 1;
      const day = Number(D);
      const hour = Number(H);
      const minute = Number(Mi);
      const second = Number(S || '0');
      const constructed = new Date(year, month, day, hour, minute, second).getTime();
      if (!isNaN(constructed)) return constructed;
    }
    // 其次嘗試通用解析
    let ms = Date.parse(s);
    if (!isNaN(ms)) return ms;
    // 替換空格為T
    ms = Date.parse(s.replace(' ', 'T'));
    if (!isNaN(ms)) return ms;
    // 將-替換為/
    ms = Date.parse(s.replace(/-/g, '/'));
    if (!isNaN(ms)) return ms;
    return NaN;
  }, []);

  // 截止時間倒計時（用於等待投注中提示）
  useEffect(() => {
    if (!todayScheme?.deadlineTime) {
      setCountdown('');
      return;
    }
    const deadlineMs = parseDeadlineMs(todayScheme.deadlineTime);
    const formatRemaining = (ms: number) => {
      if (ms <= 0) return '已截止';
      const totalSec = Math.floor(ms / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;
      const hh = String(hours).padStart(2, '0');
      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    };
    const update = () => {
      if (!deadlineMs || isNaN(deadlineMs)) {
        setCountdown('');
        return;
      }
      
      // 检查是否已经投注过，如果已投注则停止倒计时
      const currentBetAmount = typeof schemeData?.currentPeriodFollowAmount === 'number' 
        ? schemeData.currentPeriodFollowAmount 
        : parseFloat(schemeData?.currentPeriodFollowAmount || '0') || 0;
      
      if (currentBetAmount > 0) {
        setCountdown('');
        return false; // 停止定时器
      }
      
      const remaining = deadlineMs - Date.now();
      const display = formatRemaining(remaining);
      
      // 只在倒計時變化時輸出日誌，避免重複輸出相同內容
      
      setCountdown(display);
      
      // 如果已截止，返回false表示需要停止定時器
      return remaining > 0;
    };
    
    const initialResult = update();
    if (!initialResult) {
      // 如果初始檢查就發現已截止，不啟動定時器
      return;
    }
    
    const t = setInterval(() => {
      const shouldContinue = update();
      if (!shouldContinue) {
        clearInterval(t);
      }
    }, 1000);
    
    return () => clearInterval(t);
  }, [todayScheme?.deadlineTime, parseDeadlineMs, schemeData?.currentPeriodFollowAmount]);

  // 獲取方案狀態顯示文本
  const getSchemeStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '可投注';
      case 'won': return '已中獎';
      case 'lost': return '未中獎';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  // 處理方案跟投點擊
  const handleSchemeFollowClick = () => {
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
  };

  // 檢查是否應該顯示方案信息 - 簡化邏輯：只要有數據就顯示
  const shouldShowScheme = () => {
    return !!todayScheme;
  };

  // 獲取方案匯總數據
  const fetchSchemeData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getSchemeSummary();
      
      if (response.success && response.data) {
        setSchemeData(response.data);
      } else {
        console.warn('方案匯總數據獲取失敗:', response.message);
        // 設置默認數據
        setSchemeData({
          systemReserveAmount: "0",
          cumulativeLostAmountSinceWin: "0",
          currentPeriodFollowAmount: "0",
          cumulativeLostBetCountSinceWin: 0,
          compensationStatus: false,
          betAmount: null,
          commissionRate: "0",
          betType: 'normal'
        });
      }
    } catch (error) {
      console.error('❌ 方案匯總數據獲取異常:', error);
      // 設置默認數據
      setSchemeData({
        systemReserveAmount: "0",
        cumulativeLostAmountSinceWin: "0",
        currentPeriodFollowAmount: "0",
        cumulativeLostBetCountSinceWin: 0,
        compensationStatus: false,
        betAmount: null,
        commissionRate: "0",
        betType: 'normal'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // 處理比賽數據分組
  const processMatchesData = (matches: any[]) => {
    
    const groupedMap = new Map();
    
    matches.forEach((match: any, index: number) => {
      
      const matchId = match.matchId;
      const bizMatchesVo = match.bizMatchesVo || {};
      const key = `${matchId}_${bizMatchesVo.matchName || 'Unknown'}`;
      
      if (!groupedMap.has(key)) {
        const matchData = {
          matchId: match.matchId,
          matchName: bizMatchesVo.matchName || 'Unknown',
          leagueName: bizMatchesVo.leagueName || '',
          matchNumStr: bizMatchesVo.matchNumStr || '',
          matchDatetime: bizMatchesVo.matchDatetime || '',
          homeTeamName: bizMatchesVo.homeTeamName || '',
          awayTeamName: bizMatchesVo.awayTeamName || '',
          fullScore: bizMatchesVo.fullScore || '',
          matchStatus: bizMatchesVo.matchStatus || '',
          matchMinute: bizMatchesVo.matchMinute || '',
          matchPhaseTc: bizMatchesVo.matchPhaseTc || '',
          had: bizMatchesVo.had || null,
          hhad: bizMatchesVo.hhad || null,
          bettingOptions: [],
          isRed: false, // 是否紅單
        };
        
        groupedMap.set(key, matchData);
      }
      
      const groupedMatch = groupedMap.get(key);
      const bettingOption = {
        detailId: match.detailId,
        poolCode: match.poolCode,
        selection: match.selection,
        odds: match.odds,
        goalLine: match.goalLine,
        isSelected: true, // 默認選中
      };
      
      groupedMatch.bettingOptions.push(bettingOption);
    });
    
    // 按玩法分組投注選項
    const groupedMatches = Array.from(groupedMap.values()).map((match: any) => {
      // 按玩法分組
      const optionsByPool = new Map();
      match.bettingOptions.forEach((option: any) => {
        const poolKey = `${option.poolCode}_${option.goalLine || ''}`;
        if (!optionsByPool.has(poolKey)) {
          optionsByPool.set(poolKey, {
            poolCode: option.poolCode,
            goalLine: option.goalLine,
            selections: []
          });
        }
        optionsByPool.get(poolKey).selections.push(option);
      });
      
      // 計算是否紅單（只要有一個選項中了就算紅單）
      
      const hasWinningOption = match.bettingOptions.some((option: any) => {
        const result = getMatchResult(match, option.poolCode, option.goalLine);
        const isWinning = result && option.selection === result;
        
        
        return isWinning;
      });
      
      
      return {
        ...match,
        bettingOptions: Array.from(optionsByPool.values()),
        isRed: hasWinningOption,
      };
    });
    
    return groupedMatches;
  };

  // 獲取今日方案數據
  const fetchTodayScheme = useCallback(async () => {
    try {
      setSchemeLoading(true);
      const response = await getTodayScheme();
      
      
      if (response.success) {
        if (response.data) {
          
          // 詳細分析比賽數據結構
          if (response.data.details && response.data.details.length > 0) {
          }
          
          setTodayScheme(response.data);
          // 處理比賽數據分組
          const processedMatches = processMatchesData(response.data.details || []);
          setGroupedMatches(processedMatches);
        } else {
          console.warn('今日方案數據為空，但API調用成功');
          setTodayScheme(null);
          setGroupedMatches([]);
        }
      } else {
        console.warn('⚠️ 今日方案數據獲取失敗:', response.message);
        setTodayScheme(null);
        setGroupedMatches([]);
      }
    } catch (error) {
      console.error('❌ 今日方案數據獲取異常:', error);
      setTodayScheme(null);
      setGroupedMatches([]);
    } finally {
      setSchemeLoading(false);
    }
  }, []);

  // 頁面顯示時檢查用戶信息緩存和獲取方案數據
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 如果用戶信息不存在，才進行刷新
        if (!user) {
          await refreshUserInfo();
        }
        // 並行獲取方案匯總數據和今日方案數據
        await Promise.all([
          fetchSchemeData(),
          fetchTodayScheme()
        ]);
        
        // Web平台修复标题显示
        fixWebTitleDisplay();
      } catch (error) {
        console.error('❌ 倍投頁面：初始化數據失敗:', error);
      }
    };

    initializeData();
  }, [fetchSchemeData, fetchTodayScheme, refreshUserInfo, user]);

  // 界面獲得焦點時重新加載數據
  useFocusEffect(
    useCallback(() => {
      const refreshData = async () => {
        try {
          // 重新獲取方案匯總數據和今日方案數據
          await Promise.all([
            fetchSchemeData(),
            fetchTodayScheme()
          ]);
        } catch (error) {
          console.error('❌ 倍投頁面：界面焦點數據刷新失敗:', error);
        }
      };

      refreshData();
    }, [fetchSchemeData, fetchTodayScheme])
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      {/* 現代極簡頂部導航 */}
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.primary }, getWebHeaderStyle()]}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={[styles.headerContent, getWebHeaderStyle()]}>
            {/* 標題已移除，保持簡潔設計 */}

            {/* 四塊信息區域 */}
            <View style={styles.infoGrid}>
              {/* 理賠獎池 */}
              <View style={[styles.infoCard, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <View style={styles.infoHeader}>
                  <Text variant="bodyMedium" style={[styles.infoLabel, { color: theme.colors.onPrimary, opacity: 0.9 }]}>
                    理賠獎池
                  </Text>
                  <IconButton
                    icon="help-circle-outline"
                    iconColor={theme.colors.onPrimary}
                    size={16}
                    onPress={() => setShowCompensationTip(true)}
                    style={styles.helpIcon}
                  />
                </View>
                <View style={styles.valueRow}>
                  <Text variant="headlineMedium" style={[styles.infoValue, { color: theme.colors.onPrimary }]}>
                    {loading ? '--' : (typeof schemeData?.systemReserveAmount === 'number' ? schemeData.systemReserveAmount : parseFloat(schemeData?.systemReserveAmount || '0') || 0).toFixed(2)}
                  </Text>
                  <Text variant="bodySmall" style={[styles.infoUnit, { color: theme.colors.onPrimary, opacity: 0.8 }]}>
                    USDT
                  </Text>
                </View>
              </View>

              {/* 連黑成本 */}
              <View style={[styles.infoCard, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <View style={styles.infoHeader}>
                  <Text variant="bodyMedium" style={[styles.infoLabel, { color: theme.colors.onPrimary, opacity: 0.9 }]}>
                    連黑成本
                  </Text>
                  <IconButton
                    icon="help-circle-outline"
                    iconColor={theme.colors.onPrimary}
                    size={16}
                    onPress={() => setShowCostTip(true)}
                    style={styles.helpIcon}
                  />
                </View>
                <View style={styles.valueRow}>
                  <Text variant="headlineMedium" style={[styles.infoValue, { color: theme.colors.onPrimary }]}>
                    {loading ? '--' : (typeof schemeData?.cumulativeLostAmountSinceWin === 'number' ? schemeData.cumulativeLostAmountSinceWin : parseFloat(schemeData?.cumulativeLostAmountSinceWin || '0') || 0).toFixed(2)}
                  </Text>
                  <Text variant="bodySmall" style={[styles.infoUnit, { color: theme.colors.onPrimary, opacity: 0.8 }]}>
                    USDT
                  </Text>
                </View>
              </View>

              {/* 本單下注 */}
              <View style={[styles.infoCard, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <View style={styles.infoHeader}>
                  <Text variant="bodyMedium" style={[styles.infoLabel, { color: theme.colors.onPrimary, opacity: 0.9 }]}>
                    本單下注
                  </Text>
                  <IconButton
                    icon="help-circle-outline"
                    iconColor={theme.colors.onPrimary}
                    size={16}
                    onPress={() => setShowBetTip(true)}
                    style={styles.helpIcon}
                  />
                </View>
                <View style={styles.valueRow}>
                  <Text variant="headlineMedium" style={[styles.infoValue, { color: theme.colors.onPrimary }]}>
                    {loading ? '--' : (typeof schemeData?.currentPeriodFollowAmount === 'number' ? schemeData.currentPeriodFollowAmount : parseFloat(schemeData?.currentPeriodFollowAmount || '0') || 0).toFixed(2)}
                  </Text>
                  <Text variant="bodySmall" style={[styles.infoUnit, { color: theme.colors.onPrimary, opacity: 0.8 }]}>
                    USDT
                  </Text>
                </View>
              </View>

              {/* 連黑次數 */}
              <View style={[styles.infoCard, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <View style={styles.infoHeader}>
                  <Text variant="bodyMedium" style={[styles.infoLabel, { color: theme.colors.onPrimary, opacity: 0.9 }]}>
                    連黑次數
                  </Text>
                  <IconButton
                    icon="help-circle-outline"
                    iconColor={theme.colors.onPrimary}
                    size={16}
                    onPress={() => setShowLossTip(true)}
                    style={styles.helpIcon}
                  />
                </View>
                <View style={styles.valueRow}>
                  <Text variant="headlineMedium" style={[styles.infoValue, { color: theme.colors.onPrimary }]}>
                    {loading ? '--' : (typeof schemeData?.cumulativeLostBetCountSinceWin === 'number' ? schemeData.cumulativeLostBetCountSinceWin : 0)}
                  </Text>
                  <Text variant="bodySmall" style={[styles.infoUnit, { color: theme.colors.onPrimary, opacity: 0.8 }]}>
                    次
                  </Text>
                </View>
              </View>
            </View>

            {/* 功能按鈕區域 */}
            <View style={styles.actionButtonsContainer}>
              <View style={styles.actionButtonWrapper}>
                <TouchableOpacity 
                  style={[styles.actionIconContainer, { backgroundColor: theme.colors.primary }]}
                  onPress={handleSchemeFollowClick}
                  activeOpacity={0.7}
                >
                  <Icon source="plus-circle" size={20} color="white" />
                </TouchableOpacity>
                <Text style={[styles.actionButtonText, { color: theme.colors.onPrimary }]}>
                  方案跟投
                </Text>
              </View>
              
              <View style={styles.actionButtonWrapper}>
                <TouchableOpacity 
                  style={[styles.actionIconContainer, { backgroundColor: theme.colors.primary }]}
                  onPress={() => router.push('/betting/red-trend')}
                  activeOpacity={0.7}
                >
                  <Icon source="chart-line" size={20} color="white" />
                </TouchableOpacity>
                <Text style={[styles.actionButtonText, { color: theme.colors.onPrimary }]}>
                  紅單趨勢
                </Text>
              </View>
              
              <View style={styles.actionButtonWrapper}>
                <TouchableOpacity 
                  style={[styles.actionIconContainer, { backgroundColor: theme.colors.primary }]}
                  onPress={() => router.push('/betting/orders')}
                  activeOpacity={0.7}
                >
                  <Icon source="clipboard-list" size={20} color="white" />
                </TouchableOpacity>
                <Text style={[styles.actionButtonText, { color: theme.colors.onPrimary }]}>
                  我的訂單
                </Text>
              </View>
              
              <View style={styles.actionButtonWrapper}>
                <TouchableOpacity 
                  style={[styles.actionIconContainer, { backgroundColor: theme.colors.primary }]}
                  onPress={() => router.push('/betting/claim-management')}
                  activeOpacity={0.7}
                >
                  <Icon source="hand-heart" size={20} color="white" />
                </TouchableOpacity>
                <Text style={[styles.actionButtonText, { color: theme.colors.onPrimary }]}>
                  理賠管理
                </Text>
              </View>
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
            <View style={[styles.schemeSection, { backgroundColor: '#f7f7f7' }]}> 
              {schemeLoading ? (
                <LoadingSpinner 
                  size={48} 
                  text="正在加載方案..." 
                  color={theme.colors.primary}
                  type="spinner"
                />
              ) : todayScheme ? (
                <View style={styles.schemeContainer}>
                  {/* 方案標題區域 */}
                  <View style={styles.schemeHeader}>
                    <View style={styles.schemeTitleContainer}>
                      <Text variant="titleMedium" style={[styles.schemeTitle, { color: theme.colors.onSurface }]}> 
                        {todayScheme.status === 'won' ? '紅單到手' : 
                         todayScheme.status === 'lost' ? '下次再來' : 
                         (() => {
                           const now = new Date();
                           const deadline = new Date(todayScheme.deadlineTime);
                           return now < deadline ? '今日方案' : '恭喜發財';
                         })()}
                      </Text>
                    </View>
                    <IconButton
                      icon="help-circle-outline"
                      size={16}
                      onPress={() => setShowSchemeTip(true)}
                      iconColor={theme.colors.outline}
                      style={{ margin: 0, width: 24, height: 24, marginRight: 10 }}
                    />
                  </View>
                  
                  {/* 比賽列表 */}
                  {(() => {
                    const deadlineMs = parseDeadlineMs(todayScheme.deadlineTime);
                    const currentBetAmount = typeof schemeData?.currentPeriodFollowAmount === 'number' 
                      ? schemeData.currentPeriodFollowAmount 
                      : parseFloat(schemeData?.currentPeriodFollowAmount || '0') || 0;
                    
                    // 如果已经投注过，或者截止时间已过，都显示比赛列表
                    const shouldShowMatches = (currentBetAmount > 0) || (Date.now() >= deadlineMs);
                    
                    return shouldShowMatches && groupedMatches.length > 0;
                  })() && (
                    <View style={styles.matchesList}>
                      {groupedMatches.map((match, index) => (
                        <View key={`${match.matchId}_${index}`} style={[styles.matchCard, { backgroundColor: theme.colors.surface }]}>
                          {/* 比賽頭部 */}
                          <View style={styles.matchCardHeader}>
                            <View style={styles.matchInfo}>
                              <Text style={[styles.leagueName, { color: theme.colors.onSurface }]}>
                                {match.leagueName}
                              </Text>
                              <Text style={[styles.matchTime, { color: theme.colors.outline }]}>
                                {match.matchNumStr} {new Date(match.matchDatetime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                            </View>
                            <View style={[styles.resultBadge, { 
                              backgroundColor: getMatchStatus(match).backgroundColor
                            }]}>
                              <Text style={[styles.resultText, { 
                                color: getMatchStatus(match).textColor 
                              }]}>
                                {getMatchStatus(match).displayText}
                              </Text>
                            </View>
                          </View>
                          
                          {/* 比賽比分 */}
                          <View style={styles.matchScore}>
                            <Text style={[styles.homeTeamName, { color: theme.colors.onSurface }]}>
                              {match.homeTeamName}
                            </Text>
                            <View style={styles.scoreContainer}>
                            <Text style={[
                              getMatchScoreDisplay(match) === 'vs' ? styles.scoreVs : styles.score, 
                              { color: theme.colors.onSurface }
                            ]}>
                              {getMatchScoreDisplay(match)}
                            </Text>
                            </View>
                            <Text style={[styles.awayTeamName, { color: theme.colors.onSurface }]}>
                              {match.awayTeamName}
                            </Text>
                          </View>
                          
                          {/* 投注選項 */}
                          <View style={styles.bettingOptions}>
                            {match.bettingOptions.map((poolOption: any, poolIndex: number) => (
                              <View key={`${poolOption.poolCode}_${poolOption.goalLine || ''}`} style={styles.bettingRow}>
                                <View style={styles.bettingCategory}>
                                  <Text style={styles.bettingCategoryText}>
                                    {poolOption.poolCode === 'HAD' 
                                      ? '勝負平' 
                                      : (() => {
                                          const goalLineNum = parseFloat(poolOption.goalLine || '0');
                                          return goalLineNum < 0 ? '讓球' : '受讓';
                                        })()
                                    }
                                  </Text>
                                  {poolOption.poolCode !== 'HAD' && poolOption.goalLine && (
                                    <View style={styles.goalLineBadge}>
                                      <Text style={styles.goalLineText}>
                                        {Math.abs(parseFloat(poolOption.goalLine))}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                                <View style={styles.bettingButtons}>
                                  <View style={[
                                    styles.bettingButton,
                                    poolOption.selections.some((sel: any) => sel.selection === 'H') && styles.selectedBettingButton,
                                    (() => {
                                      const result = getMatchResult(match, poolOption.poolCode, poolOption.goalLine);
                                      const isMatchPending = Number(match.matchStatus) === 0;
                                      return result === 'H' && !isMatchPending ? styles.winningOdds : null;
                                    })()
                                  ]}>
                                    <Text style={[
                                      poolOption.selections.some((sel: any) => sel.selection === 'H') ? styles.selectedBettingButtonText : styles.bettingButtonText,
                                      poolOption.selections.some((sel: any) => sel.selection === 'H') && { color: '#1976d2' },
                                      (() => {
                                        const result = getMatchResult(match, poolOption.poolCode, poolOption.goalLine);
                                        const isMatchPending = Number(match.matchStatus) === 0;
                                        return result === 'H' && !isMatchPending ? { color: '#ff4444', fontWeight: 'bold' } : null;
                                      })()
                                    ]}>
                                      主勝
                                    </Text>
                                    <Text style={[
                                      styles.bettingOdds,
                                      poolOption.selections.some((sel: any) => sel.selection === 'H') && { color: '#1976d2' },
                                      (() => {
                                        const result = getMatchResult(match, poolOption.poolCode, poolOption.goalLine);
                                        const isMatchPending = Number(match.matchStatus) === 0;
                                        return result === 'H' && !isMatchPending ? { color: '#ff4444', fontWeight: 'bold' } : null;
                                      })()
                                    ]}>
                                      {poolOption.poolCode === 'HAD' ? (match.had?.homeOdds || '--') : (match.hhad?.homeOdds || '--')}
                                    </Text>
                                  </View>
                                  <View style={[
                                    styles.bettingButton,
                                    poolOption.selections.some((sel: any) => sel.selection === 'D') && styles.selectedBettingButton,
                                    (() => {
                                      const result = getMatchResult(match, poolOption.poolCode, poolOption.goalLine);
                                      const isMatchPending = Number(match.matchStatus) === 0;
                                      return result === 'D' && !isMatchPending ? styles.winningOdds : null;
                                    })()
                                  ]}>
                                    <Text style={[
                                      poolOption.selections.some((sel: any) => sel.selection === 'D') ? styles.selectedBettingButtonText : styles.bettingButtonText,
                                      poolOption.selections.some((sel: any) => sel.selection === 'D') && { color: '#1976d2' },
                                      (() => {
                                        const result = getMatchResult(match, poolOption.poolCode, poolOption.goalLine);
                                        const isMatchPending = Number(match.matchStatus) === 0;
                                        return result === 'D' && !isMatchPending ? { color: '#ff4444', fontWeight: 'bold' } : null;
                                      })()
                                    ]}>
                                      平
                                    </Text>
                                    <Text style={[
                                      styles.bettingOdds,
                                      poolOption.selections.some((sel: any) => sel.selection === 'D') && { color: '#1976d2' },
                                      (() => {
                                        const result = getMatchResult(match, poolOption.poolCode, poolOption.goalLine);
                                        const isMatchPending = Number(match.matchStatus) === 0;
                                        return result === 'D' && !isMatchPending ? { color: '#ff4444', fontWeight: 'bold' } : null;
                                      })()
                                    ]}>
                                      {poolOption.poolCode === 'HAD' ? (match.had?.drawOdds || '--') : (match.hhad?.drawOdds || '--')}
                                    </Text>
                                  </View>
                                  <View style={[
                                    styles.bettingButton,
                                    poolOption.selections.some((sel: any) => sel.selection === 'A') && styles.selectedBettingButton,
                                    (() => {
                                      const result = getMatchResult(match, poolOption.poolCode, poolOption.goalLine);
                                      const isMatchPending = Number(match.matchStatus) === 0;
                                      return result === 'A' && !isMatchPending ? styles.winningOdds : null;
                                    })()
                                  ]}>
                                    <Text style={[
                                      poolOption.selections.some((sel: any) => sel.selection === 'A') ? styles.selectedBettingButtonText : styles.bettingButtonText,
                                      poolOption.selections.some((sel: any) => sel.selection === 'A') && { color: '#1976d2' },
                                      (() => {
                                        const result = getMatchResult(match, poolOption.poolCode, poolOption.goalLine);
                                        const isMatchPending = Number(match.matchStatus) === 0;
                                        return result === 'A' && !isMatchPending ? { color: '#ff4444', fontWeight: 'bold' } : null;
                                      })()
                                    ]}>
                                      客勝
                                    </Text>
                                    <Text style={[
                                      styles.bettingOdds,
                                      poolOption.selections.some((sel: any) => sel.selection === 'A') && { color: '#1976d2' },
                                      (() => {
                                        const result = getMatchResult(match, poolOption.poolCode, poolOption.goalLine);
                                        const isMatchPending = Number(match.matchStatus) === 0;
                                        return result === 'A' && !isMatchPending ? { color: '#ff4444', fontWeight: 'bold' } : null;
                                      })()
                                    ]}>
                                      {poolOption.poolCode === 'HAD' ? (match.had?.awayOdds || '--') : (match.hhad?.awayOdds || '--')}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {(() => {
                    const deadlineMs = parseDeadlineMs(todayScheme.deadlineTime);
                    const currentBetAmount = typeof schemeData?.currentPeriodFollowAmount === 'number' 
                      ? schemeData.currentPeriodFollowAmount 
                      : parseFloat(schemeData?.currentPeriodFollowAmount || '0') || 0;
                    
                    // 如果已经投注过，不显示等待投注中
                    if (currentBetAmount > 0) {
                      return false;
                    }
                    
                    // 如果截止时间还没到且没有投注过，显示等待投注中
                    return Date.now() < deadlineMs;
                  })() && (
                    <View style={styles.waitingContainer}>
                      <Icon source="lock" size={48} color={theme.colors.outline} />
                      {countdown ? (
                        <Text variant="titleMedium" style={[styles.countdownText, { color: theme.colors.primary }]}>
                          {countdown}
                        </Text>
                      ) : null}
                      <Text variant="bodyLarge" style={[styles.waitingText, { color: theme.colors.onSurfaceVariant }]}>等待投注中</Text>
                      <Text variant="bodyMedium" style={[styles.waitingSubtext, { color: theme.colors.outline }]}>截止時間：{new Date(todayScheme.deadlineTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.waitingContainer}>
                  <Icon source="clock-outline" size={48} color={theme.colors.outline} />
                  <Text variant="bodyLarge" style={[styles.waitingText, { color: theme.colors.onSurfaceVariant }]}>
                    暫無方案
                  </Text>
                  <Text variant="bodyMedium" style={[styles.waitingSubtext, { color: theme.colors.outline }]}>
                    請耐心等待，方案即將發布
                  </Text>
                </View>
              )}
            </View>



        </ScrollView>

      {/* 理賠獎池提示模態框 */}
      <Portal>
        <Modal
          visible={showCompensationTip}
          onDismiss={() => setShowCompensationTip(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Card style={[styles.tipCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.tipContent}>
              <View style={styles.tipHeader}>
                <Icon source="information" size={24} color={theme.colors.primary} />
                <Text variant="titleMedium" style={[styles.tipTitle, { color: theme.colors.onSurface }]}>
                  理賠獎池說明
                </Text>
              </View>
              <Text variant="bodyMedium" style={[styles.tipText, { color: theme.colors.onSurface }]}>
                當用戶連黑8次，可申請理賠。當理賠獎池充足時，自動賠付用戶連黑成本。
              </Text>
              <TouchableOpacity
                style={[styles.tipButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowCompensationTip(false)}
              >
                <Text variant="labelLarge" style={[styles.tipButtonText, { color: theme.colors.onPrimary }]}>
                  知道了
                </Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      {/* 連黑成本提示模態框 */}
      <Portal>
        <Modal
          visible={showCostTip}
          onDismiss={() => setShowCostTip(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Card style={[styles.tipCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.tipContent}>
              <View style={styles.tipHeader}>
                <Icon source="information" size={24} color={theme.colors.primary} />
                <Text variant="titleMedium" style={[styles.tipTitle, { color: theme.colors.onSurface }]}>
                  連黑成本說明
                </Text>
              </View>
              <Text variant="bodyMedium" style={[styles.tipText, { color: theme.colors.onSurface }]}>
                倍投方案連黑總成本。
              </Text>
              <TouchableOpacity
                style={[styles.tipButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowCostTip(false)}
              >
                <Text variant="labelLarge" style={[styles.tipButtonText, { color: theme.colors.onPrimary }]}>
                  知道了
                </Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      {/* 本單下注提示模態框 */}
      <Portal>
        <Modal
          visible={showBetTip}
          onDismiss={() => setShowBetTip(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Card style={[styles.tipCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.tipContent}>
              <View style={styles.tipHeader}>
                <Icon source="information" size={24} color={theme.colors.primary} />
                <Text variant="titleMedium" style={[styles.tipTitle, { color: theme.colors.onSurface }]}>
                  本單下注說明
                </Text>
              </View>
              <Text variant="bodyMedium" style={[styles.tipText, { color: theme.colors.onSurface }]}>
                今日跟投的金額
              </Text>
              <TouchableOpacity
                style={[styles.tipButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowBetTip(false)}
              >
                <Text variant="labelLarge" style={[styles.tipButtonText, { color: theme.colors.onPrimary }]}>
                  知道了
                </Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      {/* 連黑次數提示模態框 */}
      <Portal>
        <Modal
          visible={showLossTip}
          onDismiss={() => setShowLossTip(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Card style={[styles.tipCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.tipContent}>
              <View style={styles.tipHeader}>
                <Icon source="information" size={24} color={theme.colors.primary} />
                <Text variant="titleMedium" style={[styles.tipTitle, { color: theme.colors.onSurface }]}>
                  連黑次數說明
                </Text>
              </View>
              <Text variant="bodyMedium" style={[styles.tipText, { color: theme.colors.onSurface }]}>
                跟投連續黑單的次數，達到8次可申請理賠
              </Text>
              <TouchableOpacity
                style={[styles.tipButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowLossTip(false)}
              >
                <Text variant="labelLarge" style={[styles.tipButtonText, { color: theme.colors.onPrimary }]}>
                  知道了
                </Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      {/* 當前方案提示模態框 */}
      <Portal>
        <Modal
          visible={showSchemeTip}
          onDismiss={() => setShowSchemeTip(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Card style={[styles.tipCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.tipContent}>
              <View style={styles.tipHeader}>
                <Icon source="information" size={24} color={theme.colors.primary} />
                <Text variant="titleMedium" style={[styles.tipTitle, { color: theme.colors.onSurface }]}>
                  當前方案說明
                </Text>
              </View>
              <Text variant="bodyMedium" style={[styles.tipText, { color: theme.colors.onSurface }]}>
                需要當前方案每場比賽都紅,才算中獎
              </Text>
              <TouchableOpacity
                style={[styles.tipButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowSchemeTip(false)}
              >
                <Text variant="labelLarge" style={[styles.tipButtonText, { color: theme.colors.onPrimary }]}>
                  知道了
                </Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
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
  // 四塊信息區域樣式
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoCard: {
    width: '48%',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 12,
    textAlign: 'left',
    flex: 1,
  },
  helpIcon: {
    margin: 0,
    padding: 0,
    width: 20,
    height: 20,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-start',
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoUnit: {
    fontSize: 10,
    marginLeft: 4,
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
  actionButtonWrapper: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 80,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    elevation: 4,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    }),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 14,
  },
  // 投注方案信息區域樣式
  schemeSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
  },
  schemeContainer: {
    padding: 6,
  },
  schemeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingVertical: 4,
  },
  schemeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginLeft: 10,
  },
  schemeTitle: {
    fontWeight: '600',
    lineHeight: 18,
    fontSize: 16,
  },
  schemeDeadline: {
    fontSize: 12,
    fontWeight: '500',
  },
  matchesList: {
    gap: 8,
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  overlayText: {
    marginTop: 8,
    fontWeight: '600',
  },
  overlaySubText: {
    marginTop: 4,
  },
  matchCard: {
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
  },
  matchCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  matchInfo: {
    flex: 1,
  },
  leagueName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 1,
  },
  matchTime: {
    fontSize: 11,
  },
  resultBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 11,
  },
  matchScore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    minHeight: 32,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  homeTeamName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    lineHeight: 24,
  },
  awayTeamName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'left',
    lineHeight: 24,
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  scoreVs: {
    fontSize: 24,
    fontWeight: 'normal',
    lineHeight: 24,
  },
  matchStatus: {
    fontSize: 12,
  },
  bettingOptions: {
    marginTop: 6,
  },
  bettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bettingCategory: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    width: 60,
  },
  bettingCategoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    textAlign: 'center',
  },
  goalLineBadge: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalLineText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '600',
  },
  bettingButtons: {
    flexDirection: 'row',
    flex: 1,
    gap: 6,
  },
  bettingButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    height: 40,
  },
  selectedBettingButton: {
    borderColor: '#1976d2',
    backgroundColor: '#e3f2fd',
  },
  winningOdds: {
    borderBottomWidth: 2,
    borderBottomColor: '#ff4444',
  },
  bettingButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'center',
    width: '100%',
  },
  selectedBettingButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'center',
    width: '100%',
  },
  bettingOdds: {
    fontSize: 11,
    textAlign: 'center',
    width: '100%',
  },
  waitingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  countdownText: {
    marginTop: 12,
    fontWeight: '700',
  },
  waitingText: {
    marginTop: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  waitingSubtext: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    opacity: 0.8,
  },
  cardContent: {
    padding: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  progressBar: {
    marginBottom: 8,
  },
  progressText: {
    textAlign: 'center',
  },
  // 提示模態框樣式
  modalContainer: {
    margin: 20,
    borderRadius: 12,
  },
  tipCard: {
    borderRadius: 12,
    elevation: 8,
  },
  tipContent: {
    padding: 24,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipTitle: {
    marginLeft: 12,
    fontWeight: '600',
  },
  tipText: {
    lineHeight: 22,
    marginBottom: 24,
  },
  tipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  tipButtonText: {
    fontWeight: '600',
  },
});