import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonStyles } from '@/constants/CommonStyles';

interface PageContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  safeArea?: boolean;
  statusBarHeight?: boolean;
  navigationBarHeight?: boolean;
  backgroundColor?: string;
  padding?: boolean;
}

/**
 * 通用页面容器组件
 * 统一管理页面布局、安全区域、状态栏等
 */
export default function PageContainer({
  children,
  style,
  safeArea = true,
  statusBarHeight = false,
  navigationBarHeight = false,
  backgroundColor = 'transparent',
  padding = true,
}: PageContainerProps) {
  const insets = useSafeAreaInsets();

  const containerStyle = [
    CommonStyles.container,
    { backgroundColor },
    padding && CommonStyles.paddingMedium,
    style,
  ];

  const content = (
    <View style={containerStyle}>
      {statusBarHeight && (
        <View style={[CommonStyles.statusBarBackground, { height: insets.top }]} />
      )}
      {children}
      {navigationBarHeight && (
        <View style={[CommonStyles.navigationBarBackground, { height: insets.bottom }]} />
      )}
    </View>
  );

  if (safeArea) {
    return (
      <SafeAreaView style={[CommonStyles.container, { backgroundColor }]}>
        {content}
      </SafeAreaView>
    );
  }

  return content;
}
