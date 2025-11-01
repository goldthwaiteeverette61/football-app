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
    useTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useWebCompatibleAlert } from '@/components/WebCompatibleAlert';
import { useAuth } from '@/contexts/AuthContext';
import captchaManager from '@/utils/captcha';

export default function LoginScreen() {
  const alert = useWebCompatibleAlert();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [encryptionEnabled] = useState(true);
  const [captchaCooldown, setCaptchaCooldown] = useState(0);
  const { login, refreshUserInfo, user, isAuthenticated, loading: authLoading } = useAuth();
  const theme = useTheme();

  // 獲取驗證碼
  const fetchCaptcha = React.useCallback(async () => {
    const fetchTime = Date.now();
    console.log(`🔄 登錄頁面 - 開始獲取驗證碼 (時間: ${fetchTime})`);
    try {
      const captchaData = await captchaManager.getCaptcha();
      if (captchaData) {
        setCaptchaId(captchaData.captchaId);
        setCaptchaImage(captchaData.captchaImage);
      } else {
        alert('驗證碼獲取失敗', '無法獲取驗證碼，請重試');
      }
    } catch (error: any) {
      console.error('獲取驗證碼失敗:', error);
      
      // 提取錯誤信息 - apiClient已經處理了後台錯誤信息
      let errorMessage = '驗證碼獲取失敗，請重試';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      alert('驗證碼獲取失敗', errorMessage);
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


  const handleLogin = async () => {
    if (!username || !password || !captcha) {
      alert('輸入錯誤', '請填寫完整的登錄信息');
      return;
    }

    setLoading(true);
    try {
      await login(username, password, captcha, captchaId);
      console.log('🎉 登錄成功，跳轉到錢包頁面');
      router.replace('/(tabs)/wallet' as any);
    } catch (error: any) {
      console.error('登錄失敗:', error);
      
      // 提取錯誤信息 - apiClient已經處理了後台錯誤信息
      let errorMessage = '登錄失敗，請重試';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // 顯示錯誤提示
      alert('登錄失敗', errorMessage);
      
      // 登錄失敗後刷新驗證碼
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
              <Icon source="account" size={40} color={theme.colors.onPrimary} />
            </Surface>
            <Text variant="headlineMedium" style={[styles.welcomeTitle, { color: theme.colors.onBackground }]}>
              歡迎回來
            </Text>
            <Text variant="bodyMedium" style={[styles.welcomeSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              登錄您的賬戶以繼續使用
            </Text>
          </View>

          {/* Form Section */}
          <Card style={styles.formContainer} elevation={4}>
            <Card.Content style={styles.cardContent}>
              {/* Username Input */}
              <TextInput
                label="賬號"
                value={username}
                onChangeText={setUsername}
                mode="outlined"
                autoCapitalize="none"
                autoCorrect={false}
                left={<TextInput.Icon icon="account" />}
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

              {/* Captcha Section */}
              <View style={[styles.captchaSection, { marginTop: 0 }]}>
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

              {/* Encryption Status */}
              <View style={styles.encryptionStatus}>
                <Icon 
                  source={encryptionEnabled ? "shield-check" : "shield-off"} 
                  size={16} 
                  color={encryptionEnabled ? theme.colors.primary : theme.colors.error} 
                />
                <Text style={[styles.encryptionText, { color: encryptionEnabled ? theme.colors.primary : theme.colors.error }]}>
                  {encryptionEnabled ? '數據已加密傳輸' : '數據未加密'}
                </Text>
              </View>


              {/* Login Button */}
              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                icon="login"
                style={styles.loginButton}
                contentStyle={styles.buttonContent}
              >
                {loading ? '登錄中...' : '登錄'}
              </Button>

              {/* Links */}
              <View style={styles.linksContainer}>
                <Button
                  mode="text"
                  onPress={() => router.push('/auth/forgot-password')}
                  textColor={theme.colors.primary}
                >
                  忘記密碼？
                </Button>
              </View>

              {/* Register Link */}
              <View style={styles.registerContainer}>
                <Text variant="bodyMedium" style={[styles.registerText, { color: theme.colors.onSurfaceVariant }]}>
                  還沒有賬號？
                </Text>
                <Button
                  mode="text"
                  onPress={() => router.push('/auth/register')}
                  textColor={theme.colors.primary}
                >
                  立即註冊
                </Button>
              </View>

            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
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
  encryptionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  encryptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loginButton: {
    marginBottom: 16,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  linksContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  registerText: {
    marginRight: 8,
  },
});