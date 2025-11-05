import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Chip,
  Icon,
  Surface,
  Switch,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWebCompatibleAlert } from '@/components/WebCompatibleAlert';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/apiClient';
import { getSchemeSummary, getTodayScheme, MatchDetail, SchemePeriodData, SchemeSummaryData } from '@/services/schemeApi';

// 最小投注金額接口響應類型
interface MinBetAmountResponse {
  code: number;
  msg: string;
  data: {
    minimumBetAmount: number;
    baseBetAmount: number;
  };
}

export default function SchemeBettingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const alert = useWebCompatibleAlert();
  const params = useLocalSearchParams();
  
  const [schemeData, setSchemeData] = useState<SchemePeriodData | null>(null);
  const [summaryData, setSummaryData] = useState<SchemeSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [betAmount, setBetAmount] = useState<string>('');
  const [totalOdds, setTotalOdds] = useState<number>(1);
  const [potentialWin, setPotentialWin] = useState<number>(0);
  const [isCompensationEnabled, setIsCompensationEnabled] = useState<boolean>(false);
  const [minimumBetAmount, setMinimumBetAmount] = useState<number>(0);
  const [baseBetAmount, setBaseBetAmount] = useState<number>(0);

  // 獲取後台配置的最小投注金額與基礎默認金額
  const getBetAmounts = async (): Promise<{ min: number; base: number }> => {
    try {
      const response = await apiClient.get<MinBetAmountResponse>('/app/userFollows/min-bet-amount');
      
      console.log('🔍 最小投注金額API響應分析:', {
        success: response.success,
        hasData: !!response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : null,
        rawResponse: response
      });
      
      // 檢查響應數據結構
      if (response.data) {
        let minAmount = 0;
        let baseAmount = 0;
        
        // 嘗試多種數據格式
        if ((response.data as any).minimumBetAmount !== undefined) {
          // 直接包含字段
          minAmount = Number((response.data as any).minimumBetAmount) || 0;
          baseAmount = Number((response.data as any).baseBetAmount) || 0;
          console.log('✅ 使用直接字段格式:', { minAmount, baseAmount });
        } else if (response.data.data && response.data.data.minimumBetAmount !== undefined) {
          // 嵌套data格式
          minAmount = Number(response.data.data.minimumBetAmount) || 0;
          baseAmount = Number(response.data.data.baseBetAmount) || 0;
          console.log('✅ 使用嵌套data格式:', { minAmount, baseAmount });
        } else {
          console.log('⚠️ 未識別的數據格式，嘗試默認值');
        }
        
        console.log('💰 最終解析結果:', { minAmount, baseAmount });
        setMinimumBetAmount(minAmount);
        setBaseBetAmount(baseAmount);
        return { min: minAmount, base: baseAmount };
      }
      
      console.log('⚠️ 接口返回數據無效');
      return { min: 0, base: 0 };
    } catch (error) {
      console.error('❌ 獲取最小投注金額失敗:', error);
      return { min: 0, base: 0 };
    }
  };

  // 加載方案數據
  const loadSchemeData = useCallback(async () => {
    try {
      setLoading(true);
      const [schemeResponse, summaryResponse, betAmounts] = await Promise.all([
        getTodayScheme(),
        getSchemeSummary(),
        getBetAmounts()
      ]);

      if (schemeResponse.success && schemeResponse.data) {
        setSchemeData(schemeResponse.data);
      }

      if (summaryResponse.success && summaryResponse.data) {
        setSummaryData(summaryResponse.data);
        
        // 根據betType設置參與狀態，與理賠管理界面邏輯一致
        const isEnabled = summaryResponse.data.betType ? 
          summaryResponse.data.betType === 'double' : 
          summaryResponse.data.compensationStatus;
        setIsCompensationEnabled(isEnabled);
        console.log('🔄 設置參與連黑理賠服務狀態:', {
          betType: summaryResponse.data.betType,
          compensationStatus: summaryResponse.data.compensationStatus,
          isEnabled
        });
      }

      // 設置默認投注金額：優先 baseBetAmount（後台默認值）> currentPeriodFollowAmount > minimumBetAmount
      const currentFollow = summaryResponse.success && summaryResponse.data
        ? Number(summaryResponse.data.currentPeriodFollowAmount) || 0
        : 0;

      console.log('📊 設置投注金額:', {
        baseBetAmount: betAmounts.base,
        minBetAmount: betAmounts.min,
        currentPeriodFollowAmount: currentFollow
      });

      if (betAmounts.base > 0) {
        setBetAmount(String(betAmounts.base));
        console.log('✅ 使用後台基礎默認金額作為默認值:', betAmounts.base);
      } else if (currentFollow > 0) {
        setBetAmount(String(currentFollow));
        console.log('✅ 使用當前週期跟投金額作為默認值:', currentFollow);
      } else if (betAmounts.min > 0) {
        setBetAmount(String(betAmounts.min));
        console.log('✅ 使用最小投注金額作為默認值:', betAmounts.min);
      } else {
        // 如果都沒有有效值，設置為空字符串，讓用戶手動輸入
        setBetAmount('');
        console.log('⚠️ 沒有有效的默認投注金額，設置為空');
      }
    } catch (error) {
      console.error('加載方案數據失敗:', error);
      alert('錯誤', '加載方案數據失敗，請重試');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchemeData();
  }, [loadSchemeData]);

  // 計算總賠率
  useEffect(() => {
    if (schemeData && schemeData.details.length > 0) {
      // 按比賽分組，每場比賽只取最大賠率
      const matchOddsMap = new Map();
      
      schemeData.details.forEach(detail => {
        const matchId = detail.bizMatchesVo?.matchId?.toString() || '';
        const odds = parseFloat(detail.odds) || 1;
        
        if (!matchOddsMap.has(matchId)) {
          matchOddsMap.set(matchId, odds);
        } else {
          // 只保留最大賠率
          const currentMax = matchOddsMap.get(matchId);
          if (odds > currentMax) {
            matchOddsMap.set(matchId, odds);
          }
        }
      });
      
      // 計算總賠率
      let total = 1;
      matchOddsMap.forEach(odds => {
        total *= odds;
      });
      
      setTotalOdds(Math.round(total * 100) / 100); // 四捨五入到兩位小數
    } else {
      setTotalOdds(1);
    }
  }, [schemeData]);

  // 預期收益已不在界面展示，仍保留內部計算以用於可能的提交確認等場景
  useEffect(() => {
    const amount = parseFloat(betAmount) || 0;
    const win = amount * totalOdds;
    setPotentialWin(Math.round(win * 100) / 100);
  }, [betAmount, totalOdds]);



  // 獲取比賽結果文本
  const getMatchResultText = (detail: MatchDetail) => {
    const { poolCode, selection, goalLine } = detail;
    const { homeTeamName, awayTeamName } = detail.bizMatchesVo;
    
    if (poolCode === 'HHAD') {
      // 讓球勝負平
      const goalLineText = goalLine ? `(${goalLine})` : '';
      if (selection === 'H') return `主勝 ${goalLineText}`;
      if (selection === 'D') return `平局 ${goalLineText}`;
      if (selection === 'A') return `客勝 ${goalLineText}`;
    } else if (poolCode === 'HAD') {
      // 勝負平
      if (selection === 'H') return '主勝';
      if (selection === 'D') return '平局';
      if (selection === 'A') return '客勝';
    }
    
    return `${homeTeamName} vs ${awayTeamName}`;
  };

  // 獲取投注信息文本
  const getBettingInfoText = (detail: MatchDetail) => {
    const { poolCode, selection, odds } = detail;
    
    // 玩法名稱映射
    const poolNameMap: { [key: string]: string } = {
      'HAD': '勝負平',
      'HHAD': '讓球',
      'BQC': '半全場'
    };
    
    // 投注選項映射
    const selectionMap: { [key: string]: string } = {
      'H': '勝',
      'D': '平', 
      'A': '負',
      'HH': '勝勝', 'HD': '勝平', 'HA': '勝負',
      'DH': '平勝', 'DD': '平平', 'DA': '平負',
      'AH': '負勝', 'AD': '負平', 'AA': '負負'
    };
    
    const poolName = poolNameMap[poolCode] || poolCode;
    const selectionText = selectionMap[selection] || selection;
    
    return `${poolName}: ${selectionText}@${odds}`;
  };

  // 獲取比賽狀態顏色
  const getMatchStatusColor = (detail: MatchDetail) => {
    const { matchPhaseTc } = detail.bizMatchesVo;
    if (matchPhaseTc === '14' || matchPhaseTc === '') return '#f44336'; // 已結束
    if (matchPhaseTc === '10') return '#ff5722'; // 中場休息
    if (matchPhaseTc === '1' || matchPhaseTc === '2') return '#ff9800'; // 進行中
    if (matchPhaseTc === '16') return '#9e9e9e'; // 未開始
    return '#9e9e9e';
  };

  // 獲取比賽狀態文本
  const getMatchStatusText = (detail: MatchDetail) => {
    const { matchPhaseTc, matchMinute } = detail.bizMatchesVo;
    if (matchPhaseTc === '14' || matchPhaseTc === '') return '已結束';
    if (matchPhaseTc === '10') return '中場休息';
    if (matchPhaseTc === '1' || matchPhaseTc === '2') {
      return matchMinute ? `進行中 ${matchMinute}'` : '進行中';
    }
    if (matchPhaseTc === '16') return '未開始';
    return '未知';
  };

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

  // 驗證投注金額
  const validateBetAmount = (amount: string) => {
    const numAmount = parseFloat(amount);
    console.log('🔍 驗證投注金額:', {
      inputAmount: amount,
      parsedAmount: numAmount,
      minimumBetAmount: minimumBetAmount,
      isValid: numAmount >= minimumBetAmount
    });
    
    if (minimumBetAmount > 0 && numAmount < minimumBetAmount) {
      console.log('❌ 投注金額不足，觸發驗證失敗');
      alert(
        '投注金額不足',
        `當前最小投注金額為 ${minimumBetAmount} USDT。\n\n如需降低最小投注金額，請前往理賠管理重置倍投服務。`,
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '前往理賠管理', 
            onPress: () => {
              router.push('/betting/claim-management');
            }
          }
        ]
      );
      return false;
    }
    console.log('✅ 投注金額驗證通過');
    return true;
  };

  // 處理理賠服務開關點擊
  const handleCompensationToggle = () => {
    alert(
      '開啟或關閉服務',
      '開啟或關閉連黑理賠服務需要在理賠管理中進行設置。',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '前往理賠管理', 
          onPress: () => {
            router.push('/betting/claim-management');
          }
        }
      ]
    );
  };

  // 處理投注提交
  const handleBetSubmit = () => {
    console.log('🎯 開始處理投注提交');
    
    if (!isAuthenticated) {
      alert('提示', '請先登錄');
      return;
    }

    // 檢查方案狀態
    if (!schemeData) {
      alert('錯誤', '方案數據不存在');
      return;
    }

    console.log('📊 當前方案狀態:', schemeData.status);
    
    // 只有pending狀態才能進行投注
    if (schemeData.status !== 'pending') {
      const statusText = getSchemeStatusText(schemeData.status);
      alert(
        '無法投注',
        `當前方案狀態為"${statusText}"，只有狀態為"可投注"的方案才能進行投注。`,
        [{ text: '確定', style: 'default' }]
      );
      return;
    }

    const amount = parseFloat(betAmount);
    if (!amount || amount <= 0) {
      alert('提示', '請輸入有效的投注金額');
      return;
    }

    console.log('💰 當前投注金額:', amount, '最小投注金額:', minimumBetAmount);
    
    // 驗證投注金額是否滿足最小投注要求
    if (!validateBetAmount(betAmount)) {
      console.log('🚫 投注金額驗證失敗，停止提交');
      return;
    }
    
    console.log('✅ 投注金額驗證通過，繼續提交流程');

    alert(
      '確認投注',
      `請確認金額無誤再繼續`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '確認投注', 
          onPress: () => {
            submitBet(amount);
          }
        }
      ]
    );
  };

  // 提交投注到後台
  const submitBet = async (amount: number) => {
    try {
      console.log('🚀 開始提交投注到後台:', {
        amount,
        schemeId: schemeData?.periodId,
        matchCount: schemeData?.details.length || 0,
        totalOdds,
        potentialWin
      });

      const requestData = {
        periodId: schemeData?.periodId,
        betAmount: amount,
        totalOdds: totalOdds,
        expectedReturn: potentialWin,
        compensationEnabled: isCompensationEnabled
      };

      console.log('📤 發送投注請求:', requestData);

      const response = await apiClient.post('/app/userFollows/follow', requestData);
      
      console.log('📥 投注接口響應:', response);

      if (response.success) {
        alert('投注成功', '您的投注已提交成功！');
        // 可以在這裡添加跳轉到訂單頁面的邏輯
        router.back();
      } else {
        let errorMessage = '投注失敗，請重試';
        if (response.data?.msg) {
          errorMessage = response.data.msg;
        } else if (response.message) {
          errorMessage = response.message;
        }
        alert('投注失敗', errorMessage);
      }
    } catch (error: any) {
      console.error('❌ 投注提交失敗:', error);
      let errorMessage = '投注失敗，請重試';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      alert('投注失敗', errorMessage);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '方案跟投',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.onPrimary,
            headerTitleStyle: { fontWeight: '600' },
            headerTitleAlign: 'center',
          }}
        />
        <StatusBar style="light" />
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <Text>加載中...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!schemeData) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '方案跟投',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.onPrimary,
            headerTitleStyle: { fontWeight: '600' },
            headerTitleAlign: 'center',
          }}
        />
        <StatusBar style="light" />
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
          <View style={styles.errorContainer}>
            <Text>暫無方案數據</Text>
            <Button onPress={loadSchemeData}>重新加載</Button>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '方案跟投',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: { fontWeight: '600' },
          headerTitleAlign: 'center',
        }}
      />
      <StatusBar style="light" />
      
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 方案信息卡片 */}
        <Card style={[styles.schemeCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <View style={styles.schemeHeader}>
              <Text variant="titleMedium" style={styles.schemeTitle}>
                {schemeData.name}
              </Text>
              <Chip 
                mode="outlined" 
                textStyle={{ fontSize: 12 }}
                style={[styles.statusChip, { borderColor: theme.colors.primary }]}
              >
                {getSchemeStatusText(schemeData.status)}
              </Chip>
            </View>
            
            <View style={styles.schemeInfo}>
              <View style={styles.infoItem}>
                <Text variant="bodySmall" style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}> 
                  方案標識
                </Text>
                <Text variant="bodyMedium">{schemeData.periodId}</Text>
              </View>
              
              <View style={styles.infoItem}>
                <Text variant="bodySmall" style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                  截止時間
                </Text>
                <Text variant="bodyMedium">
                  {new Date(schemeData.deadlineTime).toLocaleString('zh-CN')}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* 連黑理賠服務 */}
        <Card style={[styles.compensationCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content style={styles.compensationContent}>
            <View style={styles.compensationRow}>
              <View style={styles.compensationInfo}>
                <View style={styles.compensationTitleRow}>
                  <Icon source="shield-check" size={20} color={theme.colors.primary} />
                  <Text variant="titleMedium" style={[styles.compensationTitle, { color: theme.colors.onSurface }]}>
                    參與連黑理賠服務
                  </Text>
                </View>
                <Text variant="bodySmall" style={[styles.compensationDescription, { color: theme.colors.onSurfaceVariant }]}>
                  連黑8次後享受理賠保障，收益的50%將投入理賠獎池。切換參與狀態將重置連黑記錄，需從當前週期重新開始計算
                </Text>
              </View>
              <Switch
                value={isCompensationEnabled}
                onValueChange={() => handleCompensationToggle()}
                color={theme.colors.primary}
              />
            </View>
          </Card.Content>
        </Card>

        {/* 投注金額選擇 */}
        <Card style={[styles.betAmountCard, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <Card.Content style={styles.cardContent}>
            {/* 金額輸入區域 */}
            <View style={styles.amountInputSection}>
              <TextInput
                mode="outlined"
                label="投注金額"
                value={betAmount}
                onChangeText={(text) => {
                  setBetAmount(text);
                  // 當用戶輸入完成時驗證金額
                  if (text && !isNaN(parseFloat(text))) {
                    validateBetAmount(text);
                  }
                }}
                onBlur={() => {
                  // 當輸入框失去焦點時驗證金額
                  if (betAmount && !isNaN(parseFloat(betAmount))) {
                    validateBetAmount(betAmount);
                  }
                }}
                placeholder={minimumBetAmount > 0 ? `最小投注金額: ${minimumBetAmount} USDT` : "請輸入投注金額"}
                keyboardType="numeric"
                returnKeyType="done"
                left={<TextInput.Affix text="USDT" />}
                right={
                  betAmount ? (
                    <TextInput.Icon 
                      icon="close-circle" 
                      onPress={() => setBetAmount('')}
                    />
                  ) : null
                }
                style={styles.amountTextInput}
                contentStyle={styles.textInputContent}
                outlineStyle={[
                  styles.textInputOutline,
                  { 
                    borderColor: betAmount ? theme.colors.primary : theme.colors.outline,
                    borderWidth: betAmount ? 2 : 1
                  }
                ]}
              />
              
              {/* 最小投注金額提示 */}
              {minimumBetAmount > 0 && (
                <View style={[styles.minAmountHint, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Icon source="information" size={16} color={theme.colors.onPrimaryContainer} />
                  <Text variant="bodySmall" style={[styles.minAmountText, { color: theme.colors.onPrimaryContainer }]}>
                    最小投注金額: {minimumBetAmount} USDT
                  </Text>
                </View>
              )}
              
              {/* 倍投描述 */}
              <View style={[styles.betDescription, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text variant="bodySmall" style={[styles.betDescriptionText, { color: theme.colors.onSurfaceVariant }]}>
                  倍投策略：連黑時逐步增加投注金額，獲勝時一次性收回所有損失並獲得收益。建議根據預期中獎金額減去累計連黑成本來確定合適的投注金額，合理控制風險。
                </Text>
              </View>
              
            </View>

          </Card.Content>
        </Card>

        {/* 方案詳情區域已移除 */}

        </ScrollView>

        {/* 底部投注區域 */}
        <Surface style={[styles.bottomBar, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.primary }]}>
          {/* 確認投注按鈕 */}
          <Button
            mode="contained"
            onPress={handleBetSubmit}
            style={[styles.betButton, { backgroundColor: theme.colors.primary }]}
            contentStyle={styles.betButtonContent}
            disabled={!betAmount || parseFloat(betAmount) <= 0 || schemeData?.status !== 'pending'}
          >
            確認投注 {betAmount || '0'} USDT
          </Button>
        </Surface>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  schemeCard: {
    marginBottom: 16,
    elevation: 2,
  },
  schemeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  schemeTitle: {
    flex: 1,
    fontWeight: '600',
  },
  statusChip: {
    marginLeft: 8,
  },
  schemeInfo: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
  },
  betAmountCard: {
    marginBottom: 16,
    elevation: 2,
  },
  cardContent: {
    padding: 20,
  },
  compensationCard: {
    marginBottom: 16,
    elevation: 2,
  },
  compensationContent: {
    padding: 16,
  },
  compensationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compensationInfo: {
    flex: 1,
    marginRight: 16,
  },
  compensationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  compensationTitle: {
    marginLeft: 8,
    fontWeight: '600',
  },
  compensationDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  amountInputSection: {
    marginBottom: 0,
  },
  amountTextInput: {
    marginBottom: 16,
  },
  textInputContent: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'left',
  },
  textInputOutline: {
    borderRadius: 12,
  },
  minAmountHint: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  minAmountText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  betDescription: {
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    marginBottom: 0,
  },
  betDescriptionText: {
    fontSize: 11,
    lineHeight: 16,
  },
  matchesCard: {
    marginBottom: 16,
    elevation: 2,
  },
  matchesCardContent: {
    padding: 16,
  },
  matchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  matchesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    marginLeft: 8,
    fontWeight: '600',
  },
  matchCountChip: {
    fontSize: 12,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchesList: {
    gap: 12,
  },
  matchItem: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    position: 'relative',
  },
  matchItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leagueContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leagueName: {
    fontSize: 12,
    fontWeight: '600',
  },
  matchTimeContainer: {
    alignItems: 'flex-end',
  },
  matchTimeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  bettingInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  bettingText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  teamName: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  vsText: {
    marginHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  matchDetails: {
    gap: 8,
    marginBottom: 12,
  },
  matchDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchDetailLabel: {
    fontSize: 12,
  },
  matchResult: {
    fontSize: 14,
    fontWeight: '600',
  },
  matchOdds: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
  },
  matchSelection: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  divider: {
    marginBottom: 12,
  },
  matchInfo: {
    flex: 1,
  },
  matchStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
  },
  matchTime: {
    alignItems: 'flex-end',
  },
  summaryInfo: {
    gap: 12,
  },
  bottomBar: {
    padding: 16,
    elevation: 8,
    gap: 16,
    borderTopWidth: 4,
    borderTopColor: 'transparent', // 将在组件中动态设置
  },
  betButton: {
    borderRadius: 8,
  },
  betButtonContent: {
    paddingVertical: 8,
  },
});
