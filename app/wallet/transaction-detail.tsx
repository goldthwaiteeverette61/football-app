import * as Clipboard from 'expo-clipboard';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  Card,
  Divider,
  Text,
  useTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getTransactionStatusColor, getTransactionStatusLabel, getTransactionTypeLabel } from '@/constants/transactionTypes';
import { useAuth } from '@/contexts/AuthContext';
import { getTransactionDetail, TransactionRecord } from '@/services/transactionApi';

// 辅助函数：缩短地址显示
const shortenAddress = (address: string, startLength: number = 6, endLength: number = 4): string => {
  if (!address || address.length <= startLength + endLength) {
    return address;
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
};

// 辅助函数：复制地址到剪贴板
const copyToClipboard = async (text: string, label: string = '地址') => {
  try {
    await Clipboard.setStringAsync(text);
    Alert.alert('複製成功', `${label}已複製到剪貼板`);
  } catch (error) {
    Alert.alert('複製失敗', '無法複製到剪貼板');
  }
};

// 辅助函数：格式化时间显示
const formatTimeDisplay = (timeString: string | undefined): string => {
  if (!timeString) return '未知時間';
  try {
    const date = new Date(timeString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    return '未知時間';
  }
};

// 辅助函数：为颜色添加透明度
const addOpacityToColor = (color: string, opacity: number): string => {
  // 如果颜色已经是十六进制格式，直接添加透明度
  if (color.startsWith('#')) {
    const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
    return color + alpha;
  }
  
  // 如果是rgba格式，提取RGB值并添加新的透明度
  if (color.startsWith('rgba')) {
    const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
    if (match) {
      const [, r, g, b] = match;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }
  
  // 如果是rgb格式，添加透明度
  if (color.startsWith('rgb')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const [, r, g, b] = match;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }
  
  // 默认返回原颜色
  return color;
};

export default function TransactionDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { transactionId } = useLocalSearchParams<{ transactionId: string }>();
  const { user } = useAuth();
  
  const [transaction, setTransaction] = useState<TransactionRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // 获取交易详情
  const fetchTransactionDetail = async () => {
    console.log('🔄 交易详情页面参数解析:', {
      transactionId,
      transactionIdType: typeof transactionId,
      isString: typeof transactionId === 'string',
      isNumber: typeof transactionId === 'number',
      isEmpty: !transactionId,
      isEmptyString: transactionId === '',
      isUndefined: transactionId === undefined,
      isNull: transactionId === null
    });
    
    if (!transactionId) {
      console.log('❌ 交易ID为空');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // 检查数字精度问题
      const numericId = Number(transactionId);
      const isSafeInteger = Number.isSafeInteger(numericId);
      const maxSafeInteger = Number.MAX_SAFE_INTEGER;
      
      console.log('🔄 获取交易详情，ID精度检查:', {
        原始ID: transactionId,
        原始ID类型: typeof transactionId,
        原始ID长度: String(transactionId).length,
        转换后ID: numericId,
        转换后ID类型: typeof numericId,
        是否安全整数: isSafeInteger,
        最大安全整数: maxSafeInteger,
        是否超过安全范围: numericId > maxSafeInteger
      });
      
      if (isNaN(numericId)) {
        console.error('❌ 交易ID不是有效数字:', transactionId);
        setTransaction(null);
        setLoading(false);
        return;
      }
      
      if (!isSafeInteger) {
        console.warn('⚠️ 交易ID超过JavaScript安全整数范围，可能导致精度丢失');
        console.warn('⚠️ 原始ID:', transactionId, '转换后ID:', numericId);
      }
      
      // 对于大数字，直接使用字符串ID
      const idToUse = isSafeInteger ? numericId : String(transactionId);
      console.log('🔄 使用的ID:', idToUse, '类型:', typeof idToUse);
      
      const response = await getTransactionDetail(idToUse);
      
      console.log('📊 API响应:', {
        success: response.success,
        hasData: !!response.data,
        data: response.data,
        message: response.message,
        code: response.code
      });
      
      if (response.success && response.data) {
        setTransaction(response.data);
        console.log('✅ 交易详情获取成功:', response.data);
      } else {
        console.log('❌ 交易详情获取失败:', response.message);
        setTransaction(null);
      }
    } catch (error) {
      console.error('❌ 获取交易详情异常:', error);
      setTransaction(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionDetail();
  }, [transactionId]);

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '交易詳情',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.onPrimary,
            headerTitleStyle: { fontWeight: '600' },
            headerTitleAlign: 'center',
          }}
        />
        <StatusBar style="light" />
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <Text variant="bodyLarge" style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}> 
              加載中...
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!transaction) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '交易詳情',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: theme.colors.onPrimary,
            headerTitleStyle: { fontWeight: '600' },
            headerTitleAlign: 'center',
          }}
        />
        <StatusBar style="light" />
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
          <View style={styles.errorContainer}>
            <Text variant="bodyLarge" style={[styles.errorText, { color: theme.colors.error }]}>
              交易记录不存在
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知时间';
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('zh-CN'),
      time: date.toLocaleTimeString('zh-CN', { hour12: false }),
      full: date.toLocaleString('zh-CN')
    };
  };

  // 交易详情API返回的是createTime字段，不是createdAt
  const dateInfo = formatDate(transaction.createTime || transaction.createdAt);
  const displayDate = typeof dateInfo === 'string' ? dateInfo : dateInfo.full;
  const amount = Number(transaction.amount) || 0;
  const isPositive = amount >= 0;

  // 根据交易类型渲染不同的详情内容
  const renderTransactionDetails = (transaction: TransactionRecord, theme: any) => {
    const transactionType = transaction.transactionType || '';
    const bonusDetails: any = (transaction as any).bonusDetails;
    
    switch (transactionType) {
      case 'WITHDRAWAL':
        return renderWithdrawalDetails(transaction, theme);
      case 'DEPOSIT':
        return renderDepositDetails(transaction, theme);
      case 'BONUS':
        return renderBonusDetails(transaction, theme, bonusDetails);
      case 'COMMISSION':
        return renderCommissionDetails(transaction, theme, bonusDetails);
      case 'FOLLOW_BET':
        return renderFollowBetDetails(transaction, theme);
      case 'BET':
        return renderBetDetails(transaction, theme);
      case 'INTERNAL_TRANSFER_OUT':
      case 'INTERNAL_TRANSFER_IN':
        return renderInternalTransferDetails(transaction, theme, bonusDetails);
      default:
        return renderDefaultDetails(transaction, theme);
    }
  };

  // 提现详情
  const renderWithdrawalDetails = (transaction: TransactionRecord, theme: any) => (
    <View style={styles.detailList}>
      {transaction.withdrawalDetails && (
        <>
          <View style={styles.detailItem}>
            <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
              提现金额
            </Text>
            <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onSurface }]}>
              {transaction.withdrawalDetails.amount} USDT
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
              网络手续费
            </Text>
            <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onSurface }]}>
              {transaction.withdrawalDetails.networkFee} USDT
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
              实际到账
            </Text>
            <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.primary }]}>
              {transaction.withdrawalDetails.finalAmount} USDT
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
              提现地址
            </Text>
            <TouchableOpacity 
              onPress={() => copyToClipboard(
                transaction.toAddress || transaction.withdrawalDetails.toWalletAddress, 
                '提现地址'
              )}
              style={styles.addressContainer}
            >
              <Text variant="bodyMedium" style={[styles.addressText, { color: theme.colors.primary }]}>
                {shortenAddress(transaction.toAddress || transaction.withdrawalDetails.toWalletAddress)}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.detailItem}>
            <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
              区块链网络
            </Text>
            <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onSurface }]}>
              {transaction.blockchainNetwork || 'TRON'}
            </Text>
          </View>
          
          {transaction.withdrawalDetails.txHash && (
            <View style={styles.detailItem}>
              <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
                交易哈希
              </Text>
              <TouchableOpacity 
                onPress={() => copyToClipboard(transaction.withdrawalDetails.txHash, '交易哈希')}
                style={styles.addressContainer}
              >
                <Text variant="bodyMedium" style={[styles.addressText, { color: theme.colors.primary }]}>
                  {shortenAddress(transaction.withdrawalDetails.txHash, 8, 6)}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );

  // 充值详情
  const renderDepositDetails = (transaction: TransactionRecord, theme: any) => (
    <View style={styles.detailList}>
      <View style={styles.detailItem}>
        <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
          充值金额
        </Text>
        <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.primary }]}>
          {Math.abs(amount).toFixed(2)} USDT
        </Text>
      </View>
      
      <View style={styles.detailItem}>
        <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
          充值地址
        </Text>
        <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onSurface }]} numberOfLines={2}>
          {transaction.toAddress || '系统生成'}
        </Text>
      </View>
      
      <View style={styles.detailItem}>
        <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
          区块链网络
        </Text>
        <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onSurface }]}>
          {transaction.blockchainNetwork || 'TRON'}
        </Text>
      </View>
    </View>
  );

  // 奖金详情
  const renderBonusDetails = (transaction: TransactionRecord, theme: any, details?: any) => (
    <View style={styles.detailList}>
      <View style={styles.detailItem}>
        <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}> 
          奖金金额
        </Text>
        <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.primary }]}> 
          {Math.abs(amount).toFixed(2)} USDT
        </Text>
      </View>
      
      

      {/* 投注金額（來源信息） */}
      {details && (details.betAmount !== undefined && details.betAmount !== null) && (
        <View style={styles.detailItem}>
          <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}> 
            投注金額
          </Text>
          <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onSurface }]}> 
            {Number(details.betAmount).toFixed(2)} USDT
          </Text>
        </View>
      )}

      {/* 投注詳情（多行） */}
      {details && details.betOddsDesc && (
        <View style={styles.detailItem}>
          <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}> 
            投注詳情
          </Text>
          <View style={{ flex: 2, alignItems: 'flex-end' }}>
            {(String(details.betOddsDesc).split('|||') || []).map((line, idx) => (
              <Text key={idx} variant="bodyMedium" style={{ color: theme.colors.onSurface, textAlign: 'right' }}>
                {line.trim()}
              </Text>
            ))}
          </View>
        </View>
      )}
      
      {(details && details.schemeId) && (
        <View style={styles.detailItem}>
          <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}> 
            來源方案ID
          </Text>
          <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onSurface }]}> 
            {details.schemeId}
          </Text>
        </View>
      )}
    </View>
  );

  // 佣金详情
  const renderCommissionDetails = (transaction: TransactionRecord, theme: any, details?: any) => (
    <View style={styles.detailList}>
      <View style={styles.detailItem}>
        <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
          佣金金额
        </Text>
        <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.primary }]}>
          {Math.abs(amount).toFixed(2)} USDT
        </Text>
      </View>
      
      <View style={styles.detailItem}>
        <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}> 
          佣金类型
        </Text>
        <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onSurface }]}> 
          {(details && (details.commissionType || details.type)) || '返佣'}
        </Text>
      </View>
      {details && details.orderId && (
        <View style={styles.detailItem}>
          <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}> 
            來源訂單ID
          </Text>
          <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onSurface }]}> 
            {details.orderId}
          </Text>
        </View>
      )}
    </View>
  );

  // 站內轉帳詳情
  const renderInternalTransferDetails = (transaction: TransactionRecord, theme: any, details?: any) => (
    <View style={styles.detailList}>
      <View style={styles.detailItem}>
        <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}> 
          交易金額
        </Text>
        <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onSurface }]}> 
          {amount.toFixed(2)} USDT
        </Text>
      </View>
      {details && (details.fromUserName || details.toUserName) && (
        <View style={styles.detailItem}>
          <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}> 
            {transaction.transactionType === 'INTERNAL_TRANSFER_OUT' ? '收款帳號' : '付款帳號'}
          </Text>
          <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onSurface }]}> 
            {transaction.transactionType === 'INTERNAL_TRANSFER_OUT' ? (details.toUserName || details.userName) : (details.fromUserName || details.userName)}
          </Text>
        </View>
      )}
      {details && details.remark && (
        <View style={styles.detailItem}>
          <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}> 
            備註資訊
          </Text>
          <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onSurface }]}> 
            {details.remark}
          </Text>
        </View>
      )}
    </View>
  );

  // 跟投详情
  const renderFollowBetDetails = (transaction: TransactionRecord, theme: any) => (
    <View style={styles.detailList}>
      <View style={styles.detailItem}>
        <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
          跟投金额
        </Text>
        <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.error }]}>
          {Math.abs(amount).toFixed(2)} USDT
        </Text>
      </View>
      
      <View style={styles.detailItem}>
        <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
          跟投方案
        </Text>
        <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onSurface }]}>
          {transaction.remarks || '未知方案'}
        </Text>
      </View>
      
      {transaction.sourceId && (
        <View style={styles.detailItem}>
          <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
            方案ID
          </Text>
          <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onSurface }]}>
            {transaction.sourceId}
          </Text>
        </View>
      )}
    </View>
  );

  // 投注详情
  const renderBetDetails = (transaction: TransactionRecord, theme: any) => (
    <View style={styles.detailList}>
      <View style={styles.detailItem}>
        <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
          投注金额
        </Text>
        <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.error }]}>
          {Math.abs(amount).toFixed(2)} USDT
        </Text>
      </View>
      
      <View style={styles.detailItem}>
        <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
          投注类型
        </Text>
        <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onSurface }]}>
          直接投注
        </Text>
      </View>
    </View>
  );

  // 默认详情
  const renderDefaultDetails = (transaction: TransactionRecord, theme: any) => (
    <View style={styles.detailList}>
      <View style={styles.detailItem}>
        <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
          交易金额
        </Text>
        <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onSurface }]}>
          {amount.toFixed(2)} USDT
        </Text>
      </View>
      
      
      {transaction.remarks && (
        <View style={styles.detailItem}>
          <Text variant="bodyMedium" style={[styles.detailLabel, { color: theme.colors.onSurfaceVariant }]}>
            备注信息
          </Text>
          <Text variant="bodyMedium" style={[styles.detailValue, { color: theme.colors.onSurface }]}>
            {transaction.remarks}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: '交易详情',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: { fontWeight: '600' },
          headerTitleAlign: 'center',
        }}
      />
      <StatusBar style="light" />
      
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* 交易信息卡片 */}
          <Card style={[styles.infoCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Card.Content style={styles.infoCardContent}>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                交易資訊
              </Text>
              
              <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
              
              <View style={styles.infoList}>
                <View style={styles.infoItem}>
                  <Text variant="bodyMedium" style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                    交易ID
                  </Text>
                  <Text variant="bodyMedium" style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                    {transaction.id}
                  </Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text variant="bodyMedium" style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                    交易時間
                  </Text>
                  <Text variant="bodyMedium" style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                    {displayDate}
                  </Text>
                </View>
                
                {transaction.otherPartyUsername && (
                  <View style={styles.infoItem}>
                    <Text variant="bodyMedium" style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                      對方用戶
                    </Text>
                    <Text variant="bodyMedium" style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                      {transaction.otherPartyUsername}
                    </Text>
                  </View>
                )}
                
                {transaction.remarks && (
                  <View style={styles.infoItem}>
                    <Text variant="bodyMedium" style={[styles.infoLabel, { color: theme.colors.onSurfaceVariant }]}>
                      備註資訊
                    </Text>
                    <Text variant="bodyMedium" style={[styles.infoValue, { color: theme.colors.onSurface }]}>
                      {transaction.remarks}
                    </Text>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>

          {/* 具体交易详情卡片 */}
          <Card style={[styles.detailCard, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Card.Content style={styles.detailCardContent}>
              <View style={styles.detailHeader}>
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                  {getTransactionTypeLabel(transaction.transactionType || '')}
                </Text>
                <View style={[
                  styles.statusBadge,
                  { 
                    backgroundColor: addOpacityToColor(getTransactionStatusColor(transaction.status || '', theme), 0.15),
                    borderColor: getTransactionStatusColor(transaction.status || '', theme),
                  }
                ]}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: getTransactionStatusColor(transaction.status || '', theme) }
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: getTransactionStatusColor(transaction.status || '', theme) }
                  ]}>
                    {getTransactionStatusLabel(transaction.status || '')}
                  </Text>
                </View>
              </View>
              
              <Divider style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
              
              {renderTransactionDetails(transaction, theme)}
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
  },
  statusCard: {
    marginBottom: 16,
  },
  statusCardContent: {
    padding: 24,
    alignItems: 'center',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  statusTitle: {
    fontWeight: '600',
    flex: 1,
  },
  statusChip: {
    marginLeft: 12,
  },
  statusChipText: {
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'center',
  },
  amountText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: 16,
  },
  infoCardContent: {
    padding: 20,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  divider: {
    marginBottom: 16,
  },
  infoList: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailCard: {
    marginBottom: 16,
  },
  detailCardContent: {
    padding: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    height: 28,
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    height: 28,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  detailList: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    flex: 1,
    marginRight: 12,
  },
  detailValue: {
    flex: 2,
    textAlign: 'right',
    fontWeight: '500',
  },
  addressContainer: {
    flex: 2,
    alignItems: 'flex-end',
  },
  addressText: {
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  infoLabel: {
    flex: 1,
  },
  infoValue: {
    fontWeight: '500',
    textAlign: 'right',
  },
  timelineCard: {
    marginBottom: 16,
  },
  timelineCardContent: {
    padding: 20,
  },
  timelineList: {
    gap: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontWeight: '500',
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 12,
  },
});
