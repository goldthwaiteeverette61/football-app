import { ordersApi, type Order, type OrderListParams, type OrderStatus } from '@/services/ordersApi';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card, Icon, useTheme } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { createShadowStyle } from '@/utils/webCompatibility';
import { ScrollView } from 'react-native';


export default function OrdersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [pageNum, setPageNum] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // 獲取訂單數據
  const fetchOrders = useCallback(async (page: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPageNum(1);
      } else {
        setRefreshing(true);
      }

      const params: OrderListParams = {
        pageNum: page,
        pageSize: 10,
      };

      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const response = await ordersApi.getMyOrders(params);
      
      console.log('訂單API響應:', JSON.stringify(response, null, 2));
      console.log('查詢參數:', params);
      
      if (response.success && response.data) {
        // 嘗試不同的數據結構
        let newOrders = [];
        if (response.data.rows && Array.isArray(response.data.rows)) {
          newOrders = response.data.rows;
        } else if (response.data.list && Array.isArray(response.data.list)) {
          newOrders = response.data.list;
        } else if (Array.isArray(response.data)) {
          newOrders = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          newOrders = response.data.data;
        } else if (response.data.records && Array.isArray(response.data.records)) {
          newOrders = response.data.records;
        }
        
        console.log('解析的訂單數據:', newOrders);
        console.log('解析的訂單數據長度:', newOrders.length);
        
        // 數據映射和標準化
        const mappedOrders = newOrders.map((order: any) => {
          // 處理狀態映射 - 直接使用API返回的status作為訂單狀態
          const orderStatus = order.status || 'in_cart';
          const resultStatus = order.resultStatus || 'pending';
          
          // 處理投注詳情映射 - 按比賽分組
          const matchMap = new Map();
          const matchOddsMap = new Map(); // 用於存儲每場比賽的最大賠率
          
          (order.bizUserFollowDetailsVos || []).forEach((detail: any) => {
            const matchId = detail.matchId?.toString() || '';
            const matchName = detail.matchName || '';
            const odds = parseFloat(detail.odds) || 1;
            
            // 處理空比賽名稱的情況
            if (!matchName || matchName.trim() === '') {
              console.warn('發現空比賽名稱:', detail);
              return; // 跳過空的比賽名稱
            }
            
            const matchParts = matchName.split(' vs ');
            const homeTeam = matchParts[0]?.trim() || '未知主隊';
            const awayTeam = matchParts[1]?.trim() || '未知客隊';
            
            if (!matchMap.has(matchId)) {
              matchMap.set(matchId, {
                matchId,
                homeTeam: homeTeam || '',
                awayTeam: awayTeam || '',
                league: '', // API中沒有聯賽信息
                matchTime: '', // API中沒有比賽時間
                selections: []
              });
            }
            
            const match = matchMap.get(matchId);
            match.selections.push({
              betType: detail.poolCode || 'HAD',
              selection: detail.selection || '',
              odds: odds,
              isWinning: undefined, // 需要根據實際結果判斷
            });
            
            // 記錄每場比賽的最大賠率
            if (!matchOddsMap.has(matchId)) {
              matchOddsMap.set(matchId, odds);
            } else {
              const currentMax = matchOddsMap.get(matchId);
              if (odds > currentMax) {
                matchOddsMap.set(matchId, odds);
              }
            }
          });
          
          // 計算總賠率（每場比賽只取最大賠率）
          let totalOdds = 1;
          matchOddsMap.forEach(odds => {
            totalOdds *= odds;
          });
          
          const matches = Array.from(matchMap.values()).filter(match => 
            match.homeTeam && match.awayTeam && match.homeTeam !== '未知主隊' && match.awayTeam !== '未知客隊'
          );

          return {
            id: order.followId || '',
            orderNumber: order.periodName || '',
            createTime: order.createdAt || '',
            status: orderStatus as OrderStatus,
            resultStatus: resultStatus,
            totalAmount: parseFloat(order.betAmount) || 0,
            totalOdds: Math.round(totalOdds * 100) / 100, // 四捨五入到兩位小數
            expectedReturn: Math.round(((parseFloat(order.betAmount) || 0) * totalOdds) * 100) / 100, // 四捨五入到兩位小數
            actualReturn: Math.round((parseFloat(order.payoutAmount) || 0) * 100) / 100, // 四捨五入到兩位小數
            matches: matches,
          };
        });
        
        console.log('映射後的訂單數據:', mappedOrders);
        
        if (reset || page === 1) {
          setOrders(mappedOrders);
        } else {
          setOrders(prev => [...prev, ...mappedOrders]);
        }
        
        setHasMore(newOrders.length === params.pageSize);
        setPageNum(page);
      } else {
        console.error('獲取訂單失敗:', response.message);
      }
    } catch (error) {
      console.error('獲取訂單失敗:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  // 下拉刷新
  const onRefresh = useCallback(async () => {
    await fetchOrders(1, true);
  }, [fetchOrders]);

  // 加載更多
  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchOrders(pageNum + 1, false);
    }
  }, [fetchOrders, loading, hasMore, pageNum]);

  // 篩選訂單
  const filterOrders = useCallback((status: OrderStatus | 'all') => {
    setFilterStatus(status);
    setPageNum(1);
    setHasMore(true);
  }, []);

  // 頁面加載時獲取數據
  useEffect(() => {
    fetchOrders(1, true);
  }, [fetchOrders]);

  // 篩選狀態變化時重新加載
  useEffect(() => {
    if (pageNum > 1) {
      fetchOrders(1, true);
    }
  }, [filterStatus]);

  // 獲取訂單狀態顯示文本
  const getOrderStatusText = (status: OrderStatus): string => {
    switch (status) {
      case 'in_cart': return '待出票';
      case 'bought': return '已出票';
      case 'settled': return '已結算';
      case 'failed': return '已取消';
      default: return '未知';
    }
  };

  // 獲取中獎結果顯示文本
  const getResultStatusText = (resultStatus: string): string => {
    switch (resultStatus) {
      case 'pending': return '待開獎';
      case 'won': return '已中獎';
      case 'lost': return '未中獎';
      default: return '未知';
    }
  };

  // 轉換投注選項為中文
  const translateSelection = (selection: string): string => {
    switch (selection) {
      case 'H': return '勝';
      case 'D': return '平';
      case 'A': return '負';
      default: return selection;
    }
  };

  // 轉換玩法名稱為中文
  const translateBetType = (betType: string): string => {
    switch (betType) {
      case 'HAD': return '勝負平';
      case 'HHAD': return '讓球';
      default: return betType;
    }
  };

  // 獲取訂單狀態顏色
  const getOrderStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case 'in_cart': return '#2196F3';   // 待出票 - 蓝色
      case 'bought': return '#FF9800';   // 已出票 - 橙色
      case 'settled': return '#4CAF50';  // 已结算 - 绿色
      case 'failed': return '#9E9E9E';   // 已取消 - 灰色
      default: return '#9E9E9E';
    }
  };

  // 獲取中獎結果顏色
  const getResultStatusColor = (resultStatus: string): string => {
    switch (resultStatus) {
      case 'pending': return '#FF9800';  // 待开奖 - 橙色
      case 'won': return '#F44336';      // 已中奖 - 红色
      case 'lost': return '#424242';     // 未中奖 - 黑色
      default: return '#9E9E9E';
    }
  };

  // 直接使用後台返回的訂單數據，不進行前端篩選
  console.log('訂單數量:', orders.length);
  console.log('當前篩選狀態:', filterStatus);

  // 渲染訂單卡片
  const renderOrderCard = (order: Order) => (
    <Card key={order.id} style={[styles.orderCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        {/* 訂單頭部 */}
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={[styles.orderNumber, { color: theme.colors.onSurface }]}>
              {order.orderNumber || ''}
            </Text>
            <Text style={[styles.orderTime, { color: theme.colors.onSurfaceVariant }]}>
              {order.createTime || ''}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            {order.status === 'settled' && order.resultStatus ? (
              <View style={[styles.statusChip, { backgroundColor: getResultStatusColor(order.resultStatus) }]}>
                <Text style={styles.statusText}>
                  {getResultStatusText(order.resultStatus)}
                </Text>
              </View>
            ) : (
              <View style={[styles.statusChip, { backgroundColor: getOrderStatusColor(order.status || 'pending' as OrderStatus) }]}>
                <Text style={styles.statusText}>
                  {getOrderStatusText(order.status || 'pending' as OrderStatus)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 訂單金額信息 */}
        <View style={styles.amountInfo}>
          <View style={styles.amountRow}>
            <Text style={[styles.amountLabel, { color: theme.colors.onSurfaceVariant }]}>
              投注金額
            </Text>
            <Text style={[styles.amountValue, { color: theme.colors.onSurface }]}>
              {String(order.totalAmount || 0)} USDT
            </Text>
          </View>
          {order.status !== 'in_cart' && (
            <>
              <View style={styles.amountRow}>
                <Text style={[styles.amountLabel, { color: theme.colors.onSurfaceVariant }]}>
                  總賠率
                </Text>
                <Text style={[styles.amountValue, { color: theme.colors.onSurface }]}>
                  {String(order.totalOdds || 0)}
                </Text>
              </View>
              <View style={styles.amountRow}>
                <Text style={[styles.amountLabel, { color: theme.colors.onSurfaceVariant }]}>
                  預期收益
                </Text>
                <Text style={[styles.amountValue, { color: theme.colors.onSurface }]}>
                  {String(order.expectedReturn || 0)} USDT
                </Text>
              </View>
            </>
          )}
          {order.resultStatus === 'won' && order.actualReturn !== undefined && order.actualReturn !== null && (
            <View style={styles.amountRow}>
              <Text style={[styles.amountLabel, { color: theme.colors.onSurfaceVariant }]}>
                實際收益
              </Text>
              <Text style={[styles.amountValue, { color: '#4CAF50' }]}>
                {String(order.actualReturn || 0)} USDT
              </Text>
            </View>
          )}
        </View>

        {/* 比賽信息 */}
        <View style={styles.matchesInfo}>
          <Text style={[styles.matchesTitle, { color: theme.colors.onSurface }]}>
            投注詳情
          </Text>
          {order.status === 'in_cart' ? (
            <View style={styles.waitingInfo}>
              <Text style={[styles.waitingText, { color: theme.colors.onSurfaceVariant }]}>
                等待出票中，請耐心等待
              </Text>
            </View>
          ) : order.status === 'failed' ? (
            order.remark ? (
              <View style={styles.waitingInfo}>
                <Text style={[styles.waitingText, { color: theme.colors.onSurfaceVariant }]}>
                  {order.remark}
                </Text>
              </View>
            ) : null
          ) : (
            (order.matches || []).map((match, index) => (
              <View key={index} style={styles.matchInfo}>
                <View style={styles.matchRow}>
                  <Text style={[styles.matchTeams, { color: theme.colors.onSurface }]}>
                    {String(match.homeTeam || '未知主隊')} VS {String(match.awayTeam || '未知客隊')}
                  </Text>
                  <View style={styles.betInfoContainer}>
                    <Text style={[styles.betTypeName, { color: theme.colors.onSurfaceVariant }]}>
                      {translateBetType(String(match.selections[0]?.betType || '投注'))}:
                    </Text>
                    {(match.selections || []).map((selection, selIndex) => (
                      <Text key={selIndex} style={[styles.selectionText, { color: theme.colors.onSurface }]}>
                        {translateSelection(String(selection.selection || ''))}@{String(selection.odds || 0)}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: '我的訂單',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: { fontWeight: '600' },
          headerTitleAlign: 'center',
        }}
      />
      <StatusBar style="light" />
      
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
        {/* 篩選器 */}
      <View style={[styles.filterContainer, { backgroundColor: theme.colors.surface }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { key: 'all', label: '全部' },
            { key: 'in_cart', label: '待出票' },
            { key: 'bought', label: '已出票' },
            { key: 'settled', label: '已結算' },
            { key: 'failed', label: '已取消' }
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                { 
                  backgroundColor: filterStatus === filter.key ? theme.colors.primary : theme.colors.surfaceVariant 
                }
              ]}
              onPress={() => setFilterStatus(filter.key as OrderStatus | 'all')}
            >
              <Text style={[
                styles.filterText,
                { 
                  color: filterStatus === filter.key ? theme.colors.onPrimary : theme.colors.onSurfaceVariant 
                }
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 訂單列表 */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onScrollEndDrag={loadMore}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
              加載中...
            </Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon source="clipboard-list" size={64} color={theme.colors.onSurfaceVariant} />
            <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
              暫無訂單
            </Text>
          </View>
        ) : (
          <>
            {(orders || []).map(renderOrderCard)}
            {hasMore && !loading && (
              <View style={styles.loadMoreContainer}>
                <TouchableOpacity onPress={loadMore} style={styles.loadMoreButton}>
                  <Text style={[styles.loadMoreText, { color: theme.colors.primary }]}>
                    加載更多
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {loading && !refreshing && (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.loadingMoreText, { color: theme.colors.onSurfaceVariant }]}>
                  加載中...
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 2,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
  },
  filterScroll: {
    paddingHorizontal: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  orderCard: {
    marginBottom: 16,
    elevation: 2,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    height: 28,
    paddingHorizontal: 12,
    paddingVertical: 0,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
    flexDirection: 'row',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 28,
  },
  amountInfo: {
    marginBottom: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  matchesInfo: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  matchesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  waitingInfo: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  matchInfo: {
    marginBottom: 12,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  matchTeams: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  betInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  betTypeName: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectionText: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  loadMoreContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadMoreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
});
