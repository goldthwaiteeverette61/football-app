import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import { VersionCheckProvider } from '@/components/VersionCheckProvider';
import { WebCompatibleAlert } from '@/components/WebCompatibleAlert';
import { AuthProvider } from '@/contexts/AuthContext';
import { setBottomNavigationBarColor, setupAppStartTransparentUI } from '@/utils/transparentUI';
import { initializeWebCompatibility } from '@/utils/webCompatibility';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // 初始化Web兼容性
  useEffect(() => {
    initializeWebCompatibility();
  }, []);

  // 设置全局透明UI效果
  useEffect(() => {
    // 应用启动时立即设置透明效果
    setupAppStartTransparentUI();
  }, []);

  // 同步系统底部导航栏颜色为应用Tab背景（MD3 surface: #FFFBFE）
  useEffect(() => {
    setBottomNavigationBarColor('#FFFBFE');
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <PaperProvider theme={MD3LightTheme}>
      <VersionCheckProvider>
        <AuthProvider>
          <ThemeProvider value={DefaultTheme}>
            <StatusBar 
              style="light" 
              backgroundColor="transparent" 
              translucent={true}
            />
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="auth/login" options={{ headerShown: false }} />
              <Stack.Screen name="auth/register" options={{ headerShown: false }} />
              <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="profile/edit-profile" options={{ title: '编辑资料' }} />
              <Stack.Screen name="profile/invite-friends" options={{ title: '邀請好友' }} />
              <Stack.Screen name="profile/security-settings" options={{ title: '安全设置' }} />
              <Stack.Screen name="discover/football-matches" options={{ title: '足球赛事' }} />
              <Stack.Screen name="discover/football-calculator" options={{ title: '足球计算器' }} />
              <Stack.Screen name="discover/calculator-orders" options={{ title: '计算器订单', headerTitleAlign: 'center' }} />
              <Stack.Screen name="profile/betting-strategy" options={{ title: '倍投包赔策略' }} />
              <Stack.Screen name="profile/cache-management" options={{ title: '缓存管理', headerTitleAlign: 'center' }} />
              <Stack.Screen name="betting/claim-management" options={{ title: '理赔管理', headerTitleAlign: 'center' }} />
              <Stack.Screen name="betting/scheme-betting" options={{ title: '方案跟投', headerTitleAlign: 'center' }} />
              <Stack.Screen name="betting/orders" options={{ title: '我的订单', headerTitleAlign: 'center' }} />
              <Stack.Screen name="betting/red-trend" options={{ title: '红单趋势', headerTitleAlign: 'center' }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <WebCompatibleAlert />
          </ThemeProvider>
        </AuthProvider>
      </VersionCheckProvider>
    </PaperProvider>
  );
}
