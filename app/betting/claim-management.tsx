import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
    Button,
    Card,
    Chip,
    Divider,
    Icon,
    Modal,
    Portal,
    Switch,
    Text,
    TextInput,
    useTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SceneMap, TabBar, TabView } from 'react-native-tab-view';

import { useAuth } from '@/contexts/AuthContext';
import { claimApi, type ClaimResponse } from '@/services/claimApi';
import { getSchemeSummary, type SchemeSummaryData } from '@/services/schemeApi';
import { userApi } from '@/services/userApi';

export default function ClaimManagementScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  
  // 標籤頁狀態
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'request', title: '理賠狀態' },
    { key: 'list', title: '理賠記錄' },
  ]);

  // 理賠列表相關狀態
  const [claims, setClaims] = useState<ClaimResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);


  // 連黑理賠服務狀態
  const [isCompensationEnabled, setIsCompensationEnabled] = useState<boolean>(false);
  const [compensationStatus, setCompensationStatus] = useState<{
    isEnabled: boolean;
    lostCount: number;
    totalAmount: number;
    lastUpdateTime: string;
  } | null>(null);

  // 支付密碼相關狀態
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordModalType, setPasswordModalType] = useState<'reset' | 'claim'>('reset');

  // 提示模態框狀態
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertButtons, setAlertButtons] = useState<Array<{text: string, onPress?: () => void}>>([]);

  // 顯示提示信息（兼容Web模式）
  const showAlert = (title: string, message: string, buttons?: Array<{text: string, onPress?: () => void}>) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertButtons(buttons || [{text: '確定'}]);
    setShowAlertModal(true);
  };

  // 加載連黑理賠服務狀態
  const loadCompensationStatus = useCallback(async () => {
    try {
      console.log('🔄 開始加載連黑理賠服務狀態...');
      
      const response = await getSchemeSummary();
      console.log('📡 方案摘要API響應:', response);
      
      if (response.success && response.data) {
        const summaryData: SchemeSummaryData = response.data;
        
        // 根據betType判斷是否參與：normal=未參與，double=已參與
        // 如果betType不存在，則使用compensationStatus作為備用
        const isEnabled = summaryData.betType ? summaryData.betType === 'double' : summaryData.compensationStatus;
        
        const status = {
          isEnabled: isEnabled,
          lostCount: summaryData.cumulativeLostBetCountSinceWin,
          totalAmount: parseFloat(summaryData.cumulativeLostAmountSinceWin),
          lastUpdateTime: new Date().toISOString(),
        };
        
        console.log('✅ 連黑理賠服務狀態獲取成功:', status);
        setCompensationStatus(status);
        setIsCompensationEnabled(isEnabled);
      } else {
        console.error('❌ 獲取方案摘要數據失敗:', response.message);
        // 使用默認值
        const defaultStatus = {
          isEnabled: false,
          lostCount: 0,
          totalAmount: 0,
          lastUpdateTime: new Date().toISOString(),
        };
        setCompensationStatus(defaultStatus);
        setIsCompensationEnabled(false);
      }
    } catch (error) {
      console.error('❌ 加載連黑理賠服務狀態失敗:', error);
      setCompensationStatus(null);
      setIsCompensationEnabled(false);
    }
  }, []);

  // 處理參與狀態切換
  const handleCompensationToggle = async (newValue: boolean) => {
    // 顯示確認對話框
    showAlert(
      '確認切換參與狀態',
      '切換參與狀態需要重置倍投記錄，將清空連黑次數和連黑成本。確定要繼續嗎？',
      [
        {
          text: '取消',
          onPress: () => {
            // 取消時恢復開關狀態
            setIsCompensationEnabled(!newValue);
            setShowAlertModal(false);
          }
        },
        {
          text: '確定',
          onPress: async () => {
            setShowAlertModal(false);
            try {
              console.log('🔄 切換參與狀態:', newValue);
              
              // 確定要設置的betType值
              const betType = newValue ? 'double' : 'normal';
              
              console.log('📤 發送切換請求:', { betType });
              
              const response = await userApi.updateBetType(betType);
              
              console.log('📥 切換狀態API響應:', response);
              
              if (response.success) {
                // 更新本地狀態
                setIsCompensationEnabled(newValue);
                
                // 重新加載狀態數據
                await loadCompensationStatus();
                
                showAlert('成功', `已${newValue ? '開啟' : '關閉'}連黑理賠服務`);
              } else {
                let errorMessage = '切換狀態失敗，請重試';
                if (response.message) {
                  errorMessage = response.message;
                }
                showAlert('切換失敗', errorMessage);
                // 失敗時恢復開關狀態
                setIsCompensationEnabled(!newValue);
              }
            } catch (error: any) {
              console.error('❌ 切換參與狀態失敗:', error);
              let errorMessage = '切換狀態失敗，請重試';
              if (error?.message) {
                errorMessage = error.message;
              } else if (typeof error === 'string') {
                errorMessage = error;
              }
              showAlert('切換失敗', errorMessage);
              // 失敗時恢復開關狀態
              setIsCompensationEnabled(!newValue);
            }
          }
        }
      ]
    );
  };

  // 加载理赔申请列表
  const loadClaims = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('🔄 开始加载理赔申请列表...');
      
      const response = await claimApi.getClaims({
        pageNum: pageNum,
        pageSize: 20,
      });

      console.log('📡 理赔申请API响应:', response);

      if (response.success && response.data && response.data.code === 200) {
        console.log('✅ 理赔申请数据获取成功:', response.data);
        if (pageNum === 1) {
          setClaims(response.data?.rows || []);
        } else {
          setClaims(prev => [...prev, ...(response.data?.rows || [])]);
        }
        setHasMore((response.data.rows || []).length === 20);
        setPage(pageNum);
      } else {
        console.warn('⚠️ 理赔申请数据获取失败:', response.data?.msg || response.message);
        // 不显示Alert，而是设置空数据
        if (pageNum === 1) {
          setClaims([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error('❌ 加载理赔申请失败:', error);
      // 不显示Alert，而是设置空数据
      if (pageNum === 1) {
        setClaims([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadClaims(1, true);
      loadCompensationStatus();
    }
  }, [isAuthenticated, loadClaims, loadCompensationStatus]);

  // 下拉刷新
  const handleRefresh = useCallback(() => {
    loadClaims(1, true);
  }, [loadClaims]);

  // 加载更多
  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadClaims(page + 1, false);
    }
  }, [loading, hasMore, page, loadClaims]);



  // 处理重置倍投
  const handleResetBetting = () => {
    // 检查连黑次数，如果为0则提示用户
    if ((compensationStatus?.lostCount || 0) === 0) {
      showAlert('提示', '您當前沒有連黑記錄，無需重置倍投。');
      return;
    }
    
    // 直接显示支付密码输入框
    setPasswordModalType('reset');
    setShowPasswordModal(true);
    setPassword('');
    setPasswordError('');
  };

  // 验证支付密码并执行重置
  const handlePasswordConfirm = async () => {
    if (!password.trim()) {
      setPasswordError('請輸入支付密碼');
      return;
    }

    try {
      // 这里应该调用验证支付密码的API
      // const passwordValid = await userApi.verifyPaymentPassword(password);
      
      // 暂时模拟密码验证（实际应该调用API）
      if (password.length < 1) {
        setPasswordError('請輸入支付密碼');
        return;
      }

      // 保存密码用于API调用
      const currentPassword = password;
      
      // 关闭密码输入框
      setShowPasswordModal(false);
      setPassword('');
      setPasswordError('');

      if (passwordModalType === 'reset') {
        // 执行重置倍投
        try {
          const response = await claimApi.resetLosses(currentPassword);
          console.log('🔄 重置倍投接口响应:', JSON.stringify(response, null, 2));
          
          // 检查API调用是否成功
          if (response.success) {
            console.log('✅ 重置倍投成功');
            showAlert('成功', response.message || '重置倍投成功', [
              {
                text: '確定',
                onPress: () => {
                  // 重新加载理赔状态和记录
                  loadCompensationStatus();
                  loadClaims(1, true);
                }
              }
            ]);
          } else {
            console.log('❌ 重置倍投失败:', response.message);
            showAlert('重置失敗', response.message || '重置倍投失敗，請重試');
          }
        } catch (error) {
          console.error('❌ 重置倍投网络异常:', error);
          showAlert('重置失敗', '網絡連接異常，請檢查網絡後重試');
        }
      } else if (passwordModalType === 'claim') {
        // 执行申请理赔
        try {
          const response = await claimApi.applyClaim(currentPassword);
          console.log('🔄 申请理赔接口响应:', JSON.stringify(response, null, 2));
          
          // 检查API调用是否成功
          if (response.success) {
            console.log('✅ 申请理赔成功');
            showAlert('申請成功', response.message || '理賠申請已提交，請等待處理', [
              {
                text: '確定',
                onPress: () => {
                  // 重新加载状态和记录
                  loadCompensationStatus();
                  loadClaims(1, true);
                }
              }
            ]);
          } else {
            console.log('❌ 申请理赔失败:', response.message);
            showAlert('申請失敗', response.message || '申請理賠失敗，請重試');
          }
        } catch (error) {
          console.error('❌ 申请理赔网络异常:', error);
          showAlert('申請失敗', '網絡連接異常，請檢查網絡後重試');
        }
      }
    } catch (error) {
      console.error('❌ 支付密码验证失败:', error);
      setPasswordError('支付密碼驗證失敗，請重試');
    }
  };

  // 取消支付密码输入
  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPassword('');
    setPasswordError('');
  };

  // 申请理赔
  const handleApplyClaim = () => {
    if (!isCompensationEnabled) {
      showAlert('提示', '請先參與連黑理賠服務');
      return;
    }
    
    if ((compensationStatus?.lostCount || 0) < 8) {
      showAlert('提示', '連黑次數不足，需要連黑8次及以上才能申請理賠');
      return;
    }

    // 连黑次数大于等于8时，需要输入支付密码
    setPasswordModalType('claim');
    setShowPasswordModal(true);
    setPassword('');
    setPasswordError('');
  };


  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FF9800';
      case 'APPROVED':
        return '#4CAF50';
      case 'REJECTED':
        return '#F44336';
      case 'RESET':
        return '#9E9E9E';
      default:
        return '#9E9E9E';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '待處理';
      case 'APPROVED':
        return '已通過';
      case 'REJECTED':
        return '已拒絕';
      case 'RESET':
        return '已重置';
      default:
        return '未知';
    }
  };

  // 获取类型文本（根据remarks判断）
  const getTypeText = (remarks: string) => {
    if (remarks.includes('理賠金')) {
      return '理賠申請';
    } else if (remarks.includes('重置')) {
      return '記錄重置';
    } else {
      return '其他';
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  // 渲染理赔申请项
  const renderClaimItem = ({ item }: { item: ClaimResponse }) => (
    <Card style={styles.claimCard}>
      <Card.Content>
        <View style={styles.claimHeader}>
          <View style={styles.claimInfo}>
            <Text variant="titleMedium" style={styles.claimId}>
              {item.bizCode || '无'}
            </Text>
            <Text variant="bodySmall" style={styles.orderId}>
              {item.id}
            </Text>
          </View>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.statusText}
          >
            {getStatusText(item.status)}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.claimDetails}>
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.detailLabel}>
              申請類型:
            </Text>
            <Text variant="bodyMedium">{getTypeText(item.remarks)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.detailLabel}>
              連黑次數:
            </Text>
            <Text variant="bodyMedium" style={styles.reasonText}>
              {item.lostCount} 场
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.detailLabel}>
              連黑成本:
            </Text>
            <Text variant="bodyMedium" style={styles.amountText}>
              {item.amount} {item.currency}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.detailLabel}>
              申請時間:
            </Text>
            <Text variant="bodyMedium">{formatDate(item.createTime)}</Text>
          </View>
        </View>

      </Card.Content>
    </Card>
  );

  // 空状态
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon source="file-document-outline" size={64} />
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        暫無理賠申請
      </Text>
      <Text variant="bodyMedium" style={styles.emptyDescription}>
        您還沒有提交過理賠申請
      </Text>
      <Button
        mode="contained"
        onPress={() => setIndex(0)}
        style={styles.emptyButton}
      >
        查看狀態
      </Button>
    </View>
  );


  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
        <StatusBar style="auto" />
        <View style={styles.authRequired}>
          <Icon source="alert-circle" size={48} />
          <Text variant="headlineSmall" style={styles.authText}>
            請先登錄
          </Text>
          <Button mode="contained" onPress={() => router.push('/auth/login')}>
            去登錄
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <StatusBar style="auto" />
      
      <Stack.Screen
        options={{
          title: '理賠管理',
          headerTitleAlign: 'center',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
        }}
      />

      <TabView
        navigationState={{ index, routes }}
        renderScene={SceneMap({
          request: () => (
            <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
              <View style={styles.formContent}>
                {/* 理赔服务介绍 */}
                <Card style={styles.introCard}>
                  <Card.Content>
                    <View style={styles.introHeader}>
                      <View style={styles.introIconContainer}>
                        <Icon source="shield-check" size={48} color="#4CAF50" />
                      </View>
                      <Text variant="titleLarge" style={styles.introTitle}>
                        連黑理賠服務
                      </Text>
                      <Text variant="bodyMedium" style={styles.introDescription}>
                        當您跟投連續失敗8次時，可申請理賠。參與理賠服務後，系統會從您的盈利中抽取50%注入理賠獎池，當理賠獎池充足時，系統將自動賠付您的連黑成本，有效降低投注風險，讓您更安心地享受投注樂趣。
                      </Text>
                    </View>
                    <View style={styles.introFeatures}>
                      <View style={styles.featureItem}>
                        <Icon source="check-circle" size={16} color="#4CAF50" />
                        <Text variant="bodySmall" style={styles.featureText}>
                          連黑8次即可申請
                        </Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Icon source="check-circle" size={16} color="#4CAF50" />
                        <Text variant="bodySmall" style={styles.featureText}>
                          50%利潤注入獎池
                        </Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>

                {/* 连黑理赔服务状态 */}
                <Card style={styles.card}>
                  <Card.Content>
                    <View style={styles.cardHeader}>
                      <Text variant="titleMedium" style={styles.sectionTitle}>
                        服務狀態
                      </Text>
                      <View style={styles.headerSwitchContainer}>
                        <Text variant="bodySmall" style={styles.headerSwitchLabel}>
                          {isCompensationEnabled ? '已參與' : '未參與'}
                        </Text>
                        <Switch
                          value={isCompensationEnabled}
                          onValueChange={handleCompensationToggle}
                          color="#4CAF50"
                        />
                      </View>
                    </View>
                    {compensationStatus ? (
                      <View style={styles.statusContainer}>
                        
                        <View style={styles.statusRow}>
                          <Text variant="bodyMedium" style={styles.statusLabel}>
                            連黑次數:
                          </Text>
                          <Text variant="bodyMedium" style={styles.statusValue}>
                            {compensationStatus?.lostCount || 0} 场
                          </Text>
                        </View>
                        
                        <View style={styles.statusRow}>
                          <Text variant="bodyMedium" style={styles.statusLabel}>
                            連黑成本:
                          </Text>
                          <Text variant="bodyMedium" style={styles.amountText}>
                            {(compensationStatus.totalAmount || 0).toFixed(2)} USDT
                          </Text>
                        </View>
                        
                      </View>
                    ) : (
                      <View style={styles.loadingStatus}>
                        <Text variant="bodyMedium">正在加載狀態...</Text>
                      </View>
                    )}
                  </Card.Content>
                </Card>

                {/* 操作按钮区域 */}
                <Card style={styles.card}>
                  <Card.Content>
                    <View style={styles.buttonContainer}>
                      {/* 重置倍投 */}
                      <Button
                        mode="outlined"
                        onPress={() => handleResetBetting()}
                        style={[styles.actionButton, styles.resetButton]}
                        contentStyle={styles.buttonContent}
                        icon="refresh"
                      >
                        重置倍投
                      </Button>

                      {/* 申请理赔 */}
                      <Button
                        mode="contained"
                        onPress={() => handleApplyClaim()}
                        style={[styles.actionButton, styles.claimButton]}
                        contentStyle={styles.buttonContent}
                        icon="file-document-edit"
                      >
                        申請理賠
                      </Button>
                    </View>
                    <View style={styles.buttonDescription}>
                      <Text variant="bodySmall" style={styles.descriptionText}>
                        重置倍投：清零連黑記錄，重置後可修改參與狀態。當您不想要加倍跟投的時候，也可以選擇重置倍投。
                      </Text>
                      <Text variant="bodySmall" style={styles.descriptionText}>
                        申請理賠：需已參與服務且連黑8次及以上
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              </View>
            </ScrollView>
          ),
          list: () => (
            <View style={styles.tabContent}>
              {loading && claims.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <Icon source="loading" size={48} color={theme.colors.primary} />
                  <Text variant="bodyLarge" style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
                    正在加載理賠記錄...
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={claims}
                  renderItem={renderClaimItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContainer}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                  }
                  onEndReached={handleLoadMore}
                  onEndReachedThreshold={0.1}
                  ListEmptyComponent={!loading && claims.length === 0 ? renderEmptyState : null}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </View>
          ),
        })}
        onIndexChange={setIndex}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            style={styles.tabBar}
            indicatorStyle={styles.tabIndicator}
            activeColor={theme.colors.primary}
            inactiveColor={theme.colors.onSurfaceVariant}
          />
        )}
      />

      {/* 提示模态框 */}
      <Portal>
        <Modal
          visible={showAlertModal}
          onDismiss={() => setShowAlertModal(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.modalContent}>
            <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              {alertTitle}
            </Text>
            <Text variant="bodyMedium" style={[styles.modalDescription, { color: theme.colors.onSurfaceVariant }]}>
              {alertMessage}
            </Text>
            <View style={styles.modalButtons}>
              {alertButtons.map((button, index) => (
                <Button
                  key={index}
                  mode={index === alertButtons.length - 1 ? "contained" : "outlined"}
                  onPress={() => {
                    if (button.onPress) {
                      button.onPress();
                    }
                    setShowAlertModal(false);
                  }}
                  style={[styles.modalButton, { marginLeft: index > 0 ? 12 : 0 }]}
                >
                  {button.text}
                </Button>
              ))}
            </View>
          </View>
        </Modal>
      </Portal>

      {/* 支付密码输入模态框 */}
      <Portal>
        <Modal
          visible={showPasswordModal}
          onDismiss={handlePasswordCancel}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.modalContent}>
            <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              {passwordModalType === 'reset' ? '確認重置倍投' : '確認申請理賠'}
            </Text>
            <Text variant="bodyMedium" style={[styles.modalDescription, { color: theme.colors.onSurfaceVariant }]}>
              {passwordModalType === 'reset' 
                ? '重置倍投將清空您的連黑記錄和連黑成本，重置後您可以重新選擇是否參與理賠服務。'
                : '申請理賠將提交您的連黑記錄，系統將根據理賠規則進行審核處理。'
              }
            </Text>
            <Text variant="bodySmall" style={[styles.securityNote, { color: theme.colors.onSurfaceVariant }]}>
              🔒 為了保障您的資金安全，請輸入支付密碼確認此操作
            </Text>
            
            <TextInput
              label="請輸入支付密碼"
              placeholder="請輸入支付密碼"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              mode="outlined"
              style={styles.passwordInput}
              error={!!passwordError}
              autoFocus
            />
            
            {passwordError ? (
              <Text variant="bodySmall" style={[styles.errorText, { color: theme.colors.error }]}>
                {passwordError}
              </Text>
            ) : null}
            
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={handlePasswordCancel}
                style={styles.modalButton}
              >
                取消
              </Button>
              <Button
                mode="contained"
                onPress={handlePasswordConfirm}
                style={styles.modalButton}
                disabled={!password.trim()}
              >
                確認重置
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tabContent: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: 'white',
    elevation: 2,
  },
  tabIndicator: {
    backgroundColor: '#1976d2',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  formContent: {
    padding: 16,
  },
  claimCard: {
    marginBottom: 16,
    elevation: 2,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  claimInfo: {
    flex: 1,
  },
  claimId: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderId: {
    color: '#666',
  },
  statusChip: {
    marginLeft: 8,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 12,
  },
  claimDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontWeight: 'bold',
    minWidth: 80,
  },
  reasonText: {
    flex: 1,
    textAlign: 'right',
  },
  amountText: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  emptyButton: {
    minWidth: 120,
  },
  introCard: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#F8F9FA',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 0,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  radioGroup: {
    gap: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  radioContent: {
    flex: 1,
    marginLeft: 8,
  },
  radioDescription: {
    color: '#666',
    marginTop: 2,
  },
  input: {
    marginBottom: 16,
  },
  textArea: {
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  authRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  authText: {
    marginVertical: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  statusContainer: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontWeight: 'bold',
    minWidth: 100,
  },
  statusValue: {
    color: '#666',
  },
  loadingStatus: {
    padding: 16,
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 32,
  },
  headerSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerSwitchLabel: {
    color: '#666',
    fontSize: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    minHeight: 40,
  },
  buttonContent: {
    paddingVertical: 4,
  },
  resetButton: {
    borderColor: '#FF9800',
    borderWidth: 1.5,
  },
  claimButton: {
    backgroundColor: '#4CAF50',
  },
  buttonDescription: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 6,
  },
  descriptionText: {
    color: '#666',
    textAlign: 'left',
    lineHeight: 20,
  },
  introHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  introIconContainer: {
    marginBottom: 12,
  },
  introTitle: {
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
    textAlign: 'center',
  },
  introDescription: {
    color: '#666',
    lineHeight: 22,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  introFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  // 支付密码模态框样式
  modalContainer: {
    margin: 20,
    borderRadius: 12,
    padding: 0,
  },
  modalContent: {
    padding: 24,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  modalDescription: {
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  securityNote: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  passwordInput: {
    marginBottom: 8,
  },
  errorText: {
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});
