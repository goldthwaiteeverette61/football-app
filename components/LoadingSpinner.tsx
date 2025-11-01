import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { createShadowStyle } from '@/utils/webCompatibility';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';

interface LoadingSpinnerProps {
  size?: number;
  text?: string;
  color?: string;
  type?: 'football' | 'pulse' | 'spinner' | 'dots' | 'wave' | 'bounce' | 'fade';
}

export function LoadingSpinner({ 
  size = 48, 
  text = '正在加载...', 
  color,
  type = 'spinner'
}: LoadingSpinnerProps) {
  const theme = useTheme();
  
  // 足球动画相关
  const footballRotation = useSharedValue(0);
  const footballBounce = useSharedValue(0);
  const footballScale = useSharedValue(1);
  
  // 脉冲动画相关
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.3);
  
  // 点动画相关
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);
  
  // 波浪动画相关
  const waveScale = useSharedValue(1);
  const waveOpacity = useSharedValue(0.3);
  
  // 弹跳动画相关
  const bounceY = useSharedValue(0);
  
  // 淡入淡出动画相关
  const fadeOpacity = useSharedValue(0.3);

  useEffect(() => {
    if (type === 'football') {
      // 足球旋转动画
      footballRotation.value = withRepeat(
        withTiming(360, { duration: 2000 }),
        -1,
        false
      );

      // 足球弹跳动画
      footballBounce.value = withRepeat(
        withSequence(
          withTiming(-15, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1,
        false
      );

      // 足球缩放动画
      footballScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        false
      );
    } else if (type === 'pulse') {
      // 脉冲动画
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        false
      );

      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1,
        false
      );
    } else if (type === 'dots') {
      // 点动画 - 依次闪烁
      dot1Opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 300 }),
          withTiming(0.3, { duration: 600 })
        ),
        -1,
        false
      );

      dot2Opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 300 }),
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 300 }),
          withTiming(0.3, { duration: 300 })
        ),
        -1,
        false
      );

      dot3Opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 600 }),
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 300 })
        ),
        -1,
        false
      );
    } else if (type === 'wave') {
      // 波浪动画
      waveScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 600 }),
          withTiming(0.8, { duration: 600 })
        ),
        -1,
        false
      );

      waveOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.4, { duration: 600 })
        ),
        -1,
        false
      );
    } else if (type === 'bounce') {
      // 弹跳动画
      bounceY.value = withRepeat(
        withSequence(
          withTiming(-20, { duration: 400 }),
          withTiming(0, { duration: 400 })
        ),
        -1,
        false
      );
    } else if (type === 'fade') {
      // 淡入淡出动画
      fadeOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.2, { duration: 1000 })
        ),
        -1,
        false
      );
    }
  }, [type]);

  const footballAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${footballRotation.value}deg` },
      { translateY: footballBounce.value },
      { scale: footballScale.value }
    ],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const dot1AnimatedStyle = useAnimatedStyle(() => ({
    opacity: dot1Opacity.value,
  }));

  const dot2AnimatedStyle = useAnimatedStyle(() => ({
    opacity: dot2Opacity.value,
  }));

  const dot3AnimatedStyle = useAnimatedStyle(() => ({
    opacity: dot3Opacity.value,
  }));

  const waveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: waveScale.value }],
    opacity: waveOpacity.value,
  }));

  const bounceAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bounceY.value }],
  }));

  const fadeAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));

  const spinnerColor = color || theme.colors.primary;

  const renderFootball = () => (
    <Animated.View style={footballAnimatedStyle}>
      <View style={[styles.football, { 
        width: size, 
        height: size,
        backgroundColor: '#ffffff',
        borderColor: '#000000',
      }]}>
        {/* 足球图案 - 更真实的五边形和六边形组合 */}
        <View style={styles.footballPattern}>
          {/* 中心五边形 */}
          <View style={[styles.pentagon, styles.centerPentagon]} />
          
          {/* 周围的六边形 */}
          <View style={[styles.hexagon, styles.hexagon1]} />
          <View style={[styles.hexagon, styles.hexagon2]} />
          <View style={[styles.hexagon, styles.hexagon3]} />
          <View style={[styles.hexagon, styles.hexagon4]} />
          <View style={[styles.hexagon, styles.hexagon5]} />
          
          {/* 连接线 */}
          <View style={[styles.connectionLine, styles.line1]} />
          <View style={[styles.connectionLine, styles.line2]} />
          <View style={[styles.connectionLine, styles.line3]} />
          <View style={[styles.connectionLine, styles.line4]} />
          <View style={[styles.connectionLine, styles.line5]} />
        </View>
      </View>
    </Animated.View>
  );

  const renderPulse = () => (
    <Animated.View style={pulseAnimatedStyle}>
      <View style={[styles.spinner, { 
        width: size, 
        height: size,
        backgroundColor: spinnerColor,
      }]} />
    </Animated.View>
  );

  const renderSpinner = () => (
    <ActivityIndicator size="large" color={spinnerColor} />
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, { backgroundColor: spinnerColor }, dot1AnimatedStyle]} />
      <Animated.View style={[styles.dot, { backgroundColor: spinnerColor }, dot2AnimatedStyle]} />
      <Animated.View style={[styles.dot, { backgroundColor: spinnerColor }, dot3AnimatedStyle]} />
    </View>
  );

  const renderWave = () => (
    <Animated.View style={waveAnimatedStyle}>
      <View style={[styles.wave, { 
        width: size, 
        height: size,
        backgroundColor: spinnerColor,
      }]} />
    </Animated.View>
  );

  const renderBounce = () => (
    <Animated.View style={bounceAnimatedStyle}>
      <View style={[styles.bounce, { 
        width: size, 
        height: size,
        backgroundColor: spinnerColor,
      }]} />
    </Animated.View>
  );

  const renderFade = () => (
    <Animated.View style={fadeAnimatedStyle}>
      <View style={[styles.fade, { 
        width: size, 
        height: size,
        backgroundColor: spinnerColor,
      }]} />
    </Animated.View>
  );

  const renderLoading = () => {
    switch (type) {
      case 'football': return renderFootball();
      case 'pulse': return renderPulse();
      case 'spinner': return renderSpinner();
      case 'dots': return renderDots();
      case 'wave': return renderWave();
      case 'bounce': return renderBounce();
      case 'fade': return renderFade();
      default: return renderSpinner();
    }
  };

  return (
    <View style={styles.container}>
      {renderLoading()}
      {text && (
        <Text variant="bodyLarge" style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>
          {text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  // 足球样式
  football: {
    borderRadius: 50,
    borderWidth: 2,
    marginBottom: 16,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
    }),
    elevation: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footballPattern: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 五边形样式
  pentagon: {
    width: 20,
    height: 20,
    backgroundColor: '#000000',
    position: 'absolute',
    transform: [{ rotate: '36deg' }],
  },
  centerPentagon: {
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -10 },
      { translateY: -10 },
      { rotate: '36deg' }
    ],
  },
  // 六边形样式
  hexagon: {
    width: 16,
    height: 16,
    backgroundColor: '#000000',
    position: 'absolute',
    transform: [{ rotate: '30deg' }],
  },
  hexagon1: {
    top: '20%',
    left: '50%',
    transform: [
      { translateX: -8 },
      { translateY: -8 },
      { rotate: '30deg' }
    ],
  },
  hexagon2: {
    top: '80%',
    left: '50%',
    transform: [
      { translateX: -8 },
      { translateY: -8 },
      { rotate: '30deg' }
    ],
  },
  hexagon3: {
    top: '50%',
    left: '20%',
    transform: [
      { translateX: -8 },
      { translateY: -8 },
      { rotate: '30deg' }
    ],
  },
  hexagon4: {
    top: '50%',
    left: '80%',
    transform: [
      { translateX: -8 },
      { translateY: -8 },
      { rotate: '30deg' }
    ],
  },
  hexagon5: {
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -8 },
      { translateY: -8 },
      { rotate: '30deg' }
    ],
  },
  // 连接线
  connectionLine: {
    position: 'absolute',
    backgroundColor: '#000000',
    height: 1,
  },
  line1: {
    width: 20,
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -10 },
      { translateY: -0.5 },
      { rotate: '0deg' }
    ],
  },
  line2: {
    width: 20,
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -10 },
      { translateY: -0.5 },
      { rotate: '72deg' }
    ],
  },
  line3: {
    width: 20,
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -10 },
      { translateY: -0.5 },
      { rotate: '144deg' }
    ],
  },
  line4: {
    width: 20,
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -10 },
      { translateY: -0.5 },
      { rotate: '216deg' }
    ],
  },
  line5: {
    width: 20,
    top: '50%',
    left: '50%',
    transform: [
      { translateX: -10 },
      { translateY: -0.5 },
      { rotate: '288deg' }
    ],
  },
  // 脉冲样式
  spinner: {
    borderRadius: 50,
    marginBottom: 16,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    }),
    elevation: 5,
  },
  // 点动画样式
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  // 波浪样式
  wave: {
    borderRadius: 50,
    marginBottom: 16,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    }),
    elevation: 5,
  },
  // 弹跳样式
  bounce: {
    borderRadius: 50,
    marginBottom: 16,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    }),
    elevation: 5,
  },
  // 淡入淡出样式
  fade: {
    borderRadius: 50,
    marginBottom: 16,
    ...createShadowStyle({
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    }),
    elevation: 5,
  },
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
});
