import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
    Button,
    Card,
    Modal,
    Portal,
    Text,
    useTheme
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { getTransactionStatusColor, getTransactionStatusLabel, getTransactionTypeColor, getTransactionTypeLabel } from '@/constants/transactionTypes';
import { useAuth } from '@/contexts/AuthContext';
import { getRecentTransactions, TransactionRecord } from '@/services/transactionApi';
import { createShadowStyle, fixWebTitleDisplay, getWebHeaderStyle } from '@/utils/webCompatibility';

export default function WalletScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, forceRefreshUserInfo } = useAuth();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // 處理交易記錄點擊
  const handleTransactionPress = (transaction: TransactionRecord) => {
    console.log('🔄 錢包頁面：點擊交易記錄 - 完整對象:', JSON.stringify(transaction, null, 2));
    console.log('🔄 錢包頁面：點擊交易記錄 - 字段檢查:', {
      id: transaction.id,
      idType: typeof transaction.id,
      hasId: 'id' in transaction,
      allKeys: Object.keys(transaction),
      type: transaction.transactionType,
      amount: transaction.amount,
      status: transaction.status
    });

    const rawId = transaction.id ||
                  (transaction as any).transactionId ||
                  (transaction as any).ID ||
                  (transaction as any).txId ||
                  (transaction as any).transaction_id;

    console.log('🔄 錢包頁面：解析的交易ID:', {
      originalId: transaction.id,
      resolvedId: rawId,
      resolvedIdType: typeof rawId
    });

    if (!rawId) {
      console.error('❌ 錢包頁面：無法找到有效的交易ID');
      return;
    }

    const numericId = Number(rawId);
    const isSafeInteger = Number.isSafeInteger(numericId);
    const maxSafeInteger = Number.MAX_SAFE_INTEGER;

    console.log('🔄 錢包頁面：ID精度檢查:', {
      原始ID: rawId,
      原始ID類型: typeof rawId,
      原始ID長度: String(rawId).length,
      轉換後ID: numericId,
      是否安全整數: isSafeInteger,
      最大安全整數: maxSafeInteger,
      是否超過安全範圍: numericId > maxSafeInteger
    });

    if (!isSafeInteger) {
      console.warn('⚠️ 錢包頁面：交易ID超過JavaScript安全整數範圍，將使用字符串ID');
    }

    const finalTransactionId = isSafeInteger ? numericId : rawId;

    console.log('🔄 錢包頁面：跳轉到詳情頁，URL:', `/wallet/transaction-detail?transactionId=${finalTransactionId}`);
    router.push(`/wallet/transaction-detail?transactionId=${finalTransactionId}`);
  };

  // 獲取最近交易記錄
  const fetchRecentTransactions = async () => {
    try {
      setLoading(true);
      console.log('🔄 錢包頁面：獲取最近交易記錄...');
      const response = await getRecentTransactions(10);
      
      if (response.success && response.data) {
        const transactions = response.data.rows || [];
        console.log('✅ 錢包頁面：交易記錄獲取成功:', transactions);
        console.log('🔍 交易記錄詳情:', transactions.map(t => ({
          id: t.id,
          type: t.transactionType,
          amount: t.amount,
          amountType: typeof t.amount,
          status: t.status
        })));
        setTransactions(transactions);
      } else {
        console.warn('⚠️ 錢包頁面：交易記錄獲取失敗:', response.message);
        setTransactions([]);
      }
    } catch (error) {
      console.error('❌ 錢包頁面：獲取交易記錄失敗:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // 頁面顯示時強制刷新用戶信息和獲取交易記錄
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('🔄 錢包頁面：初始化數據...');
        await forceRefreshUserInfo();
        await fetchRecentTransactions();
        
        // Web平台修復標題顯示
        fixWebTitleDisplay();
        
        console.log('✅ 錢包頁面：數據初始化完成');
      } catch (error) {
        console.error('❌ 錢包頁面：數據初始化失敗:', error);
      }
    };

    initializeData();
  }, [forceRefreshUserInfo]);

  // 界面獲得焦點時重新加載數據
  useFocusEffect(
    useCallback(() => {
      console.log('🎯 錢包頁面：界面獲得焦點，開始重新加載數據');
      const refreshData = async () => {
        try {
          // 重新獲取用戶信息和交易記錄
          await forceRefreshUserInfo();
          await fetchRecentTransactions();
          console.log('✅ 錢包頁面：界面焦點數據刷新完成');
        } catch (error) {
          console.error('❌ 錢包頁面：界面焦點數據刷新失敗:', error);
        }
      };

      refreshData();
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        
        {/* 現代極簡頂部導航 */}
        <View style={[styles.headerContainer, { backgroundColor: theme.colors.primary }, getWebHeaderStyle()]}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={[styles.headerContent, getWebHeaderStyle()]}>
            {/* 標題已移除，保持簡潔設計 */}

            {/* 餘額概覽卡片 */}
            <View style={[styles.balanceOverview, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <View style={styles.balanceRow}>
                <View style={styles.balanceHeader}>
                  <Text variant="bodyMedium" style={[styles.balanceLabel, { color: theme.colors.onPrimary, opacity: 0.9 }]}>
                    總餘額
                  </Text>
                  <View style={styles.usdtBadge}>
                    <Text variant="labelSmall" style={[styles.usdtText, { color: theme.colors.primary }]}>
                      USDT
                    </Text>
                  </View>
                </View>
                <Text variant="headlineLarge" style={[styles.balanceAmount, { color: theme.colors.onPrimary }]}>
                  {user?.balance || '0.00'}
                </Text>
              </View>
              <View style={styles.balanceActions}>
              <Button
                mode="contained"
                buttonColor="rgba(255,255,255,0.2)"
                textColor={theme.colors.onPrimary}
                icon="plus"
                style={styles.balanceButton}
                onPress={() => router.push('/wallet/recharge')}
              >
                充值
              </Button>
              <Button
                mode="outlined"
                textColor={theme.colors.onPrimary}
                icon="minus"
                style={[styles.balanceButton, { borderColor: 'rgba(255,255,255,0.5)' }]}
                onPress={() => setShowWithdrawModal(true)}
              >
                提現
              </Button>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { 
          paddingTop: 20,
          paddingBottom: 60 + insets.bottom + 20 
        }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Recent Transactions */}
        <Card style={styles.transactionsCard} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                最近交易
              </Text>
              <Button
                mode="text"
                textColor={theme.colors.primary}
                onPress={() => router.push('/wallet/transactions')}
                style={styles.moreButton}
                labelStyle={styles.moreButtonText}
                icon="chevron-right"
                contentStyle={styles.moreButtonContent}
              >
                更多
              </Button>
            </View>
            <View style={styles.transactionList}>
              {loading ? (
                <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                  加載中...
                </Text>
              ) : transactions.length > 0 ? (
                transactions.map((transaction, index) => (
                  <TouchableOpacity 
                    key={`${transaction.id}-${index}`}
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
                          {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : '未知日期'}
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
                ))
              ) : (
                <Text variant="bodyMedium" style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
                  暫無交易記錄
                </Text>
              )}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
      {/* 提現方式選擇彈窗 */}
      <Portal>
        <Modal
          visible={showWithdrawModal}
          onDismiss={() => setShowWithdrawModal(false)}
          contentContainerStyle={{ margin: 20, padding: 20, borderRadius: 12, backgroundColor: theme.colors.surface }}
        >
          <Text variant="titleMedium" style={{ marginBottom: 12, color: theme.colors.onSurface }}>
            選擇提現方式
          </Text>
          <Button mode="contained" style={{ marginBottom: 12 }} onPress={() => { setShowWithdrawModal(false); router.push('/wallet/withdraw-onchain'); }}>
            鏈上提現
          </Button>
          <Button mode="outlined" onPress={() => { setShowWithdrawModal(false); router.push('/wallet/transfer-internal'); }}>
            站內轉帳
          </Button>
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
    paddingVertical: 16,
  },
  // 餘額概覽卡片樣式
  balanceOverview: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
  },
  balanceRow: {
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
  },
  usdtBadge: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  usdtText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'normal',
  },
  balanceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  balanceButton: {
    flex: 1,
    borderRadius: 12,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingRight: 4, // 與交易記錄的paddingHorizontal保持一致
  },
  sectionTitle: {
    fontWeight: '600',
  },
  moreButton: {
    minWidth: 0,
    paddingHorizontal: 8,
  },
  moreButtonContent: {
    flexDirection: 'row-reverse',
  },
  moreButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  transactionList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTypeRow: {
    flex: 1,
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
    fontWeight: 'normal',
    marginBottom: 2,
    lineHeight: 20,
  },
  transactionStatus: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 24,
  },
});