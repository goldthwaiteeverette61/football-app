import { usePerformanceMonitor } from '@/utils/performanceMonitor';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageProps, View } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';
import { CachePriority, enhancedImageCache } from '../services/enhancedImageCache';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  source?: { uri: string } | null;
  fallbackComponent?: React.ReactNode;
  showLoadingIndicator?: boolean;
  loadingIndicatorSize?: 'small' | 'large';
  priority?: CachePriority;
}

export default function CachedImage({
  source,
  fallbackComponent,
  showLoadingIndicator = true,
  loadingIndicatorSize = 'small',
  priority = CachePriority.NORMAL,
  style,
  onError,
  ...props
}: CachedImageProps) {
  const theme = useTheme();
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // 性能监控
  const { recordCacheHit } = usePerformanceMonitor('CachedImage');

  useEffect(() => {
    loadCachedImage();
  }, [source?.uri]);

  const loadCachedImage = async () => {
    if (!source?.uri) {
      setCachedUri(null);
      setHasError(false);
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);

      // 先尝试获取已缓存的图片
      let cachedImageUri = await enhancedImageCache.getCachedImageUri(source.uri, priority);
      
      if (!cachedImageUri) {
        // 如果没有缓存，则下载并缓存
        cachedImageUri = await enhancedImageCache.cacheImage(source.uri, priority);
        recordCacheHit(false); // 缓存未命中
      } else {
        recordCacheHit(true); // 缓存命中
      }

      if (cachedImageUri) {
        setCachedUri(cachedImageUri);
        console.log('✅ 图片加载成功:', cachedImageUri);
      } else {
        setHasError(true);
        console.log('❌ 图片加载失败');
      }
    } catch (error) {
      console.error('❌ 图片缓存加载失败:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // 如果正在加载且显示加载指示器
  if (isLoading && showLoadingIndicator) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size={loadingIndicatorSize} color="#666" />
      </View>
    );
  }

  // 如果有缓存的图片URI，使用缓存的图片
  if (cachedUri && !hasError) {
    return (
      <Image
        {...props}
        source={{ uri: cachedUri }}
        style={style}
        onError={(error) => {
          console.log('❌ 缓存的图片加载失败，回退到原始URL');
          setHasError(true);
          onError?.(error);
        }}
      />
    );
  }

  // 如果有原始URI且没有错误，使用原始URI
  if (source?.uri && !hasError) {
    return (
      <Image
        {...props}
        source={source}
        style={style}
        onError={(error) => {
          console.log('❌ 原始图片加载失败');
          setHasError(true);
          onError?.(error);
        }}
      />
    );
  }

  // 回退到自定义组件或空视图
  if (fallbackComponent) {
    return <>{fallbackComponent}</>;
  }

  // 默认回退：返回一个占位符
  return (
    <View style={[style, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
      <Icon source="soccer" size={24} color={theme.colors.outline} />
    </View>
  );
}
