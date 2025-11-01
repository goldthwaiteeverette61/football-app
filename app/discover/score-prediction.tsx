import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    Chip,
    Icon,
    ProgressBar,
    useTheme
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PredictionMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  matchTime: string;
  predictedScore: {
    home: number;
    away: number;
  };
  confidence: number; // 0-1
  analysis?: string;
}

export default function ScorePredictionScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState<PredictionMatch[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 加载预测数据
  const loadPredictions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // TODO: 这里调用实际的API
      // const response = await predictionApi.getPredictions();
      
      // 模拟数据
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: PredictionMatch[] = [
        {
          id: '1',
          homeTeam: '曼城',
          awayTeam: '利物浦',
          league: '英超',
          matchTime: '2025-10-12 20:00:00',
          predictedScore: { home: 2, away: 1 },
          confidence: 0.78,
          analysis: '曼城主場優勢明顯，近期狀態良好'
        },
        {
          id: '2',
          homeTeam: '巴塞羅那',
          awayTeam: '皇家馬德里',
          league: '西甲',
          matchTime: '2025-10-12 21:00:00',
          predictedScore: { home: 1, away: 1 },
          confidence: 0.65,
          analysis: '雙方實力接近，預計平局'
        },
        {
          id: '3',
          homeTeam: '拜仁慕尼黑',
          awayTeam: '多特蒙德',
          league: '德甲',
          matchTime: '2025-10-12 22:30:00',
          predictedScore: { home: 3, away: 0 },
          confidence: 0.82,
          analysis: '拜仁主場戰績優異，進攻火力強勁'
        },
      ];
      
      setMatches(mockData);
    } catch (err) {
      setError('加載預測數據失敗，請稍後重試');
      console.error('加載預測數據錯誤:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, []);

  // 格式化时间
  const formatMatchTime = (timeStr: string): string => {
    try {
      const date = new Date(timeStr);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${month}月${day}日 ${hours}:${minutes}`;
    } catch {
      return timeStr;
    }
  };

  // 获取置信度颜色
  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return theme.colors.primary;
    if (confidence >= 0.6) return theme.colors.tertiary;
    return theme.colors.outline;
  };

  // 获取置信度文本
  const getConfidenceText = (confidence: number): string => {
    if (confidence >= 0.8) return '高';
    if (confidence >= 0.6) return '中';
    return '低';
  };

  return (
    <>
      <StatusBar style="light" />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Stack.Screen
          options={{
            title: '比分預測',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.onPrimary,
            headerTitleAlign: 'center',
          }}
        />

        {/* 错误提示 */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorContainer }]}>
            <Text style={[styles.errorText, { color: theme.colors.onErrorContainer }]}>
              {error}
            </Text>
            <Button
              mode="contained"
              onPress={() => loadPredictions()}
              style={styles.retryButton}
              compact
            >
              重試
            </Button>
          </View>
        )}

        {/* 预测列表 */}
        <ScrollView 
          style={styles.matchesList}
          contentContainerStyle={[styles.matchesContent, { paddingBottom: 60 + insets.bottom + 20 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadPredictions(true)}
              colors={[theme.colors.primary]}
            />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
                加載預測數據...
              </Text>
            </View>
          ) : matches.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon source="chart-line" size={64} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                暫無預測數據
              </Text>
              <Button
                mode="outlined"
                onPress={() => loadPredictions()}
                style={styles.retryButton}
                compact
              >
                刷新數據
              </Button>
            </View>
          ) : (
            matches.map((match) => (
              <Card key={match.id} style={[styles.matchCard, { backgroundColor: theme.colors.surface }]}>
                <Card.Content>
                  {/* 联赛标签 */}
                  <View style={styles.leagueRow}>
                    <Chip 
                      icon="soccer" 
                      style={[styles.leagueChip, { backgroundColor: theme.colors.secondaryContainer }]}
                      textStyle={{ color: theme.colors.onSecondaryContainer, fontSize: 12 }}
                      compact
                    >
                      {match.league}
                    </Chip>
                    <Text style={[styles.matchTime, { color: theme.colors.onSurfaceVariant }]}>
                      {formatMatchTime(match.matchTime)}
                    </Text>
                  </View>

                  {/* 队伍和预测比分 */}
                  <View style={styles.predictionRow}>
                    <View style={styles.teamContainer}>
                      <Text style={[styles.teamName, { color: theme.colors.onSurface }]}>
                        {match.homeTeam}
                      </Text>
                    </View>
                    
                    <View style={styles.scoreContainer}>
                      <View style={[styles.scoreBox, { backgroundColor: theme.colors.primaryContainer }]}>
                        <Text style={[styles.scoreText, { color: theme.colors.onPrimaryContainer }]}>
                          {match.predictedScore.home}
                        </Text>
                      </View>
                      <Text style={[styles.vsText, { color: theme.colors.onSurfaceVariant }]}>
                        :
                      </Text>
                      <View style={[styles.scoreBox, { backgroundColor: theme.colors.primaryContainer }]}>
                        <Text style={[styles.scoreText, { color: theme.colors.onPrimaryContainer }]}>
                          {match.predictedScore.away}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.teamContainer}>
                      <Text style={[styles.teamName, { color: theme.colors.onSurface }]}>
                        {match.awayTeam}
                      </Text>
                    </View>
                  </View>

                  {/* 置信度 */}
                  <View style={styles.confidenceContainer}>
                    <View style={styles.confidenceHeader}>
                      <Text style={[styles.confidenceLabel, { color: theme.colors.onSurfaceVariant }]}>
                        預測置信度
                      </Text>
                      <Chip 
                        style={[styles.confidenceChip, { backgroundColor: getConfidenceColor(match.confidence) }]}
                        textStyle={{ color: theme.colors.onPrimary, fontSize: 12, fontWeight: '600' }}
                        compact
                      >
                        {getConfidenceText(match.confidence)}
                      </Chip>
                    </View>
                    <ProgressBar 
                      progress={match.confidence} 
                      color={getConfidenceColor(match.confidence)}
                      style={styles.confidenceBar}
                    />
                    <Text style={[styles.confidencePercent, { color: theme.colors.onSurfaceVariant }]}>
                      {(match.confidence * 100).toFixed(0)}%
                    </Text>
                  </View>

                  {/* 分析说明 */}
                  {match.analysis && (
                    <View style={[styles.analysisContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
                      <Icon source="information" size={16} color={theme.colors.onSurfaceVariant} />
                      <Text style={[styles.analysisText, { color: theme.colors.onSurfaceVariant }]}>
                        {match.analysis}
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  matchesList: {
    flex: 1,
  },
  matchesContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 300,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  errorContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  retryButton: {
    minWidth: 80,
  },
  matchCard: {
    marginBottom: 12,
    elevation: 2,
  },
  leagueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  leagueChip: {
    height: 28,
  },
  matchTime: {
    fontSize: 14,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  scoreBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  vsText: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  confidenceContainer: {
    marginBottom: 12,
  },
  confidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  confidenceLabel: {
    fontSize: 14,
  },
  confidenceChip: {
    height: 24,
  },
  confidenceBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  confidencePercent: {
    fontSize: 12,
    textAlign: 'right',
  },
  analysisContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  analysisText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});

