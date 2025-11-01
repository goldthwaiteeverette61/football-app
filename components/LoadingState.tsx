import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { CommonStyles, CommonColors } from '@/constants/CommonStyles';

interface LoadingStateProps {
  message?: string;
  style?: ViewStyle;
  size?: 'small' | 'large';
  color?: string;
}

/**
 * 通用加载状态组件
 * 统一管理加载中的UI显示
 */
export default function LoadingState({
  message = '加载中...',
  style,
  size = 'large',
  color,
}: LoadingStateProps) {
  const theme = useTheme();

  return (
    <View style={[CommonStyles.loadingContainer, style]}>
      <ActivityIndicator
        size={size}
        color={color || theme.colors.primary}
      />
      {message && (
        <Text style={[CommonStyles.body, { marginTop: 16, color: theme.colors.onSurface }]}>
          {message}
        </Text>
      )}
    </View>
  );
}
