import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('錯誤', '請輸入郵箱地址');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('錯誤', '請輸入有效的郵箱地址');
      return;
    }

    setLoading(true);
    try {
      // 模擬發送重置密碼郵件
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('發送成功', '重置密碼郵件已發送到您的郵箱', [
        { text: '確定', onPress: () => router.push('/auth/login') }
      ]);
    } catch (error) {
      Alert.alert('發送失敗', '請稍後重試');
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
              <Icon source="help-circle" size={40} color={theme.colors.onPrimary} />
            </Surface>
            <Text variant="headlineMedium" style={[styles.welcomeTitle, { color: theme.colors.onBackground }]}>
              忘記密碼
            </Text>
            <Text variant="bodyMedium" style={[styles.welcomeSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              請輸入您的郵箱地址，我們將發送重置密碼的鏈接給您
            </Text>
          </View>

          {/* Form Section */}
          <Card style={styles.formContainer} elevation={4}>
            <Card.Content style={styles.cardContent}>
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

              {/* Reset Button */}
              <Button
                mode="contained"
                onPress={handleResetPassword}
                loading={loading}
                disabled={loading}
                icon="send"
                style={styles.resetButton}
                contentStyle={styles.buttonContent}
              >
                {loading ? '發送中...' : '發送重置郵件'}
              </Button>

              {/* Back to Login Link */}
              <View style={styles.loginContainer}>
                <Text variant="bodyMedium" style={[styles.loginText, { color: theme.colors.onSurfaceVariant }]}>
                  想起密碼了？
                </Text>
                <Button
                  mode="text"
                  onPress={() => router.push('/auth/login')}
                  textColor={theme.colors.primary}
                >
                  返回登錄
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
    marginBottom: 24,
  },
  resetButton: {
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
