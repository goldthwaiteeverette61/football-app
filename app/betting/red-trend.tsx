import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiClient } from '@/services/apiClient';
import { createShadowStyle } from '@/utils/webCompatibility';

interface RedTrendData {
  redCount: number;
  blackCount: number;
  recentDistribution: ('red' | 'black' | 'pending')[];
  schemes: {
  id: string;
    name: string;
  createTime: string;
    deadlineTime?: string;
    resultTime?: string;
  status: 'won' | 'lost' | 'pending';
  matches: {
    matchId: number;
    matchNum: string;
    leagueName: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
    matchStatus: string;
    matchPhase: string;
    bettingOptions: {
    betType: string;
    handicap?: number;
      goalLine?: string;
      odds: number;
    options: {
      home: { label: string; odds: number; selected: boolean; hasRedUnderline?: boolean };
      draw: { label: string; odds: number; selected: boolean; hasRedUnderline?: boolean };
      away: { label: string; odds: number; selected: boolean; hasRedUnderline?: boolean };
    };
    }[];
  }[];
  }[];
}

const RedTrendScreen: React.FC = () => {
  const theme = useTheme();
  const [trendData, setTrendData] = useState<RedTrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [pageSize] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false); // (新增) 分页加载状态

  // 计算中奖结果的函数
  const calculateWinningResult = (score: string, betType: string, goalLine?: string, matchStatus?: string) => {
    // 如果比赛未開始，不计算中奖结果
    if (matchStatus === '0' || matchStatus === '1' || !score || score === 'vs' || score === '0:0') {
      return null;
    }
    
    const [homeScore, awayScore] = score.split(':').map(Number);
    const goalLineNum = goalLine ? parseFloat(goalLine) : 0;
    
    if (betType === '勝負平') {
      // 勝負平玩法
      if (homeScore > awayScore) return 'home';
      if (homeScore < awayScore) return 'away';
      return 'draw';
    } else {
      // 讓球/受讓玩法
      const adjustedHomeScore = homeScore + goalLineNum;
      if (adjustedHomeScore > awayScore) return 'home';
      if (adjustedHomeScore < awayScore) return 'away';
      return 'draw';
    }
  };

  // 获取趋势数据
  const fetchTrendData = useCallback(async () => {
    try {
      console.log('开始获取紅單趨勢数据...');
      
      // 尝试获取真实数据
      console.log('开始调用dashboard API...');
      const response = await apiClient.get('/app/schemePeriods/dashboard');
      console.log('API响应:', response);
      
      if (response.success && response.data) {
        const apiData = response.data;
        console.log('API原始数据:', JSON.stringify(apiData, null, 2));
        
        // 检查API响应结构
        if (apiData.code === 401) {
          console.log('API认证失败，使用模拟数据');
          throw new Error('认证失败');
        }

        // 处理 recentResults 数据（倒序排列，最新的在前面，只保留最近30天）
        const recentDistribution = (apiData.data?.recentResults || apiData.recentResults || [])
          .slice() // 创建副本避免修改原数组
          .reverse() // 倒序排列，最新的在前面
          .slice(0, 30) // 只保留最近30天的数据
          .map((result: string) => {
            switch (result) {
              case 'won': return 'red';
              case 'lost': return 'black';
              case 'pending': return 'pending';
              default: return 'pending';
            }
          });
        
        console.log('处理后的recentDistribution:', recentDistribution);
        console.log('totalWon:', apiData.data?.totalWon || apiData.totalWon, 'totalLost:', apiData.data?.totalLost || apiData.totalLost);

        const trendData: RedTrendData = {
          redCount: apiData.data?.totalWon || apiData.totalWon || 0,
          blackCount: apiData.data?.totalLost || apiData.totalLost || 0,
          recentDistribution: recentDistribution,
          schemes: [] // 方案数据单独加载
        };
        console.log('趋势数据:', {
          redCount: trendData.redCount,
          blackCount: trendData.blackCount,
          recentDistributionLength: trendData.recentDistribution.length
        });
        setTrendData(trendData);
      } else {
        console.log('API调用失败，使用模拟数据:', response.message);
        // 使用模拟数据
        const mockRecentResults = [
          'won', 'lost', 'won', 'won', 'lost', 'won', 'lost', 'lost', 'won', 'lost',
          'won', 'lost', 'won', 'won', 'lost', 'won', 'lost', 'won', 'lost', 'won',
          'lost', 'won', 'lost', 'won', 'lost', 'won', 'lost', 'won', 'lost', 'won'
        ];
        
        const mockRecentDistribution = mockRecentResults
          .slice()
          .reverse()
          .slice(0, 30) // 只保留最近30天的数据
          .map((result: string) => {
            switch (result) {
              case 'won': return 'red';
              case 'lost': return 'black';
              case 'pending': return 'pending';
              default: return 'pending';
            }
          });
        
        const mockTrendData: RedTrendData = {
          redCount: 9,
          blackCount: 13,
          recentDistribution: mockRecentDistribution,
          schemes: [
            {
              id: '1965374109900398593',
              name: '2025090901',
              createTime: '2025-09-09 19:17:57',
              deadlineTime: '2025-09-09 22:00:00',
              status: 'won' as const,
              matches: [
                {
                  matchId: 2033497,
                  matchNum: '週二008',
                  leagueName: '世界盃預選賽',
                  homeTeam: '厄瓜多爾',
                  awayTeam: '阿根廷',
                  score: '1:0',
                  matchStatus: '5',
                  matchPhase: '季後賽',
                  bettingOptions: [
                    {
                  betType: '勝負平',
                      goalLine: '0',
                      odds: 2.25,
                  options: {
                        home: { label: '主勝', odds: 3.33, selected: false, hasRedUnderline: false },
                        draw: { label: '平', odds: 2.60, selected: false, hasRedUnderline: false },
                        away: { label: '客勝', odds: 2.25, selected: true, hasRedUnderline: true }
                      }
                    }
                  ]
                }
              ]
            },
            {
              id: '1965374109900398594',
              name: '2025090902',
              createTime: '2025-09-09 18:45:23',
              deadlineTime: '2025-09-09 23:00:00',
              status: 'pending' as const,
              matches: [
                {
                  matchId: 2033500,
                  matchNum: '週二011',
                  leagueName: '世界盃預選賽',
                  homeTeam: '智利',
                  awayTeam: '烏拉圭',
                  score: 'vs',
                  matchStatus: '0',
                  matchPhase: '未開始',
                  bettingOptions: [
                    {
                      betType: '勝負平',
                      goalLine: '0',
                      odds: 1.82,
                  options: {
                        home: { label: '主勝', odds: 3.85, selected: false, hasRedUnderline: false },
                        draw: { label: '平', odds: 3.12, selected: false, hasRedUnderline: false },
                        away: { label: '客勝', odds: 1.82, selected: true, hasRedUnderline: false }
                      }
                    }
                  ]
                }
              ]
            }
          ]
        };
        console.log('设置模拟数据:', mockTrendData);
        setTrendData(mockTrendData);
      }
    } catch (error) {
      console.log('获取数据出错:', error);
      // 模拟数据 - 模拟 recentResults 数据（按时间顺序，最新的在最后）
      const mockRecentResults = [
        'won', 'lost', 'won', 'won', 'lost', 'won', 'lost', 'lost', 'won', 'lost',
        'won', 'lost', 'won', 'won', 'lost', 'won', 'lost', 'won', 'lost', 'won',
        'lost', 'won', 'lost', 'won', 'lost', 'won', 'lost', 'won', 'lost', 'won'
      ];
      
      // 将模拟的 recentResults 转换为 red/black，并倒序排列（最新的在前面）
      const mockRecentDistribution = mockRecentResults
        .slice() // 创建副本避免修改原数组
        .reverse() // 倒序排列，最新的在前面
        .map((result: string) => {
          switch (result) {
            case 'won': return 'red';
            case 'lost': return 'black';
            case 'pending': return 'pending';
            default: return 'pending';
          }
        });
      
      const mockTrendData: RedTrendData = {
        redCount: 9,
        blackCount: 13,
          recentDistribution: mockRecentDistribution,
          schemes: [
            {
              id: '1965374109900398593',
              name: '2025090901',
              createTime: '2025-09-09 19:17:57',
              deadlineTime: '2025-09-09 22:00:00',
              status: 'won' as const,
              matches: [
                {
                  matchId: 2033497,
                  matchNum: '週二008',
                  leagueName: '世界盃預選賽',
                  homeTeam: '厄瓜多爾',
                  awayTeam: '阿根廷',
                  score: '1:0',
                  matchStatus: '5',
                  matchPhase: '季後賽',
                  bettingOptions: [
                    {
                      betType: '勝負平',
                      goalLine: '0',
                      odds: 2.25,
                      options: {
                        home: { label: '主勝', odds: 3.33, selected: false, hasRedUnderline: false },
                        draw: { label: '平', odds: 2.60, selected: false, hasRedUnderline: false },
                        away: { label: '客勝', odds: 2.25, selected: true, hasRedUnderline: true }
                      }
                    }
                  ]
                }
              ]
            },
            {
              id: '1965374109900398594',
              name: '2025090902',
              createTime: '2025-09-09 18:45:23',
              deadlineTime: '2025-09-09 23:00:00',
              status: 'pending' as const,
              matches: [
                {
                  matchId: 2033500,
                  matchNum: '週二011',
                  leagueName: '世界盃預選賽',
                  homeTeam: '智利',
                  awayTeam: '烏拉圭',
                  score: 'vs',
                  matchStatus: '0',
                  matchPhase: '未開始',
                  bettingOptions: [
                    {
                      betType: '勝負平',
                      goalLine: '0',
                      odds: 1.82,
                      options: {
                        home: { label: '主勝', odds: 3.85, selected: false, hasRedUnderline: false },
                        draw: { label: '平', odds: 3.12, selected: false, hasRedUnderline: false },
                        away: { label: '客勝', odds: 1.82, selected: true, hasRedUnderline: false }
                      }
                    }
                  ]
                }
              ]
            }
          ]
        };
      console.log('设置错误处理模拟数据:', mockTrendData);
      setTrendData(mockTrendData);
    } finally {
      console.log('数据加载完成，设置loading为false');
      setLoading(false);
    }
  }, []);

  // (已修改) 获取方案列表
  const fetchSchemes = useCallback(async (page: number = 1, isRefresh: boolean = false) => {
    if (page > 1) setIsPaginating(true); // (新增) 设置分页加载状态

    try {
      console.log(`获取方案列表 - 页码: ${page}, 刷新: ${isRefresh}`);
      
      const response = await apiClient.get(`/app/schemePeriods/list?pageNum=${page}&pageSize=${pageSize}`);
      console.log('方案列表API响应:', response);
      
      if (response.success && response.data) {
        const apiData = response.data;
        // 修复数据解析路径：API返回的是 {code: 200, data: {code: 200, rows: [], total: 23}}
        const schemesList = apiData.data?.rows || apiData.rows || [];
        
        console.log('API原始数据:', JSON.stringify(apiData, null, 2));
        console.log('方案列表数据:', JSON.stringify(schemesList, null, 2));
        
        const schemesData = schemesList.map((scheme: any) => {
          console.log('处理方案:', scheme.name, '原始状态:', scheme.status, '详情数量:', scheme.details?.length);
          
          // 按比赛ID分组，合并相同比赛的投注选项
          const matchGroups = new Map();
          
          (scheme.details || []).forEach((detail: any) => {
            const match = detail.bizMatchesVo;
            const matchId = match?.matchId;
            const poolCode = detail.poolCode;
            const selection = detail.selection;
            const goalLine = detail.goalLine;
            const odds = detail.odds;
            
            console.log('处理比赛详情:', {
              matchId,
              poolCode,
              selection,
              goalLine,
              odds,
              homeTeam: match?.homeTeamName,
              awayTeam: match?.awayTeamName,
              had: match?.had,
              hhad: match?.hhad
            });
            
            if (!matchGroups.has(matchId)) {
              // 创建新的比赛组
              const matchStatus = match?.matchStatus;
              let displayScore = 'vs';
              
              // 根据比赛状态决定显示内容
              if (matchStatus === '0' || matchStatus === '1') {
                // 比赛未開始
                displayScore = 'vs';
              } else if (match?.fullScore) {
                // 比赛已結束，显示全场比分
                displayScore = match.fullScore;
              } else if (match?.halfScore) {
                // 比赛进行中，显示半场比分
                displayScore = match.halfScore;
              } else {
                // 默认显示vs
                displayScore = 'vs';
              }
              
              matchGroups.set(matchId, {
                matchId: match?.matchId,
                matchNum: match?.matchNumStr,
                leagueName: match?.leagueName,
                homeTeam: match?.homeTeamName || '',
                awayTeam: match?.awayTeamName || '',
                score: displayScore,
                matchStatus: match?.matchStatus,
                matchPhase: match?.matchPhaseTcName,
                bettingOptions: []
              });
            }
            
            // 根据 poolCode 确定投注类型
            let betType = '勝負平';
            let handicap: number | undefined;
            
            if (poolCode === 'HAD') {
              betType = '勝負平';
            } else if (poolCode === 'HHAD') {
              betType = goalLine && parseFloat(goalLine) > 0 ? '受讓' : '讓球';
              handicap = goalLine ? parseFloat(goalLine) : undefined;
            }
            
            // 构建选项数据 - 根据poolCode选择正确的赔率数据源
            const oddsData = poolCode === 'HAD' ? match?.had : match?.hhad;
            const currentScore = match?.fullScore || match?.halfScore || 'vs';
            const winningResult = calculateWinningResult(currentScore, betType, goalLine, match?.matchStatus);
            
            const options = {
              home: { 
                label: '主勝', 
                odds: parseFloat(oddsData?.homeOdds || '0'), 
                selected: selection === 'H',
                hasRedUnderline: winningResult === 'home'
              },
              draw: { 
                label: '平', 
                odds: parseFloat(oddsData?.drawOdds || '0'), 
                selected: selection === 'D',
                hasRedUnderline: winningResult === 'draw'
              },
              away: { 
                label: '客勝', 
                odds: parseFloat(oddsData?.awayOdds || '0'), 
                selected: selection === 'A',
                hasRedUnderline: winningResult === 'away'
              }
            };
            
            // 添加投注选项到比赛组
            matchGroups.get(matchId).bettingOptions.push({
              betType,
              handicap,
              goalLine,
              odds: parseFloat(odds || '0'),
              options
            });
          });
          
          // 转换为数组格式
          const matches = Array.from(matchGroups.values());
          
          return {
            id: scheme.periodId,
            name: scheme.name,
            createTime: scheme.createTime,
            deadlineTime: scheme.deadlineTime,
            resultTime: scheme.resultTime,
            status: (() => {
              const mappedStatus = scheme.status === 'WON' || scheme.status === 'won' ? 'won' : 
                                  scheme.status === 'LOST' || scheme.status === 'lost' ? 'lost' : 'pending';
              console.log('方案', scheme.name, '状态映射:', scheme.status, '->', mappedStatus);
              return mappedStatus;
            })(),
            matches
          };
        });
        
        console.log('处理后的方案数据:', schemesData);
        
        // 更新方案数据
        setTrendData(prevData => {
          if (!prevData) {
            // 如果prevData不存在，创建一个基本的数据结构
            return {
              redCount: 0,
              blackCount: 0,
              recentDistribution: [],
              schemes: schemesData
            };
          }
          return {
            ...prevData,
            schemes: isRefresh ? schemesData : [...prevData.schemes, ...schemesData]
          };
        });
        
        // 检查是否还有更多数据
        setHasMore(schemesData.length === pageSize);
        setPageNum(page);
        
      } else {
        console.log('方案列表API调用失败:', response.message);
        // 使用模拟数据
        const mockSchemes = [
          {
            id: '1965374109900398593',
            name: '2025090901',
            createTime: '2025-09-09 19:17:57',
            deadlineTime: '2025-09-09 22:00:00',
            status: 'won' as const,
            matches: [
              {
                matchId: 2033497,
                matchNum: '週二008',
                leagueName: '世界盃預選賽',
                homeTeam: '厄瓜多爾',
                awayTeam: '阿根廷',
                score: '1:0',
                matchStatus: '5',
                matchPhase: '季後賽',
                bettingOptions: [
                  {
                    betType: '勝負平',
                    goalLine: '0',
                    odds: 2.25,
                    options: {
                      home: { label: '主勝', odds: 3.33, selected: false, hasRedUnderline: false },
                      draw: { label: '平', odds: 2.60, selected: false, hasRedUnderline: false },
                      away: { label: '客勝', odds: 2.25, selected: true, hasRedUnderline: true }
                    }
                  }
                ]
              }
            ]
          }
        ];
        
        setTrendData(prevData => {
          if (!prevData) {
            // 如果prevData不存在，创建一个基本的数据结构
            return {
              redCount: 0,
              blackCount: 0,
              recentDistribution: [],
              schemes: mockSchemes
            };
          }
          return {
            ...prevData,
            schemes: isRefresh ? mockSchemes : [...prevData.schemes, ...mockSchemes]
          };
        });
        setHasMore(false);
      }
    } catch (error) {
      console.log('获取方案列表出错:', error);
      setHasMore(false);
    } finally {
      if (page > 1) setIsPaginating(false); // (新增) 清除分页加载状态
    }
  }, [pageSize]);

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPageNum(1);
    setHasMore(true);
    await fetchSchemes(1, true);
    setRefreshing(false);
  }, [fetchSchemes]);

  // (已修改) 加载更多
  const loadMore = useCallback(() => {
    console.log('loadMore 触发检查:', { hasMore, loading, refreshing, isPaginating });
    if (hasMore && !loading && !refreshing && !isPaginating) {
      console.log(`>>> 正在加载第 ${pageNum + 1} 页...`);
      fetchSchemes(pageNum + 1, false);
    } else {
      console.log('--- 阻止加载更多 ---');
    }
  }, [hasMore, loading, refreshing, isPaginating, pageNum, fetchSchemes]);

  // (新增) 滚动事件处理
  const handleScroll = (event: any) => {
    const nativeEvent = event.nativeEvent;
    const layoutHeight = nativeEvent.layoutMeasurement.height;
    const contentOffsetY = nativeEvent.contentOffset.y;
    const contentSizeHeight = nativeEvent.contentSize.height;

    const paddingToBottom = 20;
    if (layoutHeight + contentOffsetY >= contentSizeHeight - paddingToBottom) {
      loadMore();
    }
  };

  useEffect(() => {
    const loadData = async () => {
      console.log('=== 开始加载数据 ===');
      setLoading(true);
      
      try {
        console.log('1. 开始获取趋势数据...');
        await fetchTrendData();
        console.log('2. 趋势数据获取完成，开始获取方案列表...');
        await fetchSchemes(1, true);
        console.log('3. 方案列表获取完成');
        console.log('=== 数据加载完成 ===');
      } catch (error) {
        console.log('=== 数据加载出错 ===', error);
        // 设置一个基本的測試数据确保界面能显示
        const testData: RedTrendData = {
          redCount: 5,
          blackCount: 3,
          recentDistribution: ['red', 'black', 'red', 'red', 'black', 'red', 'black', 'red'],
          schemes: [
            {
              id: 'test1',
              name: '測試方案1',
              createTime: '2025-01-09 10:00:00',
              status: 'won' as const,
              matches: [
                {
                  matchId: 1,
                  matchNum: '測試001',
                  leagueName: '測試聯賽',
                  homeTeam: '測試主隊',
                  awayTeam: '測試客隊',
                  score: '2:1',
                  matchStatus: '5',
                  matchPhase: '已結束',
                  bettingOptions: [
                    {
                      betType: '勝負平',
                      goalLine: '0',
                      odds: 2.0,
                      options: {
                        home: { label: '主勝', odds: 2.5, selected: false, hasRedUnderline: false },
                        draw: { label: '平', odds: 3.0, selected: false, hasRedUnderline: false },
                        away: { label: '客勝', odds: 2.0, selected: true, hasRedUnderline: true }
                      }
                    }
                  ]
                }
              ]
            }
          ]
        };
        console.log('设置測試数据:', testData);
        setTrendData(testData);
      } finally {
        setLoading(false);
        console.log('=== 设置loading为false ===');
      }
    };
    loadData();
  }, [fetchTrendData, fetchSchemes]);

  const renderTrendBar = (type: 'red' | 'black' | 'pending', index: number) => {
    const isRed = type === 'red';
    const isBlack = type === 'black';
    
    return (
      <View
        key={index}
        style={[
          styles.trendBar,
          {
            backgroundColor: isRed ? '#ff4444' : isBlack ? '#333333' : '#ffd700',
            height: isRed ? 50 : isBlack ? 35 : 20,
          },
        ]}
      />
    );
  };

  const renderSchemeCard = (scheme: any) => {
    console.log('渲染方案卡片:', scheme.name, '状态:', scheme.status);
    const isRed = scheme.status === 'won';
    const isBlack = scheme.status === 'lost';
    console.log('状态判断 - isRed:', isRed, 'isBlack:', isBlack);
    
    
    return (
      <View key={scheme.id} style={styles.schemeCard}>
        {/* 方案标题和状态 */}
        <View style={styles.schemeHeader}>
          <View style={styles.schemeTitleContainer}>
            <Text style={styles.schemeTitle}>{scheme.name}</Text>
            <Text style={styles.schemeTime}>
              {new Date(scheme.createTime).toLocaleString('zh-CN')}
            </Text>
          </View>
          <View style={[
            styles.statusChip,
            { 
              backgroundColor: isRed ? '#f44336' : isBlack ? '#333333' : '#ff9800' 
            }
          ]}>
            <Text style={styles.statusChipText}>
              {isRed ? '紅' : isBlack ? '黑' : '未'}
            </Text>
          </View>
        </View>


        {/* 比赛信息 */}
        <View style={styles.matchesContainer}>
          {scheme.matches.map((match: any, matchIndex: number) => (
            <View key={matchIndex} style={styles.matchContainer}>
              {/* 比赛标题 */}
              <View style={styles.matchHeader}>
                <View style={styles.matchTitleRow}>
                  <Text style={styles.matchNum}>{match.matchNum}</Text>
                  <Text style={styles.matchTitle}>
                    {match.homeTeam} {match.score} {match.awayTeam}
                  </Text>
                </View>
              </View>

              {/* 投注选项 - 合并显示所有投注类型 */}
              <View style={styles.bettingRow}>
                {/* 玩法类型显示 */}
                <View style={[styles.bettingButton, styles.bettingButtonCategory]}>
                  <Text style={styles.bettingTextCategory}>
                    {match.bettingOptions[0]?.betType === '勝負平' ? '勝負平' :
                     (match.bettingOptions[0]?.goalLine && parseFloat(match.bettingOptions[0].goalLine) > 0) ? '受讓' :
                     (match.bettingOptions[0]?.goalLine && parseFloat(match.bettingOptions[0].goalLine) < 0) ? '讓球' : '勝負平'}
                  </Text>
                  <Text style={styles.bettingOddsCategory}>
                    {match.bettingOptions[0]?.betType === '勝負平' ? '0' : (match.bettingOptions[0]?.goalLine || '0')}
                  </Text>
                </View>
                
                {/* 主勝选项 - 合并所有投注类型的主勝信息 */}
                <View style={[
                  styles.bettingButton,
                  match.bettingOptions.some((option: any) => option.options.home.selected) && styles.bettingButtonSelected,
                  match.bettingOptions.some((option: any) => option.options.home.hasRedUnderline) && styles.bettingButtonWinning
                ]}>
                  <Text style={[
                    styles.bettingText,
                    match.bettingOptions.some((option: any) => option.options.home.selected) && styles.bettingTextSelected,
                    match.bettingOptions.some((option: any) => option.options.home.hasRedUnderline) && styles.bettingTextWinning
                  ]}>
                    主勝
                  </Text>
                  <Text style={[
                    styles.bettingOdds,
                    match.bettingOptions.some((option: any) => option.options.home.selected) && styles.bettingOddsSelected,
                    match.bettingOptions.some((option: any) => option.options.home.hasRedUnderline) && styles.bettingOddsWinning
                  ]}>
                    {match.bettingOptions[0]?.options.home.odds || '0'}
                  </Text>
                </View>
                
                {/* 平局选项 - 合并所有投注类型的平局信息 */}
                <View style={[
                  styles.bettingButton,
                  match.bettingOptions.some((option: any) => option.options.draw.selected) && styles.bettingButtonSelected,
                  match.bettingOptions.some((option: any) => option.options.draw.hasRedUnderline) && styles.bettingButtonWinning
                ]}>
                  <Text style={[
                    styles.bettingText,
                    match.bettingOptions.some((option: any) => option.options.draw.selected) && styles.bettingTextSelected,
                    match.bettingOptions.some((option: any) => option.options.draw.hasRedUnderline) && styles.bettingTextWinning
                  ]}>
                    平
                  </Text>
                  <Text style={[
                    styles.bettingOdds,
                    match.bettingOptions.some((option: any) => option.options.draw.selected) && styles.bettingOddsSelected,
                    match.bettingOptions.some((option: any) => option.options.draw.hasRedUnderline) && styles.bettingOddsWinning
                  ]}>
                    {match.bettingOptions[0]?.options.draw.odds || '0'}
                  </Text>
                </View>
                
                {/* 客勝选项 - 合并所有投注类型的客勝信息 */}
                <View style={[
                  styles.bettingButton,
                  match.bettingOptions.some((option: any) => option.options.away.selected) && styles.bettingButtonSelected,
                  match.bettingOptions.some((option: any) => option.options.away.hasRedUnderline) && styles.bettingButtonWinning
                ]}>
                  <Text style={[
                    styles.bettingText,
                    match.bettingOptions.some((option: any) => option.options.away.selected) && styles.bettingTextSelected,
                    match.bettingOptions.some((option: any) => option.options.away.hasRedUnderline) && styles.bettingTextWinning
                  ]}>
                    客勝
                  </Text>
                  <Text style={[
                    styles.bettingOdds,
                    match.bettingOptions.some((option: any) => option.options.away.selected) && styles.bettingOddsSelected,
                    match.bettingOptions.some((option: any) => option.options.away.hasRedUnderline) && styles.bettingOddsWinning
                  ]}>
                    {match.bettingOptions[0]?.options.away.odds || '0'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  console.log('=== 渲染状态检查 ===');
  console.log('loading:', loading);
  console.log('trendData:', trendData);
  console.log('trendData类型:', typeof trendData);
  console.log('trendData是否为null:', trendData === null);
  console.log('trendData是否为undefined:', trendData === undefined);
  
  if (trendData) {
    console.log('UI数据检查:', {
      redCount: trendData.redCount,
      blackCount: trendData.blackCount,
      recentDistributionLength: trendData.recentDistribution?.length,
      schemesCount: trendData.schemes?.length,
      recentDistribution: trendData.recentDistribution?.slice(0, 10)
    });
  }

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '紅單趨勢',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.onPrimary,
            headerTitleStyle: { fontWeight: '600' },
            headerTitleAlign: 'center',
          }}
        />
        <StatusBar style="light" />
        <SafeAreaView style={[styles.container, { backgroundColor: '#f5f5f5' }]} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>正在加載數據...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!trendData) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '紅單趨勢',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.onPrimary,
            headerTitleStyle: { fontWeight: '600' },
            headerTitleAlign: 'center',
          }}
        />
        <StatusBar style="light" />
        <SafeAreaView style={[styles.container, { backgroundColor: '#f5f5f5' }]} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>暫無數據</Text>
            <Text style={styles.loadingSubtext}>請檢查網絡連接或稍後重試</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '紅單趨勢',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: { fontWeight: '600' },
          headerTitleAlign: 'center',
        }}
      />
      <StatusBar style="light" />
      
      <SafeAreaView style={[styles.container, { backgroundColor: '#f5f5f5' }]} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        // (已修改) 使用 onScroll 和 scrollEventThrottle
        onScroll={handleScroll}
        scrollEventThrottle={400} // 400ms 触发一次
      >
          {/* 紅單趨勢统计 */}
          <View style={styles.statsContainer}>
            {/* 最近50单紅單分布 */}
            <View style={styles.trendContainer}>
              <View style={styles.trendChartWrapper}>
                <View style={styles.trendBarsContainer}>
                  {trendData.recentDistribution.map((type, index) => 
                    renderTrendBar(type, index)
                  )}
                </View>
                
                {/* 紅單和黑單统计 */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
              <Text style={styles.statNumber}>{trendData.redCount}</Text>
                    <Text style={styles.statLabel}>紅單</Text>
            </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumberBlack}>{trendData.blackCount}</Text>
                    <Text style={styles.statLabel}>黑單</Text>
            </View>
            </View>
          </View>
          </View>
        </View>

        {/* 方案列表 */}
          <View style={styles.schemesContainer}>
            <View style={styles.schemesListContainer}>
              {trendData.schemes.length === 0 ? (
                <View style={styles.waitingContainer}>
                  <Text style={styles.waitingText}>暫無方案</Text>
                  <Text style={styles.waitingSubtext}>請耐心等待，方案即將發布</Text>
                </View>
              ) : (
                <>
                  {trendData.schemes.map(renderSchemeCard)}
                  
                  {/* (已修改) 底部加载提示 */}
                  <View style={styles.loadMoreContainer}>
                    {isPaginating && (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    )}
                    {hasMore && !isPaginating && (
                      <Text style={styles.loadMoreText}>繼續滾動以加載...</Text>
                    )}
                    {!hasMore && (
                       <Text style={styles.loadMoreText}>沒有更多方案了</Text>
                    )}
                  </View>
                </>
              )}
            </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
    gap: 40,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff4444',
  },
  statNumberBlack: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  trendContainer: {
    marginBottom: 0,
  },
  trendChartWrapper: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    elevation: 3,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    }),
    minHeight: 120,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 8,
  },
  trendBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 60,
    justifyContent: 'center',
    marginBottom: 4,
  },
  trendBar: {
    width: 6,
    borderRadius: 3,
    minHeight: 4,
  },
  schemesContainer: {
    paddingTop: 4,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  schemesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  schemesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  schemesCount: {
    fontSize: 14,
    color: '#666',
  },
  schemesListContainer: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 0,
  },
  schemeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
  },
  schemeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  schemeTitleContainer: {
    flex: 1,
  },
  schemeTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
    color: '#333',
  },
  schemeTime: {
    fontSize: 12,
    color: '#666',
  },
  statusChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
  },
  statusChipText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 11,
  },
  matchesContainer: {
    gap: 8,
  },
  matchContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 8,
  },
  matchHeader: {
    marginBottom: 8,
  },
  matchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchNum: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  matchTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    color: '#333',
  },
  matchInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff4444',
  },
  bettingRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bettingButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  bettingButtonCategory: {
    backgroundColor: '#f8f8f8',
  },
  bettingButtonSelected: {
    backgroundColor: '#e8f5e8',
    borderColor: '#4caf50',
  },
  bettingButtonWinning: {
    borderBottomWidth: 2,
    borderBottomColor: '#ff4444',
  },
  bettingText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 1,
  },
  bettingTextCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 1,
  },
  bettingTextSelected: {
    color: '#4caf50',
  },
  bettingTextWinning: {
    color: '#ff4444',
    fontWeight: 'bold',
  },
  bettingOdds: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  bettingOddsCategory: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  bettingOddsSelected: {
    color: '#4caf50',
  },
  bettingOddsWinning: {
    color: '#ff4444',
  },
  loadMoreContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
  },
  waitingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  waitingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  waitingSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
});

export default RedTrendScreen;