import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { CommonStyles } from '@/constants/CommonStyles';

interface LayoutProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  wrap?: 'wrap' | 'nowrap';
  gap?: number;
  style?: ViewStyle;
}

/**
 * 通用布局组件
 * 统一管理布局样式和间距
 */
export default function Layout({
  children,
  direction = 'column',
  align = 'flex-start',
  justify = 'flex-start',
  wrap = 'nowrap',
  gap = 0,
  style,
}: LayoutProps) {
  const layoutStyle = [
    {
      flexDirection: direction,
      alignItems: align,
      justifyContent: justify,
      flexWrap: wrap,
      gap,
    },
    style,
  ];

  return <View style={layoutStyle}>{children}</View>;
}

/**
 * 行布局组件
 */
export function Row({ children, ...props }: Omit<LayoutProps, 'direction'>) {
  return <Layout direction="row" {...props}>{children}</Layout>;
}

/**
 * 列布局组件
 */
export function Column({ children, ...props }: Omit<LayoutProps, 'direction'>) {
  return <Layout direction="column" {...props}>{children}</Layout>;
}

/**
 * 居中布局组件
 */
export function Center({ children, ...props }: Omit<LayoutProps, 'align' | 'justify'>) {
  return <Layout align="center" justify="center" {...props}>{children}</Layout>;
}

/**
 * 间距组件
 */
interface SpacerProps {
  size?: number;
  direction?: 'horizontal' | 'vertical';
}

export function Spacer({ size = 16, direction = 'vertical' }: SpacerProps) {
  const spacerStyle = direction === 'horizontal' 
    ? { width: size, height: 1 }
    : { height: size, width: 1 };

  return <View style={spacerStyle} />;
}
