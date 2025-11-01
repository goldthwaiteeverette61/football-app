import { useWebCompatibleAlert } from '@/components/WebCompatibleAlert';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Card,
    Text,
    useTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../services/apiClient';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'live' | 'finished' | 'upcoming';
  league: string;
  time: string;
  date: string; // 比賽日期
  matchNumber: string; // 比賽編號
  minute?: number; // 比賽進行分鐘數（僅live狀態）
  halftimeScore?: string; // 半場比分
  homeTeamLogo?: string; // 主隊logo圖片鏈接（已移除）
  awayTeamLogo?: string; // 客隊logo圖片鏈接（已移除）
}

export default function FootballMatchesScreen() {
  const theme = useTheme();
  const alert = useWebCompatibleAlert();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // 獲取足球賽事數據
  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get('/app/matches/list');
      
      console.log('API響應:', JSON.stringify(response, null, 2));
      
      // 檢查響應結構
      const responseData = response.data || response;
      
      console.log('響應數據:', responseData);
      console.log('響應code:', responseData.code);
      console.log('響應rows:', responseData.rows);
      
      // 更寬鬆的檢查，支持不同的響應結構
      if ((responseData.code === 200 || responseData.success === true || response.success === true) && 
          (responseData.rows || responseData.data)) {
        // 將API數據轉換為Match接口格式
        const allMatches: Match[] = [];
        
        // 獲取數據源，支持不同的響應結構
        const dataSource = responseData.rows || responseData.data || [];
        
        // 遍歷每個日期的比賽數據
        dataSource.forEach((dateGroup: any) => {
          // 檢查是否是按日期分組的數據結構
          if (dateGroup.bizMatchesVoList && Array.isArray(dateGroup.bizMatchesVoList)) {
            dateGroup.bizMatchesVoList.forEach((match: any) => {
              // 解析比分
              const parseScore = (scoreStr: string, isHome: boolean) => {
                if (!scoreStr || scoreStr === '') return 0;
                const parts = scoreStr.split(':');
                return parseInt(isHome ? parts[0] : parts[1]) || 0;
              };
              
              // 解析時間
              const parseTime = (datetimeStr: string) => {
                if (!datetimeStr) return '00:00';
                const date = new Date(datetimeStr);
                return date.toLocaleTimeString('zh-CN', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                });
              };
              
              // 解析日期
              const parseDate = (datetimeStr: string) => {
                if (!datetimeStr) return '01-01';
                const date = new Date(datetimeStr);
                return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
              };
              
              // 確定比賽狀態 - 優先使用matchPhaseTc，然後使用status字段
              const getMatchStatus = (status: string, matchStatus: string, matchPhaseTc: any) => {
                console.log('🔄 比賽狀態判斷:', { status, matchStatus, matchPhaseTc, statusType: typeof status, matchStatusType: typeof matchStatus, matchPhaseTcType: typeof matchPhaseTc });
                
                // 優先使用matchPhaseTc作為主要判斷依據
                const phaseTc = String(matchPhaseTc || '');
                console.log('🎯 優先使用matchPhaseTc判斷狀態:', phaseTc);
                
                // matchPhaseTc狀態碼判斷
                if (phaseTc === '14' || phaseTc === '15' || phaseTc === '17') {
                  return 'finished'; // 比賽結束
                } else if (phaseTc === '1' || phaseTc === '2' || phaseTc === '3' || phaseTc === '4' || phaseTc === '5' || phaseTc === '6' || phaseTc === '7' || phaseTc === '8' || phaseTc === '9' || phaseTc === '10' || phaseTc === '11' || phaseTc === '12' || phaseTc === '13') {
                  return 'live'; // 比賽進行中（包括上半場、下半場、加時、點球等）
                } else if (phaseTc === '16' || phaseTc === '0') {
                  return 'upcoming'; // 未開始
                }
                
                // 如果matchPhaseTc無法判斷，使用status字段作為備選
                if (status === 'Payout') {
                  return 'finished'; // 已結算 - 比賽結束
                } else if (status === 'Live') {
                  return 'live'; // 進行中
                } else if (status === 'Upcoming' || status === 'Scheduled' || status === 'Selling' || status === 'Define') {
                  return 'upcoming'; // 未開始
                } else if (status === 'Finished' || status === 'Completed') {
                  return 'finished'; // 已結束
                }
                
                // 最後使用matchStatus作為兜底
                if (matchStatus === '6') return 'finished';
                if (matchStatus === '4') return 'upcoming';
                if (matchStatus === '1' || matchStatus === '2' || matchStatus === '3') return 'live';
                
                console.log('⚠️ 未識別的比賽狀態:', { status, matchStatus, matchPhaseTc, phaseTc });
                return 'upcoming';
              };
              
              allMatches.push({
                id: match.matchId?.toString() || '',
                homeTeam: match.homeTeamName || '',
                awayTeam: match.awayTeamName || '',
                homeScore: parseScore(match.fullScore || '0:0', true),
                awayScore: parseScore(match.fullScore || '0:0', false),
                status: getMatchStatus(match.status, match.matchStatus, match.matchPhaseTc || ''),
                league: match.leagueName || '未知聯賽',
                time: parseTime(match.matchDatetime),
                date: parseDate(match.matchDatetime),
                matchNumber: match.matchNumStr || '001',
                minute: match.matchMinute ? parseInt(match.matchMinute) : undefined,
                halftimeScore: match.halfScore || undefined,
                homeTeamLogo: match.homeTeamLogo || '',
                awayTeamLogo: match.awayTeamLogo || '',
              });
            });
          } else if (dateGroup.matchId || dateGroup.homeTeamName) {
            // 如果数据直接是比赛对象，而不是按日期分组
            const match = dateGroup;
            
            // 解析比分
            const parseScore = (scoreStr: string, isHome: boolean) => {
              if (!scoreStr || scoreStr === '') return 0;
              const parts = scoreStr.split(':');
              return parseInt(isHome ? parts[0] : parts[1]) || 0;
            };
            
            // 解析时间
            const parseTime = (datetimeStr: string) => {
              if (!datetimeStr) return '00:00';
              const date = new Date(datetimeStr);
              return date.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
              });
            };
            
            // 解析日期
            const parseDate = (datetimeStr: string) => {
              if (!datetimeStr) return '01-01';
              const date = new Date(datetimeStr);
              return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
            };
            
            // 确定比赛状态 - 优先使用status字段
            const getMatchStatus = (status: string, matchStatus: string, matchPhaseTc: any) => {
              console.log('🔄 比赛状态判断(else分支):', { status, matchStatus, matchPhaseTc, statusType: typeof status, matchStatusType: typeof matchStatus, matchPhaseTcType: typeof matchPhaseTc });
              
              // 优先使用status字段判断
              if (status === 'Payout') {
                return 'finished'; // 已结算 - 比赛结束
              } else if (status === 'Live') {
                return 'live'; // 进行中
              } else if (status === 'Upcoming' || status === 'Scheduled' || status === 'Selling' || status === 'Define') {
                  return 'upcoming'; // 未開始
              } else if (status === 'Finished' || status === 'Completed') {
                return 'finished'; // 已结束
              }
              
              // 如果status字段无法判断，使用matchStatus作为备选
              if (matchStatus === '6') return 'finished';
              if (matchStatus === '4') return 'upcoming';
              if (matchStatus === '1' || matchStatus === '2' || matchStatus === '3') return 'live';
              
              // 最后使用matchPhaseTc作为兜底
              const phaseTc = String(matchPhaseTc || '');
              if (phaseTc === '14' || phaseTc === '') {
                return 'finished'; // 比赛结束
              } else if (phaseTc === '10') {
                return 'live'; // 中场休息
              } else if (phaseTc === '1' || phaseTc === '2') {
                return 'live'; // 比赛进行中
              } else if (phaseTc === '16') {
                  return 'upcoming'; // 未開始
              }
              
              console.log('⚠️ 未识别的比赛状态(else分支):', { status, matchStatus, matchPhaseTc, phaseTc });
              return 'upcoming';
            };
            
            allMatches.push({
              id: match.matchId?.toString() || '',
              homeTeam: match.homeTeamName || '',
              awayTeam: match.awayTeamName || '',
              homeScore: parseScore(match.fullScore || '0:0', true),
              awayScore: parseScore(match.fullScore || '0:0', false),
              status: getMatchStatus(match.status, match.matchStatus, match.matchPhaseTc || ''),
              league: match.leagueName || '未知联赛',
              time: parseTime(match.matchDatetime),
              date: parseDate(match.matchDatetime),
              matchNumber: match.matchNumStr || '001',
              minute: match.matchMinute ? parseInt(match.matchMinute) : undefined,
              halftimeScore: match.halfScore || undefined,
              homeTeamLogo: match.homeTeamLogo || '',
              awayTeamLogo: match.awayTeamLogo || '',
            });
          }
        });
        
        console.log('解析后的比赛数据:', allMatches);
        setMatches(allMatches);
      } else {
        console.log('API响应不符合预期格式:', {
          code: responseData.code,
          success: responseData.success,
          hasRows: !!responseData.rows,
          hasData: !!responseData.data,
          msg: responseData.msg
        });
        setError(responseData.msg || `獲取賽事數據失敗: code=${responseData.code}, success=${responseData.success}`);
      }
    } catch (err: any) {
      console.error('獲取足球賽事數據失敗:', err);
      setError(err.message || '網絡請求失敗');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchMatches();
  }, []);

  // 下拉刷新
  const onRefresh = () => {
    setRefreshing(true);
    fetchMatches();
  };







  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live':
        return '#ff4444';      // 进行中 - 红色
      case 'finished':
        return '#9E9E9E';      // 已结束 - 深灰色
      case 'upcoming':
        return '#BDBDBD';      // 未开始 - 浅灰色
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  // 获取状态文本 - 根据倍投界面的逻辑
  const getStatusText = (match: Match) => {
    console.log('🔄 获取状态文本:', { status: match.status, minute: match.minute });
    
    switch (match.status) {
      case 'live':
        // 根据倍投界面的逻辑，live状态可能包括中场休息
        if (match.minute !== undefined && match.minute > 0) {
          return `進行中 ${match.minute}'`;
        } else {
          return '進行中';
        }
      case 'finished':
        return '已結束';
      case 'upcoming':
        return '未開始';
      default:
        console.log('⚠️ 未知状态:', match.status);
        return '未知狀態';
    }
  };

  // 按日期分组比赛
  const groupMatchesByDate = (matches: Match[]) => {
    const grouped: { [key: string]: Match[] } = {};
    matches.forEach(match => {
      if (!grouped[match.date]) {
        grouped[match.date] = [];
      }
      grouped[match.date].push(match);
    });
    return grouped;
  };

  // 渲染日期分隔符
  const renderDateSeparator = (date: string) => (
    <View key={`date-${date}`} style={styles.dateSeparator}>
      <View style={[styles.dateLine, { backgroundColor: theme.colors.primary }]} />
      <Text variant="bodyMedium" style={[styles.dateText, { color: theme.colors.onSurface }]}>
        {date} 星期一
      </Text>
    </View>
  );

  // 渲染比赛卡片
  const renderMatchCard = (match: Match) => (
    <Card key={match.id} style={styles.matchCard} elevation={1}>
      <Card.Content style={styles.matchContent}>
        {/* 比赛头部信息 */}
        <View style={styles.matchHeader}>
          <View style={[styles.leagueTag, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="bodySmall" style={[styles.leagueText, { color: theme.colors.onSurfaceVariant }]}>
              {match.league}
            </Text>
          </View>
          <View style={styles.matchInfoRight}>
            <Text variant="bodySmall" style={[styles.matchNumber, { color: theme.colors.onSurfaceVariant }]}>
              {match.matchNumber}
            </Text>
            <Text variant="bodySmall" style={[styles.matchTime, { color: theme.colors.onSurface }]}>
              {match.date} {match.time}
            </Text>
          </View>
        </View>

        {/* 队伍和比分信息 - 3列布局 */}
        <View style={styles.matchInfo}>
          {/* 主队 - 左列 */}
          <View style={styles.homeTeamColumn}>
            <View style={styles.homeTeamInfo}>
              <Text variant="titleMedium" style={[styles.homeTeamName, { color: theme.colors.onSurface }]}>
                {match.homeTeam}
              </Text>
            </View>
          </View>

          {/* 比分区域 - 中列 */}
          <View style={styles.scoreColumn}>
            {match.status === 'upcoming' ? (
              <Text variant="bodyLarge" style={[styles.vsText, { color: theme.colors.onSurfaceVariant }]}>
                VS
              </Text>
            ) : (
              <View style={styles.scoreContainer}>
                <Text variant="headlineMedium" style={[styles.score, { color: '#ff4444' }]}>
                  {match.homeScore}:{match.awayScore}
                </Text>
                {match.halftimeScore && (
                  <Text variant="bodySmall" style={[styles.halftimeScore, { color: theme.colors.onSurfaceVariant }]}>
                    半場 {match.halftimeScore}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* 客队 - 右列 */}
          <View style={styles.awayTeamColumn}>
            <View style={styles.awayTeamInfo}>
              <Text variant="titleMedium" style={[styles.awayTeamName, { color: theme.colors.onSurface }]}>
                {match.awayTeam}
              </Text>
            </View>
          </View>
        </View>


        {/* 状态信息 */}
        <View style={styles.matchFooter}>
          <View style={styles.statusInfo}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(match.status) }]} />
            <Text variant="bodySmall" style={[styles.statusText, { color: getStatusColor(match.status) }]}>
              {getStatusText(match)}
            </Text>
          </View>
         {/* AI预测按钮 */}
         <View style={styles.aiPredictionButton}>
           <Text 
             variant="bodySmall" 
             style={[styles.aiPredictionText, { color: theme.colors.primary }]}
             onPress={() => {
               alert(
                 'AI預測分析',
                 '即將提供AI預測分析功能，敬請期待！',
                 [{ text: '確定', style: 'default' }]
               );
             }}
           >
             AI預測
           </Text>
         </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: '足球賽事',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: { fontWeight: '600' },
          headerTitleAlign: 'center',
        }}
      />
      <StatusBar style="light" />
      
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>

      {/* 比赛列表 */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 }]}
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text variant="bodyMedium" style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
              加載比賽數據中...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text variant="bodyLarge" style={[styles.errorText, { color: theme.colors.error }]}>
              {error}
            </Text>
            <Text 
              variant="bodyMedium" 
              style={[styles.retryText, { color: theme.colors.primary }]}
              onPress={fetchMatches}
            >
              點擊重試
            </Text>
          </View>
        ) : matches.length > 0 ? (
          (() => {
            const groupedMatches = groupMatchesByDate(matches);
            return Object.keys(groupedMatches).map(date => (
              <View key={date}>
                {renderDateSeparator(date)}
                {groupedMatches[date].map(renderMatchCard)}
              </View>
            ));
          })()
        ) : (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              暫無比賽數據
            </Text>
          </View>
        )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  dateLine: {
    width: 4,
    height: 20,
    marginRight: 12,
  },
  dateText: {
    fontWeight: '600',
  },
  matchCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  matchContent: {
    padding: 16,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchInfoRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leagueTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  leagueText: {
    fontSize: 12,
    fontWeight: '500',
  },
  matchTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  matchNumber: {
    fontSize: 12,
    fontWeight: '500',
  },
  matchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    minHeight: 60,
  },
  teamColumn: {
    flex: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeTeamColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  awayTeamColumn: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  scoreColumn: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeTeamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
  awayTeamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  teamName: {
    fontWeight: '600',
    textAlign: 'center',
  },
  homeTeamName: {
    fontWeight: '600',
    textAlign: 'right',
    alignSelf: 'flex-end',
    flex: 1,
  },
  awayTeamName: {
    fontWeight: '600',
    textAlign: 'left',
    alignSelf: 'flex-start',
    flex: 1,
  },
  score: {
    fontWeight: 'bold',
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  vsText: {
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  halftimeScore: {
    textAlign: 'center',
    marginTop: 2,
    fontSize: 12,
    lineHeight: 14,
  },
  matchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  aiPredictionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  aiPredictionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  retryText: {
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
