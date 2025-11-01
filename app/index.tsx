import SplashScreen from '@/components/SplashScreen';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Index() {
  const { isAuthenticated, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // 开屏广告显示时间（6秒）
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 6000); // 6秒后隐藏开屏广告

    return () => clearTimeout(splashTimer);
  }, []);

  // 认证状态检查完成
  useEffect(() => {
    if (!loading) {
      setAuthChecked(true);
    }
  }, [loading]);

  // 如果开屏广告还在显示，强制显示开屏页面
  if (showSplash) {
    return (
      <SplashScreen 
        onFinish={() => {
          console.log('🎬 开屏视频播放完成，准备跳转');
          setShowSplash(false);
        }}
      />
    );
  }

  // 调试信息
  console.log(`🏠 Index页面 - 开屏广告页面 (显示状态: ${showSplash}, 认证检查: ${authChecked}):`);
  console.log('  - loading:', loading);
  console.log('  - isAuthenticated:', isAuthenticated);
  console.log('  - showSplash:', showSplash);
  console.log('  - authChecked:', authChecked);


  // 如果认证检查未完成，显示加载状态
  if (!authChecked) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>正在检查认证状态...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 根据认证状态重定向
  if (isAuthenticated) {
    console.log('✅ 用户已认证，跳转到钱包页面');
    return <Redirect href="/(tabs)/wallet" />;
  } else {
    console.log('❌ 用户未认证，跳转到登录页面');
    return <Redirect href="/auth/login" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1976d2',
  },
  loadingText: {
    fontSize: 16,
    color: 'white',
  },
});
