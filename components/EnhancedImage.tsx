/**
 * 增强的图片组件
 * 支持懒加载、预加载、多级缓存、压缩和智能错误处理
 */

import { CachePriority, enhancedImageCache } from '@/services/enhancedImageCache';
import { usePerformanceMonitor } from '@/utils/performanceMonitor';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, ImageProps, Platform, View } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';

interface EnhancedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  width?: number;
  height?: number;
  quality?: number;
  enableCache?: boolean;
  enableLazyLoading?: boolean;
  enablePreload?: boolean;
  priority?: CachePriority;
  placeholder?: React.ReactNode;
  errorPlaceholder?: React.ReactNode;
  fallbackUri?: string;
  retryCount?: number;
  retryDelay?: number;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: any) => void;
  onCacheHit?: (hit: boolean) => void;
}

export const EnhancedImage = memo(function EnhancedImage({
  uri,
  width,
  height,
  quality = 80,
  enableCache = true,
  enableLazyLoading = true,
  enablePreload = false,
  priority = CachePriority.NORMAL,
  placeholder,
  errorPlaceholder,
  fallbackUri,
  retryCount = 3,
  retryDelay = 1000,
  onLoadStart,
  onLoadEnd,
  onError,
  onCacheHit,
  style,
  ...props
}: EnhancedImageProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isVisible, setIsVisible] = useState(!enableLazyLoading);
  
  const imageRef = useRef<Image>(null);
  const intersectionObserver = useRef<IntersectionObserver | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 性能监控
  const { recordCacheHit } = usePerformanceMonitor('EnhancedImage');

  // 懒加载观察器
  useEffect(() => {
    if (!enableLazyLoading || Platform.OS !== 'web') return;

    const element = imageRef.current as any;
    if (!element) return;

    intersectionObserver.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            intersectionObserver.current?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // 提前50px开始加载
        threshold: 0.1,
      }
    );

    intersectionObserver.current.observe(element);

    return () => {
      if (intersectionObserver.current) {
        intersectionObserver.current.disconnect();
      }
    };
  }, [enableLazyLoading]);

  // 预加载处理
  useEffect(() => {
    if (enablePreload && uri) {
      enhancedImageCache.preloadImages([uri], priority);
    }
  }, [enablePreload, uri, priority]);

  // 图片加载处理
  const handleLoadImage = useCallback(async (currentUri: string, attempt: number = 0) => {
    if (!currentUri) return;

    try {
      setLoading(true);
      setError(null);
      onLoadStart?.();

      const startTime = Date.now();
      let finalUri = currentUri;

      // 使用缓存
      if (enableCache) {
        const cachedUri = await enhancedImageCache.getCachedImageUri(currentUri, priority);
        if (cachedUri) {
          finalUri = cachedUri;
          recordCacheHit(true);
          onCacheHit?.(true);
        } else {
          const cachedResult = await enhancedImageCache.cacheImage(currentUri, priority);
          if (cachedResult) {
            finalUri = cachedResult;
            recordCacheHit(false);
            onCacheHit?.(false);
          }
        }
      }

      setImageUri(finalUri);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '图片加载失败';
      setError(errorMessage);
      onError?.(err);
      
      // 重试逻辑
      if (attempt < retryCount) {
        setRetryAttempts(attempt + 1);
        retryTimeoutRef.current = setTimeout(() => {
          handleLoadImage(currentUri, attempt + 1);
        }, retryDelay * Math.pow(2, attempt)) as any; // 指数退避
      } else if (fallbackUri && currentUri !== fallbackUri) {
        // 使用备用URI
        handleLoadImage(fallbackUri, 0);
      }
    } finally {
      setLoading(false);
      onLoadEnd?.();
    }
  }, [enableCache, priority, retryCount, retryDelay, fallbackUri, onLoadStart, onLoadEnd, onError, onCacheHit, recordCacheHit]);

  // 触发图片加载
  useEffect(() => {
    if (isVisible && uri) {
      handleLoadImage(uri);
    }
  }, [isVisible, uri, handleLoadImage]);

  // 清理重试定时器
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // 计算样式
  const imageStyle = useMemo(() => {
    const baseStyle = {
      width: width || '100%',
      height: height || 'auto',
    };

    // Web平台特定样式优化
    const webStyle = Platform.OS === 'web' ? {
      display: 'block' as const,
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'cover' as const,
    } : {};

    if (Array.isArray(style)) {
      return [baseStyle, webStyle, ...style] as any;
    }

    return [baseStyle, webStyle, style] as any;
  }, [width, height, style]);

  // 渲染占位符
  const renderPlaceholder = () => {
    if (placeholder) return placeholder;

    return (
      <View style={[styles.placeholder, imageStyle]}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  // 渲染错误占位符
  const renderErrorPlaceholder = () => {
    if (errorPlaceholder) return errorPlaceholder;

    return (
      <View style={[styles.errorPlaceholder, imageStyle]}>
        <Icon source="image-broken" size={24} color={theme.colors.outline} />
        {retryAttempts > 0 && (
          <Icon source="refresh" size={16} color={theme.colors.outline} />
        )}
      </View>
    );
  };

  // 如果不可见且启用懒加载，返回占位符
  if (!isVisible && enableLazyLoading) {
    return (
      <View ref={imageRef} style={imageStyle}>
        {renderPlaceholder()}
      </View>
    );
  }

  // 如果正在加载
  if (loading) {
    return renderPlaceholder();
  }

  // 如果有错误
  if (error || !imageUri) {
    return renderErrorPlaceholder();
  }

  // 渲染图片
  return (
    <Image
      ref={imageRef}
      source={{ uri: imageUri }}
      style={imageStyle}
      onLoadStart={onLoadStart}
      onLoadEnd={onLoadEnd}
      onError={(error) => {
        console.error('图片加载失败:', error);
        setError('图片加载失败');
        onError?.(error);
      }}
      {...props}
    />
  );
});

const styles = {
  placeholder: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  errorPlaceholder: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    flexDirection: 'row' as const,
    gap: 8,
  },
};

export default EnhancedImage;
