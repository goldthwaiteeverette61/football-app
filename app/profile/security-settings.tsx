import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
    ActivityIndicator,
    Button,
    Card,
    List,
    Modal,
    Portal,
    Text,
    TextInput,
    useTheme
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { WebCompatibleAlert, useWebCompatibleAlert } from '@/components/WebCompatibleAlert';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/apiClient';

export default function SecuritySettingsScreen() {
  const { user, refreshUserInfo, forceRefreshUserInfo } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const showAlert = useWebCompatibleAlert();
  
  // 狀態管理
  const [loading, setLoading] = useState(false);
  const [loginPasswordModalVisible, setLoginPasswordModalVisible] = useState(false);
  const [paymentPasswordModalVisible, setPaymentPasswordModalVisible] = useState(false);
  
  // 登錄密碼修改狀態
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // 支付密碼設置狀態
  const [paymentPassword, setPaymentPassword] = useState('');
  const [confirmPaymentPassword, setConfirmPaymentPassword] = useState('');
  const [loginPassword, setLoginPassword] = useState(''); // 登录密码（始终需要）
  const [oldPayPassword, setOldPayPassword] = useState(''); // 原支付密码（仅在修改时使用）
  const [showPaymentPassword, setShowPaymentPassword] = useState(false);
  const [showConfirmPaymentPassword, setShowConfirmPaymentPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showOldPayPassword, setShowOldPayPassword] = useState(false);

  // 修改登錄密碼
  const handleChangeLoginPassword = async () => {
    if (!currentPassword.trim()) {
      showAlert('錯誤', '請輸入當前密碼');
      return;
    }
    
    if (!newPassword.trim()) {
      showAlert('錯誤', '請輸入新密碼');
      return;
    }
    
    if (newPassword.length < 6) {
      showAlert('錯誤', '新密碼長度不能少於6位');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showAlert('錯誤', '兩次輸入的新密碼不一致');
      return;
    }
    
    if (currentPassword === newPassword) {
      showAlert('錯誤', '新密碼不能與當前密碼相同');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.put('/app/users/updatePwd', {
        oldPassword: currentPassword,
        newPassword: newPassword
      });
      
      console.log('密碼修改響應:', response);
      
      if (response.success) {
        showAlert('成功', '登錄密碼修改成功', [
          {
            text: '確定',
            onPress: () => {
              setLoginPasswordModalVisible(false);
              resetLoginPasswordForm();
            }
          }
        ]);
      } else {
        const errorMessage = response.message || '密碼修改失敗';
        console.error('密碼修改失敗:', errorMessage);
        showAlert('錯誤', errorMessage);
      }
    } catch (error: any) {
      console.error('修改登錄密碼失敗:', error);
      
      // 嘗試從不同位置獲取錯誤信息
      let errorMessage = '密碼修改失敗，請稍後重試';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.response?.message) {
        errorMessage = error.response.message;
      }
      
      console.error('最終錯誤信息:', errorMessage);
      showAlert('錯誤', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 設置支付密碼
  const handleSetPaymentPassword = async () => {
    if (!loginPassword.trim()) {
      showAlert('錯誤', '請輸入登錄密碼');
      return;
    }
    
    // 如果用戶已設置支付密碼，還需要驗證原支付密碼
    if (user?.payPasswordSeted === 1 && !oldPayPassword.trim()) {
      showAlert('錯誤', '請輸入原支付密碼');
      return;
    }
    
    if (!paymentPassword.trim()) {
      showAlert('錯誤', '請輸入支付密碼');
      return;
    }
    
    if (paymentPassword !== confirmPaymentPassword) {
      showAlert('錯誤', '兩次輸入的支付密碼不一致');
      return;
    }

    setLoading(true);
    try {
      const requestData: {
        password: string;
        newPayPassword: string;
        oldPayPassword?: string;
      } = {
        password: loginPassword,  // 登錄密碼（用於身份驗證）
        newPayPassword: paymentPassword  // 新支付密碼
      };
      
      // 如果用戶已設置支付密碼，需要傳入原支付密碼
      if (user?.payPasswordSeted === 1) {
        requestData.oldPayPassword = oldPayPassword;  // 原支付密碼
      }
      
      const response = await apiClient.post('/app/users/setPayPassword', requestData);
      
      console.log('支付密碼設置響應:', response);
      
      if (response.success) {
        const successMessage = user?.payPasswordSeted === 1 ? '支付密碼修改成功' : '支付密碼設置成功';
        showAlert('成功', successMessage, [
          {
            text: '確定',
            onPress: async () => {
              setPaymentPasswordModalVisible(false);
              resetPaymentPasswordForm();
              // 強制刷新用戶信息，確保支付密碼狀態更新
              await forceRefreshUserInfo();
            }
          }
        ]);
      } else {
        const errorMessage = response.message || '支付密碼設置失敗';
        console.error('支付密碼設置失敗:', errorMessage);
        showAlert('錯誤', errorMessage);
      }
    } catch (error: any) {
      console.error('設置支付密碼失敗:', error);
      
      // 嘗試從不同位置獲取錯誤信息
      let errorMessage = '支付密碼設置失敗，請稍後重試';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.response?.message) {
        errorMessage = error.response.message;
      }
      
      console.error('最終錯誤信息:', errorMessage);
      showAlert('錯誤', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 重置登錄密碼表單
  const resetLoginPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  // 重置支付密碼表單
  const resetPaymentPasswordForm = () => {
    setLoginPassword('');
    setOldPayPassword('');
    setPaymentPassword('');
    setConfirmPaymentPassword('');
    setShowLoginPassword(false);
    setShowOldPayPassword(false);
    setShowPaymentPassword(false);
    setShowConfirmPaymentPassword(false);
  };

  // 關閉模態框時重置表單
  const handleCloseLoginPasswordModal = () => {
    setLoginPasswordModalVisible(false);
    resetLoginPasswordForm();
  };

  const handleClosePaymentPasswordModal = () => {
    setPaymentPasswordModalVisible(false);
    resetPaymentPasswordForm();
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: '安全設置',
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.onPrimary,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerTitleAlign: 'center',
        }} 
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style="light" />
        
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 密碼管理 */}
        <Card style={styles.sectionCard} elevation={2}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              密碼管理
            </Text>
            
            <List.Item
              title="修改登錄密碼"
              description="定期更換密碼保護賬戶安全"
              left={(props) => <List.Icon {...props} icon="lock-reset" color={theme.colors.primary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
              onPress={() => setLoginPasswordModalVisible(true)}
              style={styles.actionItem}
            />
            
            <List.Item
              title={user?.payPasswordSeted === 1 ? "修改支付密碼" : "設置支付密碼"}
              description={user?.payPasswordSeted === 1 ? "已設置支付密碼，點擊修改" : "設置支付密碼"}
              left={(props) => <List.Icon {...props} icon="credit-card-lock" color={theme.colors.secondary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={theme.colors.onSurfaceVariant} />}
              onPress={() => setPaymentPasswordModalVisible(true)}
              style={styles.actionItem}
            />
          </Card.Content>
        </Card>

        {/* 安全提示 */}
        <Card style={styles.tipCard} elevation={1}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleSmall" style={[styles.tipTitle, { color: theme.colors.primary }]}>
              安全提示
            </Text>
            <Text variant="bodySmall" style={[styles.tipText, { color: theme.colors.onSurfaceVariant }]}>
              • 請定期更換密碼，建議每3-6個月更換一次{'\n'}
              • 密碼應包含字母、數字和特殊字符{'\n'}
              • 支付密碼用於驗證重要操作，請妥善保管{'\n'}
              • 不要將密碼告訴他人或在不安全的環境下輸入
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
        </SafeAreaView>

      {/* 修改登錄密碼模態框 */}
      <Portal>
        <Modal
          visible={loginPasswordModalVisible}
          onDismiss={handleCloseLoginPasswordModal}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            修改登錄密碼
          </Text>
          
          <TextInput
            label="當前密碼"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrentPassword}
            right={
              <TextInput.Icon
                icon={showCurrentPassword ? "eye-off" : "eye"}
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              />
            }
            style={styles.input}
            mode="outlined"
          />
          
          <TextInput
            label="新密碼"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNewPassword}
            right={
              <TextInput.Icon
                icon={showNewPassword ? "eye-off" : "eye"}
                onPress={() => setShowNewPassword(!showNewPassword)}
              />
            }
            style={styles.input}
            mode="outlined"
            placeholder="至少6位字符"
          />
          
          <TextInput
            label="確認新密碼"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            right={
              <TextInput.Icon
                icon={showConfirmPassword ? "eye-off" : "eye"}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            }
            style={styles.input}
            mode="outlined"
          />
          
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={handleCloseLoginPasswordModal}
              style={styles.modalButton}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              mode="contained"
              onPress={handleChangeLoginPassword}
              style={styles.modalButton}
              disabled={loading}
            >
              {loading ? <ActivityIndicator size="small" color={theme.colors.onPrimary} /> : '確認修改'}
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* 設置支付密碼模態框 */}
      <Portal>
        <Modal
          visible={paymentPasswordModalVisible}
          onDismiss={handleClosePaymentPasswordModal}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="headlineSmall" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            {user?.payPasswordSeted === 1 ? "修改支付密碼" : "設置支付密碼"}
          </Text>
          
          <Text variant="bodyMedium" style={[styles.modalDescription, { color: theme.colors.onSurfaceVariant }]}>
            支付密碼用於驗證重要操作，請設置6位數字密碼
          </Text>
          
          <TextInput
            label="登錄密碼"
            value={loginPassword}
            onChangeText={setLoginPassword}
            secureTextEntry={!showLoginPassword}
            right={
              <TextInput.Icon
                icon={showLoginPassword ? "eye-off" : "eye"}
                onPress={() => setShowLoginPassword(!showLoginPassword)}
              />
            }
            style={styles.input}
            mode="outlined"
            placeholder="請輸入登錄密碼"
          />
          
          {user?.payPasswordSeted === 1 && (
            <TextInput
              label="原支付密碼"
              value={oldPayPassword}
              onChangeText={setOldPayPassword}
              secureTextEntry={!showOldPayPassword}
              right={
                <TextInput.Icon
                  icon={showOldPayPassword ? "eye-off" : "eye"}
                  onPress={() => setShowOldPayPassword(!showOldPayPassword)}
                />
              }
              style={styles.input}
              mode="outlined"
              placeholder="請輸入原支付密碼"
            />
          )}
          
          <TextInput
            label="支付密碼"
            value={paymentPassword}
            onChangeText={setPaymentPassword}
            secureTextEntry={!showPaymentPassword}
            right={
              <TextInput.Icon
                icon={showPaymentPassword ? "eye-off" : "eye"}
                onPress={() => setShowPaymentPassword(!showPaymentPassword)}
              />
            }
            style={styles.input}
            mode="outlined"
            placeholder="請輸入6位數字"
            keyboardType="numeric"
            maxLength={6}
          />
          
          <TextInput
            label="確認支付密碼"
            value={confirmPaymentPassword}
            onChangeText={setConfirmPaymentPassword}
            secureTextEntry={!showConfirmPaymentPassword}
            right={
              <TextInput.Icon
                icon={showConfirmPaymentPassword ? "eye-off" : "eye"}
                onPress={() => setShowConfirmPaymentPassword(!showConfirmPaymentPassword)}
              />
            }
            style={styles.input}
            mode="outlined"
            placeholder="請再次輸入6位數字"
            keyboardType="numeric"
            maxLength={6}
          />
          
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={handleClosePaymentPasswordModal}
              style={styles.modalButton}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              mode="contained"
              onPress={handleSetPaymentPassword}
              style={styles.modalButton}
              disabled={loading}
            >
              {loading ? <ActivityIndicator size="small" color={theme.colors.onPrimary} /> : '確認設置'}
            </Button>
          </View>
        </Modal>
      </Portal>
      <WebCompatibleAlert />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tipCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardContent: {
    padding: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  actionItem: {
    paddingVertical: 4,
  },
  tipTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  tipText: {
    lineHeight: 20,
  },
  modalContainer: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalDescription: {
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});
