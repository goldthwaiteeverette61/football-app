import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { setupTransparentUI } from '@/utils/transparentUI';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    console.log('🖼️ SplashScreen组件初始化');
    
    // 设置透明UI
    setupTransparentUI();
    
    // 显示5秒后自动跳转
    const timer = setTimeout(() => {
      console.log('🖼️ 开屏图片显示完成，准备跳转');
      if (onFinish) {
        onFinish();
      } else {
        router.replace('/(tabs)/wallet');
      }
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [router, onFinish]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        style="light-content" 
        backgroundColor="transparent" 
        translucent={true}
      />
      <Image source={require('../assets/images/home.jpg')} style={styles.splashImage} resizeMode="cover" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  splashImage: {
    width: width,
    height: height,
    position: 'absolute',
  },
});