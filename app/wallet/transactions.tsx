import { useFocusEffect } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
    Card,
    Divider,
    Text,
    useTheme
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import PaperDropdown from '@/components/PaperDropdown';
import { getTransactionStatusColor, getTransactionStatusLabel, getTransactionTypeColor, getTransactionTypeLabel } from '@/constants/transactionTypes';
import { useAuth } from '@/contexts/AuthContext';
import { getTransactionHistory, TransactionHistoryParams, TransactionRecord } from '@/services/transactionApi';
import { createShadowStyle } from '@/utils/webCompatibility';
import { ScrollView } from 'react-native';

export default function TransactionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  // 分页参数
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  // 交易类型筛选选项
  const typeFilters = [
    { key: 'all', label: '全部類型' },
    { key: 'RECHARGE', label: '充值' },
    { key: 'WITHDRAWAL', label: '提現' },
    { key: 'INTERNAL_TRANSFER_IN', label: '站內轉入' },
    { key: 'INTERNAL_TRANSFER_OUT', label: '站內轉出' },
    { key: 'FEE', label: '手續費' },
    { key: 'ADJUSTMENT', label: '系統調帳' },
    { key: 'BONUS', label: '中獎' },
    { key: 'FOLLOW_BET', label: '跟投' },
    { key: 'REFUND', label: '退款' },
    { key: 'REWARD_COMPENSATION', label: '理賠金' },
    { key: 'COMMISSION', label: '獎勵' },
  ];

  // 交易状态筛选选项
  const statusFilters = [
    { key: 'all', label: '全部狀態' },
    { key: 'PENDING', label: '處理中' },
    { key: 'CONFIRMED', label: '成功' },
    { key: 'FAILED', label: '失敗' },
    { key: 'CANCELLED', label: '已取消' },
  ];

  // 处理类型选择
  const handleTypeSelect = (typeKey: string) => {
    console.log('🔄 选择交易类型:', typeKey);
    setSelectedType(typeKey);
  };

  // 处理状态选择
  const handleStatusSelect = (statusKey: string) => {
    console.log('🔄 选择交易状态:', statusKey);
    setSelectedStatus(statusKey);
  };

  // 处理交易项点击
  const handleTransactionPress = (transaction: TransactionRecord) => {
    console.log('🔄 点击交易记录 - 完整对象:', JSON.stringify(transaction, null, 2));
    console.log('🔄 点击交易记录 - 字段检查:', {
      id: transaction.id,
      idType: typeof transaction.id,
      hasId: 'id' in transaction,
      allKeys: Object.keys(transaction),
      type: transaction.transactionType,
      amount: transaction.amount,
      status: transaction.status
    });
    
    // 尝试不同的ID字段名
    const rawId = transaction.id || 
                  (transaction as any).transactionId || 
                  (transaction as any).ID || 
                  (transaction as any).txId ||
                  (transaction as any).transaction_id;
    
    console.log('🔄 解析的交易ID:', {
      originalId: transaction.id,
      resolvedId: rawId,
      resolvedIdType: typeof rawId
    });
    
    if (!rawId) {
      console.error('❌ 无法找到有效的交易ID');
      return;
    }
    
    // 检查数字精度问题
    const numericId = Number(rawId);
    const isSafeInteger = Number.isSafeInteger(numericId);
    const maxSafeInteger = Number.MAX_SAFE_INTEGER;
    
    console.log('🔄 ID精度检查:', {
      原始ID: rawId,
      原始ID类型: typeof rawId,
      原始ID长度: String(rawId).length,
      转换后ID: numericId,
      是否安全整数: isSafeInteger,
      最大安全整数: maxSafeInteger,
      是否超过安全范围: numericId > maxSafeInteger
    });
    
    if (!isSafeInteger) {
      console.warn('⚠️ 交易ID超过JavaScript安全整数范围，将使用字符串ID');
    }
    
    // 对于大数字，直接使用字符串ID
    const finalTransactionId = isSafeInteger ? numericId : rawId;
    
    console.log('🔄 跳转到详情页，URL:', `/wallet/transaction-detail?transactionId=${finalTransactionId}`);
    router.push(`/wallet/transaction-detail?transactionId=${finalTransactionId}`);
  };


  // 获取交易记录
  const fetchTransactions = async (refresh = false, loadMore = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setCurrentPage(1);
      } else if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      const pageNum = refresh ? 1 : (loadMore ? currentPage + 1 : currentPage);
      
      const params: TransactionHistoryParams = {
        pageSize,
        pageNum,
        transactionType: selectedType !== 'all' ? selectedType : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
      };
      
      console.log('🔄 获取交易记录，参数:', params);
      const response = await getTransactionHistory(params);
      
      if (response.success && response.data) {
        const newTransactions = response.data.rows || [];
        const totalCount = response.data.total || 0;
        
        console.log('📊 交易记录数据:', {
          totalCount,
          newTransactionsCount: newTransactions.length,
          firstTransaction: newTransactions[0] ? {
            id: newTransactions[0].id,
            type: newTransactions[0].transactionType,
            amount: newTransactions[0].amount,
            status: newTransactions[0].status
          } : null
        });
        
        if (refresh || !loadMore) {
          setTransactions(newTransactions);
          setHasMore(newTransactions.length === pageSize && newTransactions.length < totalCount);
        } else {
          setTransactions(prev => {
            const updatedTransactions = [...prev, ...newTransactions];
            setHasMore(newTransactions.length === pageSize && updatedTransactions.length < totalCount);
            return updatedTransactions;
          });
        }
        
        setTotal(totalCount);
        setCurrentPage(pageNum);
      } else {
        console.log('❌ 交易记录获取失败:', response.message);
        if (refresh || !loadMore) {
          setTransactions([]);
        }
      }
    } catch (error) {
      if (refresh || !loadMore) {
        setTransactions([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // 筛选条件改变时重新获取数据
  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    fetchTransactions(true);
  }, [selectedType, selectedStatus]);

  // 页面加载时获取数据
  useEffect(() => {
    fetchTransactions();
  }, []);

  // 下拉刷新
  const onRefresh = useCallback(() => {
    fetchTransactions(true);
  }, []);

  // 加载更多
  const loadMore = useCallback(() => {
    if (hasMore && !loadingMore && !loading) {
      fetchTransactions(false, true);
    }
  }, [hasMore, loadingMore, loading]);

  // 滚动处理
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const isCloseToBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 100;
    
    if (isCloseToBottom && hasMore && !loadingMore && !loading) {
      loadMore();
    }
  }, [hasMore, loadingMore, loading, loadMore]);

  // 界面获得焦点时刷新数据
  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [])
  );

  // 移除本地筛选，改为服务端筛选

  return (
    <>
      <Stack.Screen
        options={{
          title: '交易記錄',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: { fontWeight: '600' },
          headerTitleAlign: 'center',
        }}
      />
      <StatusBar style="light" />
      
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
        {/* 固定在顶部的筛选器 */}
        <View style={[styles.filterContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.filterRow}>
            {/* 交易类型下拉框 */}
            <PaperDropdown
              options={typeFilters}
              selectedValue={selectedType}
              onSelect={handleTypeSelect}
              placeholder="選擇交易類型"
              style={styles.dropdownContainer}
              label="交易類型"
            />

            {/* 交易状态下拉框 */}
            <PaperDropdown
              options={statusFilters}
              selectedValue={selectedStatus}
              onSelect={handleStatusSelect}
              placeholder="選擇交易狀態"
              style={styles.dropdownContainer}
              label="交易狀態"
            />
          </View>
        </View>


        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { 
            paddingBottom: 20 
          }]}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={refreshing}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >

        {/* 交易记录列表 */}
        <Card style={styles.transactionsCard} elevation={1}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                交易記錄
              </Text>
              <Text variant="bodySmall" style={[styles.countText, { color: theme.colors.onSurfaceVariant }]}>
                {total} 條記錄
              </Text>
            </View>

            <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

            <View style={styles.transactionList}>
              {loading ? (
                <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                  加載中...
                </Text>
              ) : transactions.length > 0 ? (
                transactions.map((transaction, index) => (
                  <View key={`${transaction.id}-${index}`}>
                    <TouchableOpacity 
                      style={styles.transactionItem}
                      onPress={() => handleTransactionPress(transaction)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.transactionInfo}>
                        <View style={styles.transactionTypeRow}>
                          <Text variant="bodyMedium" style={[styles.transactionType, { color: getTransactionTypeColor(transaction.transactionType || '', theme) }]}>
                            {getTransactionTypeLabel(transaction.transactionType || '')}
                          </Text>
                          <Text variant="bodySmall" style={[styles.transactionDate, { color: theme.colors.onSurfaceVariant }]}>
                            {transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : '未知时间'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.transactionAmount}>
                        <Text 
                          variant="bodyLarge" 
                          style={[
                            styles.amountText, 
                            { 
                              color: (Number(transaction.amount) || 0) >= 0 ? theme.colors.primary : theme.colors.error 
                            }
                          ]}
                        >
                          {(Number(transaction.amount) || 0) >= 0 ? '+' : ''}{(Number(transaction.amount) || 0).toFixed(2)} USDT
                        </Text>
                        <Text variant="bodySmall" style={[styles.transactionStatus, { color: getTransactionStatusColor(transaction.status || '', theme) }]}>
                          {getTransactionStatusLabel(transaction.status || '')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {index < transactions.length - 1 && (
                      <Divider style={[styles.itemDivider, { backgroundColor: theme.colors.outline }]} />
                    )}
                  </View>
                ))
              ) : (
                <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                  {selectedType !== 'all' || selectedStatus !== 'all' 
                    ? '沒有找到符合條件的交易記錄' 
                    : '暫無交易記錄'
                  }
                </Text>
              )}
            </View>
            
            {/* 加载更多指示器 */}
            {loadingMore && (
              <View style={styles.loadingMoreContainer}>
                <Text variant="bodySmall" style={[styles.loadingMoreText, { color: theme.colors.onSurfaceVariant }]}>
                  加載更多...
                </Text>
              </View>
            )}
            
            {/* 没有更多数据提示 */}
            {!hasMore && transactions.length > 0 && (
              <View style={styles.noMoreContainer}>
                <Text variant="bodySmall" style={[styles.noMoreText, { color: theme.colors.onSurfaceVariant }]}>
                  沒有更多數據了
                </Text>
              </View>
            )}
            
          </Card.Content>
        </Card>
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
  // 固定在顶部的筛选器
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    elevation: 2,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    }),
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    flex: 1,
    minWidth: 120,
    maxWidth: 160,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  transactionsCard: {
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  countText: {
    fontSize: 12,
  },
  divider: {
    marginBottom: 8,
  },
  transactionList: {
    gap: 0,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTypeRow: {
    flex: 1,
    marginBottom: 4,
  },
  transactionType: {
    fontWeight: '500',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 20,
  },
  transactionStatus: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 32,
  },
  itemDivider: {
    marginLeft: 4,
    marginRight: 4,
  },
  loadingMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingMoreText: {
    fontSize: 12,
  },
  noMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  noMoreText: {
    fontSize: 12,
  },
});
