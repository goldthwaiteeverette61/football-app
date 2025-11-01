/**
 * 倍投页面 - 信息卡片组件
 * 显示理賠獎池、連黑成本、本單下注、連黑次數等信息
 */

import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';

interface InfoCardProps {
  label: string;
  value: string | number;
  unit: string;
  loading: boolean;
  onHelpPress: () => void;
}

export const InfoCard = memo(function InfoCard({
  label,
  value,
  unit,
  loading,
  onHelpPress,
}: InfoCardProps) {
  const theme = useTheme();

  return (
    <View style={[styles.infoCard, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
      <View style={styles.infoHeader}>
        <Text variant="bodyMedium" style={[styles.infoLabel, { color: theme.colors.onPrimary, opacity: 0.9 }]}>
          {label}
        </Text>
        <IconButton
          icon="help-circle-outline"
          iconColor={theme.colors.onPrimary}
          size={16}
          onPress={onHelpPress}
          style={styles.helpIcon}
        />
      </View>
      <View style={styles.valueRow}>
        <Text variant="headlineMedium" style={[styles.infoValue, { color: theme.colors.onPrimary }]}>
          {loading ? '--' : value}
        </Text>
        <Text variant="bodySmall" style={[styles.infoUnit, { color: theme.colors.onPrimary, opacity: 0.8 }]}>
          {unit}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  infoCard: {
    width: '48%',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'flex-start',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 12,
    textAlign: 'left',
    flex: 1,
  },
  helpIcon: {
    margin: 0,
    padding: 0,
    width: 20,
    height: 20,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-start',
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoUnit: {
    fontSize: 10,
    marginLeft: 4,
  },
});
