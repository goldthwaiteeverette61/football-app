import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { CommonStyles } from '@/constants/CommonStyles';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

/**
 * 通用空状态组件
 * 统一管理空数据状态的UI显示
 */
export default function EmptyState({
  title = '暂无数据',
  message = '当前没有可显示的内容',
  actionText,
  onAction,
  style,
  icon,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={[CommonStyles.emptyContainer, style]}>
      {icon}
      <Text style={[CommonStyles.subtitle, { color: theme.colors.onSurface, marginBottom: 8 }]}>
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
