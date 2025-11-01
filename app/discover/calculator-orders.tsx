import { footballCalculatorApi, type BetOrderListRequest } from '@/services/footballCalculatorApi';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card, Icon, useTheme } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/AuthContext';
import { createShadowStyle } from '@/utils/webCompatibility';
import { ScrollView } from 'react-native';

// 订单状态类型
type OrderStatus = 'pending' | 'won' | 'lost' | 'draft' | 'void';

// 订单详情接口
interface OrderDetail {
  detailId: string;
  orderId: string;
  matchId: number;
  matchName: string;
  poolCode: string;
  selection: string;
  odds: string;
  isWinning: number; // 1=中奖, 2=未中奖
}

// 新API订单接口
interface NewBetOrder {
  orderId: string;
  userId: number;
  userName: string;
  oddsDesc: string;
  betAmount: string;
  combinationType: string;
  status: OrderStatus;
  payoutAmount: string;
  expirationTime: string;
  bizBetOrderDetailsVos: OrderDetail[];
}

// 新API响应接口
interface OrderListResponse {
  total: number;
  rows: NewBetOrder[];
  code: number;
  msg: string;
  extra: any;
}


export default function CalculatorOrdersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [orders, setOrders] = useState<NewBetOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [pageNum, setPageNum] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  // 獲取訂單數據
  const fetchOrders = useCallback(async (page: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPageNum(1);
      } else {
        setRefreshing(true);
      }

      const params: BetOrderListRequest = {
        pageNum: page,
        pageSize: 10,
      };

      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const response = await footballCalculatorApi.getBetOrders(params);
      
      console.log('計算器訂單API響應:', JSON.stringify(response, null, 2));
      console.log('查詢參數:', params);
      
      if (response.success && response.data) {
        // 新API数据结构：直接使用response.data作为OrderListResponse
        const orderResponse: OrderListResponse = response.data;
        const newOrders = orderResponse.rows || [];
        
        console.log('新API計算器訂單數據:', newOrders);
        console.log('總數:', orderResponse.total);
        
        if (reset || page === 1) {
          setOrders(newOrders);
        } else {
          setOrders(prev => [...prev, ...newOrders]);
        }

        setTotal(orderResponse.total);
        setHasMore(newOrders.length === params.pageSize);
        setPageNum(page);
      } else {
        console.error('獲取計算器訂單失敗:', response.message);
      }
    } catch (error) {
      console.error('獲取計算器訂單失敗:', error);
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
  const getOrderStatusText = (status: string): string => {
    switch (status) {
      case 'pending': return '待結算';
      case 'won': return '已中獎';
      case 'lost': return '未中獎';
      case 'draft': return '待出票';
      case 'void': return '出票失敗';
      default: return status || '未知';
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
      case 'CRS': return '比分';
      case 'TTG': return '總進球';
      case 'HAFU': return '半全場';
      default: return betType;
    }
  };

  // 格式化CRS比分選擇顯示
  const formatCrsSelection = (selection: string): string => {
    if (!selection) return selection;
    const upper = selection.toUpperCase();
    if (upper === 'HX') return '勝其它';
    if (upper === 'DX') return '平其它';
    if (upper === 'AX') return '負其它';
    return selection.replace(/:/g, '-');
  };

  // 根據玩法獲取選擇顯示文本
  const getSelectionDisplay = (poolCode: string, selection: string): string => {
    if ((poolCode || '').toUpperCase() === 'CRS') {
      return formatCrsSelection(selection);
    }
    if ((poolCode || '').toUpperCase() === 'TTG') {
      // 總進球顯示，如 0球、1球、7+
      const s = (selection || '').toString();
      const upper = s.toUpperCase();
      if (upper.includes('PLUS') || upper.includes('+')) {
        const m = upper.match(/(\d+)(?:\s*)\+|(?:(\d+))PLUS/);
        const num = m?.[1] || m?.[2];
        return num ? `${num}+` : s;
      }
      if (upper.startsWith('GOALS')) {
        const num = upper.replace('GOALS', '');
        if (num && /^\d+$/.test(num)) return `${parseInt(num, 10)}球`;
      }
      if (/^\d+$/.test(s)) {
        return `${parseInt(s, 10)}球`;
      }
      return s;
    }
    return translateSelection(selection);
  };

  // 獲取訂單狀態顏色
  const getOrderStatusColor = (status: string): string => {
    switch (status) {
      case 'pending': return '#FF9800';  // 待結算 - 橙色
      case 'won': return '#F44336';      // 中獎 - 红色
      case 'lost': return '#000000';     // 未中獎 - 黑色
      case 'draft': return '#2196F3';    // 待出票 - 蓝色
      case 'void': return '#000000';     // 出票失敗 - 黑色
      default: return '#9E9E9E';         // 灰色
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
  console.log('計算器訂單數量:', orders.length);
  console.log('當前篩選狀態:', filterStatus);

  // 渲染訂單卡片
  const renderOrderCard = (order: NewBetOrder) => (
    <Card key={order.orderId} style={[styles.orderCard, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        {/* 訂單頭部 */}
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={[styles.orderNumber, { color: theme.colors.onSurface }]}>
              {order.orderId}
            </Text>
            <Text style={[styles.orderTime, { color: theme.colors.onSurfaceVariant }]}>
              {order.expirationTime}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusChip, { backgroundColor: getOrderStatusColor(order.status) }]}>
              <Text style={styles.statusText}>
                {getOrderStatusText(order.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* 訂單金額信息 */}
        <View style={styles.amountInfo}>
          <View style={styles.amountRow}>
            <Text style={[styles.amountLabel, { color: theme.colors.onSurfaceVariant }]}>
              投注金額
            </Text>
            <Text style={[styles.amountValue, { color: theme.colors.onSurface }]}>
              {order.betAmount} USDT
            </Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={[styles.amountLabel, { color: theme.colors.onSurfaceVariant }]}>
              過關方式
            </Text>
            <Text style={[styles.amountValue, { color: theme.colors.onSurface }]}>
              {order.combinationType}
            </Text>
          </View>
          {order.status !== 'draft' && order.status !== 'void' && (
            <View style={styles.amountRow}>
              <Text style={[styles.amountLabel, { color: theme.colors.onSurfaceVariant }]}>
                最高賠率
              </Text>
              <Text style={[styles.amountValue, { color: theme.colors.onSurface }]}>
                {order.oddsDesc}
              </Text>
            </View>
          )}
          {order.status === 'won' && (
            <View style={styles.amountRow}>
              <Text style={[styles.amountLabel, { color: theme.colors.onSurfaceVariant }]}>
                派彩金額
              </Text>
              <Text style={[styles.amountValue, { color: '#4CAF50' }]}>
                {order.payoutAmount} USDT
              </Text>
            </View>
          )}
        </View>

        {/* 比賽信息 */}
        <View style={styles.matchesInfo}>
          <Text style={[styles.matchesTitle, { color: theme.colors.onSurface }]}>
            投注詳情
          </Text>
          {order.bizBetOrderDetailsVos.map((detail, index) => (
            <View key={index} style={styles.matchInfo}>
              <View style={styles.matchRow}>
                <Text style={[styles.matchTeams, { color: theme.colors.onSurface }]}>
                  {detail.matchName}
                </Text>
                <View style={styles.betInfoContainer}>
                  <Text style={[styles.betTypeName, { color: theme.colors.onSurfaceVariant }]}>
                    {translateBetType(detail.poolCode)}:
                  </Text>
                  <Text style={[styles.selectionText, { color: theme.colors.onSurface }]}>
                    {getSelectionDisplay(detail.poolCode, detail.selection)}@{detail.odds}
                  </Text>
                  {detail.isWinning !== undefined && (
                    <Text style={[styles.selectionText, { 
                      color: detail.isWinning === 1 ? '#F44336' : detail.isWinning === 2 ? '#000000' : theme.colors.onSurfaceVariant 
                    }]}>
                      ({detail.isWinning === 1 ? '红' : detail.isWinning === 2 ? '黑' : '未'})
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: '計算器訂單',
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
            { key: 'draft', label: '待出票' },
            { key: 'pending', label: '待結算' },
            { key: 'won', label: '已中獎' },
            { key: 'lost', label: '未中獎' },
            { key: 'void', label: '出票失敗' }
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