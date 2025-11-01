/**
 * 倍投页面 - 功能按钮组件
 * 显示方案跟投、紅單趨勢、我的訂單、理賠管理等功能按钮
 */

import { createShadowStyle } from '@/utils/webCompatibility';
import React, { memo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';

interface ActionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
}

export const ActionButton = memo(function ActionButton({
  icon,
  label,
  onPress,
}: ActionButtonProps) {
  const theme = useTheme();

  return (
    <View style={styles.actionButtonWrapper}>
      <TouchableOpacity 
        style={[
          styles.actionIconContainer, 
          { backgroundColor: theme.colors.primary },
          createShadowStyle({
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 3,
            },
            shadowOpacity: 0.3,
            shadowRadius: 6,
          })
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Icon source={icon} size={20} color="white" />
      </TouchableOpacity>
      <Text style={[styles.actionButtonText, { color: theme.colors.onPrimary }]}>
        {label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  actionButtonWrapper: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 80,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 14,
  },
});
