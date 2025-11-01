import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { CommonStyles } from '@/constants/CommonStyles';

interface ErrorStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

/**
 * 通用错误状态组件
 * 统一管理错误状态的UI显示
 */
export default function ErrorState({
  title = '出错了',
  message = '发生了未知错误，请稍后重试',
  actionText = '重试',
  onAction,
  style,
  icon,
}: ErrorStateProps) {
  const theme = useTheme();

  return (
    <View style={[CommonStyles.errorContainer, style]}>
      {icon}
      <Text style={[CommonStyles.subtitle, { color: theme.colors.error, marginBottom: 8 }]}>
        {title}
      </Text>
      <Text style={[CommonStyles.body, { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 16 }]}>
        {message}
      </Text>
      {actionText && onAction && (
        <Button mode="contained" onPress={onAction}>
          {actionText}
        </Button>
      )}
    </View>
  );
}
