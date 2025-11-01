import { Stack, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, Icon, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

type OddsMap = Record<string, number | string> | undefined;

export default function FootballMatchDetail() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    matchId?: string;
    league?: string;
    homeTeam?: string;
    awayTeam?: string;
    matchTime?: string;
    odds_spf?: string; // JSON string e.g. {"home":2.1,"draw":3.2,"away":3.5}
    odds_bf?: string;  // JSON string map of score -> odds
    odds_zjq?: string; // JSON string map of goals -> odds
    odds_bqc?: string; // JSON string map of half-full -> odds
  }>();

  // 测试数据状态
  const [useTestData, setUseTestData] = useState(false);

  // 测试数据
  const testData = {
    matchId: '001',
    league: '英超',
    homeTeam: '曼城',
    awayTeam: '利物浦',
    matchTime: '2024-01-15 20:00:00',
    odds_spf: JSON.stringify({ home: 2.1, draw: 3.2, away: 3.5 }),
    odds_bf: JSON.stringify({ '1-0': 8.5, '2-0': 12.0, '2-1': 9.5, '0-0': 8.0, '1-1': 6.5, '0-1': 9.0 }),
    odds_zjq: JSON.stringify({ '0': 12.0, '1': 4.5, '2': 3.2, '3': 3.5, '4': 4.8, '5': 8.5, '6': 15.0, '7+': 25.0 }),
    odds_bqc: JSON.stringify({ 'HH': 4.2, 'HD': 15.0, 'HA': 35.0, 'DH': 8.5, 'DD': 6.5, 'DA': 18.0, 'AH': 22.0, 'AD': 25.0, 'AA': 12.0 })
  };

  // 使用测试数据或实际参数
  const displayParams = useTestData ? testData : params;

  // 调试信息
  console.log('🏈 足球比赛详情页面接收到的参数:', params);
  console.log('🏈 当前使用的显示参数:', displayParams);

  const spfOdds: OddsMap = useMemo(() => {
    try { 
      const result = displayParams.odds_spf ? JSON.parse(String(displayParams.odds_spf)) : undefined;
      console.log('🏈 勝負平賠率解析結果:', result);
      return result;
    } catch (error) { 
      console.log('❌ 勝負平賠率解析失敗:', error);
      return undefined; 
    }
  }, [displayParams.odds_spf]);
  
  const bfOdds: OddsMap = useMemo(() => {
    try { 
      const result = displayParams.odds_bf ? JSON.parse(String(displayParams.odds_bf)) : undefined;
      console.log('🏈 比分賠率解析結果:', result);
      return result;
    } catch (error) { 
      console.log('❌ 比分賠率解析失敗:', error);
      return undefined; 
    }
  }, [displayParams.odds_bf]);
  
  const zjqOdds: OddsMap = useMemo(() => {
    try { 
      const result = displayParams.odds_zjq ? JSON.parse(String(displayParams.odds_zjq)) : undefined;
      console.log('🏈 總進球賠率解析結果:', result);
      return result;
    } catch (error) { 
      console.log('❌ 總進球賠率解析失敗:', error);
      return undefined; 
    }
  }, [displayParams.odds_zjq]);
  
  const bqcOdds: OddsMap = useMemo(() => {
    try { 
      const result = displayParams.odds_bqc ? JSON.parse(String(displayParams.odds_bqc)) : undefined;
      console.log('🏈 半全場賠率解析結果:', result);
      return result;
    } catch (error) { 
      console.log('❌ 半全場賠率解析失敗:', error);
      return undefined; 
    }
  }, [displayParams.odds_bqc]);

  const renderKeyValueList = (data?: Record<string, number | string>, formatter?: (k: string) => string) => {
    if (!data) return null;
    const entries = Object.entries(data);
    if (entries.length === 0) return null;
    return (
      <View style={styles.kvList}>
        {entries.map(([key, value]) => (
          <View key={key} style={styles.kvItem}>
            <Text style={[styles.kLabel, { color: theme.colors.onSurfaceVariant }]}>
              {formatter ? formatter(key) : key}
            </Text>
            <Text style={[styles.kValue, { color: theme.colors.onSurface }]}> {String(value)} </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '比賽詳情',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: { fontWeight: '600' },
          headerTitleAlign: 'center',
        }}
      />
      <StatusBar style="light" />

      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* 测试按钮 */}
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Card.Content style={styles.cardContent}>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>调试工具</Text>
              <Button
                mode={useTestData ? "contained" : "outlined"}
                onPress={() => setUseTestData(!useTestData)}
                style={styles.testButton}
              >
                {useTestData ? '使用实际数据' : '使用测试数据'}
              </Button>
            </Card.Content>
          </Card>

          {/* 基本信息 */}
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.headerRow}>
                <Text style={[styles.teams, { color: theme.colors.onSurface }]}>
                  {displayParams.homeTeam || '主隊'} VS {displayParams.awayTeam || '客隊'}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Icon source="trophy-variant-outline" size={16} color={theme.colors.onSurfaceVariant} />
                  <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                    {displayParams.league || '聯賽'}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Icon source="clock-outline" size={16} color={theme.colors.onSurfaceVariant} />
                  <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                    {displayParams.matchTime || ''}
                  </Text>
                </View>
                {displayParams.matchId && (
                  <View style={styles.metaItem}>
                    <Icon source="identifier" size={16} color={theme.colors.onSurfaceVariant} />
                    <Text style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>#{displayParams.matchId}</Text>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>

          {/* 勝負平 */}
          {spfOdds && (
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <Card.Content style={styles.cardContent}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>勝負平</Text>
                <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
                <View style={styles.spfRow}>
                  <View style={[styles.spfItem, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Text style={[styles.spfLabel, { color: theme.colors.onSurfaceVariant }]}>勝</Text>
                    <Text style={[styles.spfValue, { color: theme.colors.onSurface }]}>{String((spfOdds as any).home ?? '')}</Text>
                  </View>
                  <View style={[styles.spfItem, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Text style={[styles.spfLabel, { color: theme.colors.onSurfaceVariant }]}>平</Text>
                    <Text style={[styles.spfValue, { color: theme.colors.onSurface }]}>{String((spfOdds as any).draw ?? '')}</Text>
                  </View>
                  <View style={[styles.spfItem, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <Text style={[styles.spfLabel, { color: theme.colors.onSurfaceVariant }]}>負</Text>
                    <Text style={[styles.spfValue, { color: theme.colors.onSurface }]}>{String((spfOdds as any).away ?? '')}</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* 比分、總進球、半全場（若有） */}
          {bfOdds && (
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <Card.Content style={styles.cardContent}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>比分</Text>
                <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
                {renderKeyValueList(bfOdds as Record<string, number | string>)}
              </Card.Content>
            </Card>
          )}

          {zjqOdds && (
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <Card.Content style={styles.cardContent}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>總進球</Text>
                <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
                {renderKeyValueList(zjqOdds as Record<string, number | string>, (k) => (k === '7+' ? '7+' : `${k}球`))}
              </Card.Content>
            </Card>
          )}

          {bqcOdds && (
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <Card.Content style={styles.cardContent}>
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>半全場</Text>
                <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
                {renderKeyValueList(bqcOdds as Record<string, number | string>, (k) => (
                  k === 'HH' ? '勝勝' :
                  k === 'HD' ? '勝平' :
                  k === 'HA' ? '勝負' :
                  k === 'DH' ? '平勝' :
                  k === 'DD' ? '平平' :
                  k === 'DA' ? '平負' :
                  k === 'AH' ? '負勝' :
                  k === 'AD' ? '負平' :
                  k === 'AA' ? '負負' : k
                ))}
              </Card.Content>
            </Card>
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
  },
  headerRow: {
    marginBottom: 8,
  },
  teams: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  divider: {
    marginBottom: 8,
  },
  spfRow: {
    flexDirection: 'row',
    gap: 8,
  },
  spfItem: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  spfLabel: {
    fontSize: 12,
  },
  spfValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  kvList: {
    gap: 8,
  },
  kvItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  kLabel: {
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  kValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  testButton: {
    marginTop: 8,
  },
});


