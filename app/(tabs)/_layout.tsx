import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AuthGuard from '@/components/AuthGuard';
import { createShadowStyle } from '@/utils/webCompatibility';

export default function TabLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <AuthGuard>
      <Tabs
        initialRouteName="wallet"
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outline,
            borderTopWidth: 0.5,
            height: 60 + insets.bottom, // 基础高度 + 底部安全区域
            paddingBottom: insets.bottom, // 使用底部安全区域
            paddingTop: 8,
            elevation: 4,
            ...createShadowStyle({
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: -1,
              },
              shadowOpacity: 0.05,
              shadowRadius: 4,
            }),
            ...Platform.select({
              ios: {
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
              },
              android: {
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
              },
              default: {},
            }),
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        }}>
        <Tabs.Screen
          name="wallet"
          options={{
            title: '錢包',
            headerShown: true,
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: theme.colors.onPrimary,
            headerTitleStyle: {
              fontWeight: '600',
            },
            headerTitleAlign: 'center',
            tabBarIcon: ({ color, size }) => (
              <TabBarIcon name="wallet" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="betting"
          options={{
            title: '倍投',
            headerShown: true,
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: theme.colors.onPrimary,
            headerTitleStyle: {
              fontWeight: '600',
            },
            headerTitleAlign: 'center',
            tabBarIcon: ({ color, size }) => (
              <TabBarIcon name="chart-line" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: '發現',
            headerShown: true,
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: theme.colors.onPrimary,
            headerTitleStyle: {
              fontWeight: '600',
            },
            headerTitleAlign: 'center',
            tabBarIcon: ({ color, size }) => (
              <TabBarIcon name="compass" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '我的',
            tabBarIcon: ({ color, size }) => (
              <TabBarIcon name="account" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}

// 簡單的圖標組件
function TabBarIcon({ name, color, size }: { name: string; color: string; size: number }) {
  return (
    <Icon
      source={name}
      size={size}
      color={color}
    />
  );
}