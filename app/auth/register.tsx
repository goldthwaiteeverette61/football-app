import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    Button,
    Card,
    Icon,
    Surface,
    Text,
    TextInput,
    useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WebCompatibleAlert, useWebCompatibleAlert } from '@/components/WebCompatibleAlert';
import { REGISTER_CONFIG } from '@/constants/auth';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterRequest } from '@/services/authApi';
import captchaManager from '@/utils/captcha';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaCooldown, setCaptchaCooldown] = useState(0);
  const { register } = useAuth();
  const theme = useTheme();
  const showAlert = useWebCompatibleAlert();

  // 獲取驗證碼
  const fetchCaptcha = React.useCallback(async () => {
    try {
      console.log('🔄 開始獲取驗證碼...');
      const captchaData = await captchaManager.getCaptcha();
      console.log('📊 驗證碼數據:', captchaData);
      
      if (captchaData) {
        console.log('✅ 驗證碼獲取成功，設置狀態');
        setCaptchaId(captchaData.captchaId);
        setCaptchaImage(captchaData.captchaImage);
        console.log('📝 驗證碼ID:', captchaData.captchaId);
        console.log('🖼️ 驗證碼圖片長度:', captchaData.captchaImage.length);
      } else {
        console.log('❌ 驗證碼數據為空');
        showAlert('驗證碼獲取失敗', '無法獲取驗證碼，請重試');
      }
    } catch (error: any) {
      console.error('❌ 獲取驗證碼失敗:', error);
      
      // 提取錯誤信息 - apiClient已經處理了後台錯誤信息
      let errorMessage = '驗證碼獲取失敗，請重試';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      console.log('📝 顯示錯誤信息:', errorMessage);
      showAlert('驗證碼獲取失敗', errorMessage);
    }
  }, []);

  // 組件掛載時獲取驗證碼
  React.useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  // 更新驗證碼冷卻時間
  React.useEffect(() => {
    const interval = setInterval(() => {
      const cooldown = captchaManager.getCooldownTime();
      setCaptchaCooldown(cooldown);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !username || !captcha || !inviteCode.trim()) {
      showAlert('錯誤', '請填寫所有字段');
      return;
    }

    if (!validateEmail(email)) {
      showAlert('錯誤', '請輸入有效的郵箱地址');
      return;
    }

    if (password.length < 6) {
      showAlert('錯誤', '密碼至少需要6位字符');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('錯誤', '兩次輸入的密碼不一致');
      return;
    }

    setLoading(true);
    try {
      const registerData: RegisterRequest = {
        clientId: REGISTER_CONFIG.CLIENT_ID,
        tenantId: REGISTER_CONFIG.TENANT_ID,
        grantType: REGISTER_CONFIG.GRANT_TYPE,
        username,
        password,
        userType: REGISTER_CONFIG.USER_TYPE,
        email,
        code: captcha,
        uuid: captchaId,
        invitationCode: inviteCode.trim(),
      };

      await register(registerData);
      showAlert('註冊成功', '請登錄您的賬號', [
        { text: '確定', onPress: () => router.push('/auth/login') }
      ]);
    } catch (error: any) {
      console.error('註冊失敗:', error);
      
      // 提取錯誤信息 - apiClient已經處理了後台錯誤信息
      let errorMessage = '註冊失敗，請重試';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // 顯示錯誤提示
      showAlert('註冊失敗', errorMessage);
      
      // 註冊失敗後刷新驗證碼
      fetchCaptcha();
      setCaptcha('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Surface style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]} elevation={4}>
              <Icon source="account-plus" size={40} color={theme.colors.onPrimary} />
            </Surface>
            <Text variant="headlineMedium" style={[styles.welcomeTitle, { color: theme.colors.onBackground }]}>
              創建賬戶
            </Text>
            <Text variant="bodyMedium" style={[styles.welcomeSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              填寫信息以創建您的新賬戶
            </Text>
          </View>

          {/* Form Section */}
          <Card style={styles.formContainer} elevation={4}>
            <Card.Content style={styles.cardContent}>
              {/* Username Input */}
              <TextInput
                label="用戶名"
                value={username}
                onChangeText={setUsername}
                mode="outlined"
                autoCapitalize="none"
                autoCorrect={false}
                left={<TextInput.Icon icon="account" />}
                style={styles.input}
              />
              
              {/* Email Input */}
              <TextInput
                label="郵箱地址"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                left={<TextInput.Icon icon="email" />}
                style={styles.input}
              />
              
              {/* Password Input */}
              <TextInput
                label="密碼"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                style={styles.input}
              />
              
              {/* Confirm Password Input */}
              <TextInput
                label="確認密碼"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="outlined"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? "eye-off" : "eye"}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                }
                style={styles.input}
              />

              {/* Invite Code Section */}
              <View style={styles.inviteCodeSection}>
                <TextInput
                  label="邀請碼"
                  value={inviteCode}
                  onChangeText={(text) => setInviteCode(text.trim())}
                  mode="outlined"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  left={<TextInput.Icon icon="account-group" />}
                  style={styles.input}
                />
              </View>

              {/* Captcha Section */}
              <View style={styles.captchaSection}>
                <View style={styles.captchaContainer}>
                  <TextInput
                    label="驗證碼"
                    value={captcha}
                    onChangeText={setCaptcha}
                    mode="outlined"
                    keyboardType="numeric"
                    autoCapitalize="none"
                    maxLength={4}
                    left={<TextInput.Icon icon="security" />}
                    style={[styles.captchaInput, { flex: 1 }]}
                  />
                  <TouchableOpacity 
                    style={[styles.captchaDisplay, { backgroundColor: theme.colors.surfaceVariant }]} 
                    onPress={captchaCooldown > 0 ? undefined : fetchCaptcha}
                    activeOpacity={captchaCooldown > 0 ? 1 : 0.7}
                  >
                    {captchaCooldown > 0 ? (
                      <View style={styles.captchaCooldownContainer}>
                        <Text style={[styles.captchaCooldownText, { color: theme.colors.error }]}>
                          {captchaCooldown}
                        </Text>
                        <Text style={[styles.captchaCooldownLabel, { color: theme.colors.onSurfaceVariant }]}>
                          秒後重試
                        </Text>
                      </View>
                    ) : captchaImage ? (
                      <Image
                        source={{ uri: `data:image/png;base64,${captchaImage}` }}
                        style={styles.captchaImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={[styles.captchaText, { color: theme.colors.primary }]}>
                        加載中...
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Register Button */}
              <Button
                mode="contained"
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                icon="account-plus"
                style={styles.registerButton}
                contentStyle={styles.buttonContent}
              >
                {loading ? '註冊中...' : '創建賬戶'}
              </Button>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text variant="bodyMedium" style={[styles.loginText, { color: theme.colors.onSurfaceVariant }]}>
                  已有賬號？
                </Text>
                <Button
                  mode="text"
                  onPress={() => router.push('/auth/login')}
                  textColor={theme.colors.primary}
                >
                  立即登錄
                </Button>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
      <WebCompatibleAlert />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  welcomeTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    marginHorizontal: 4,
  },
  cardContent: {
    padding: 24,
  },
  input: {
    marginBottom: 16,
  },
  inviteCodeSection: {
    marginBottom: 0,
  },
  captchaSection: {
    marginTop: 0,
    marginBottom: 16,
  },
  captchaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  captchaInput: {
    marginBottom: 0,
  },
  captchaDisplay: {
    width: 120,
    height: 52,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.23)',
    marginBottom: 0,
    overflow: 'hidden',
  },
  captchaText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  captchaCooldownContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  captchaCooldownText: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22,
    textAlign: 'center',
  },
  captchaCooldownLabel: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 1,
    textAlign: 'center',
    opacity: 0.8,
  },
  captchaImage: {
    width: '100%',
    height: '100%',
  },
  registerButton: {
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  loginText: {
    marginRight: 8,
  },
});