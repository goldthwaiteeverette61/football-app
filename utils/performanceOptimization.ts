/**
 * 性能优化工具集
 * 提供React Native应用的性能优化工具和最佳实践
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform } from 'react-native';

/**
 * 防抖Hook - 用于搜索和输入优化
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 节流Hook - 用于滚动和频繁事件优化
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * 内存优化的图片加载Hook
 */
export function useOptimizedImage(uri: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
}) {
  const [imageUri, setImageUri] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const optimizedUri = useMemo(() => {
    if (!uri) return null;
    
    // Web平台优化
    if (Platform.OS === 'web') {
      const url = new URL(uri);
      if (options?.width) url.searchParams.set('w', options.width.toString());
      if (options?.height) url.searchParams.set('h', options.height.toString());
      if (options?.quality) url.searchParams.set('q', options.quality.toString());
      return url.toString();
    }
    
    return uri;
  }, [uri, options]);

  useEffect(() => {
    if (!optimizedUri) return;

    setLoading(true);
    setError(null);

    // 平台特定的图片预加载
    if (Platform.OS === 'web') {
      // Web平台使用Image构造函数
      const img = new Image();
      img.onload = () => {
        setImageUri(optimizedUri);
        setLoading(false);
      };
      img.onerror = () => {
        setError('图片加载失败');
        setLoading(false);
      };
      img.src = optimizedUri;

      return () => {
        img.onload = null;
        img.onerror = null;
      };
    } else {
      // React Native平台直接设置URI
      setImageUri(optimizedUri);
      setLoading(false);
    }
  }, [optimizedUri]);

  return { imageUri, loading, error };
}

/**
 * 优化的列表渲染Hook
 */
export function useOptimizedList<T>(
  data: T[],
  keyExtractor: (item: T, index: number) => string,
  options?: {
    pageSize?: number;
    initialPageSize?: number;
  }
) {
  const { pageSize = 20, initialPageSize = 10 } = options || {};
  const [visibleItems, setVisibleItems] = React.useState(initialPageSize);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  const paginatedData = useMemo(() => {
    return data.slice(0, visibleItems);
  }, [data, visibleItems]);

  const loadMore = useCallback(() => {
    if (visibleItems >= data.length || isLoadingMore) return;
    
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleItems(prev => Math.min(prev + pageSize, data.length));
      setIsLoadingMore(false);
    }, 100);
  }, [visibleItems, data.length, pageSize, isLoadingMore]);

  const hasMore = visibleItems < data.length;

  return {
    data: paginatedData,
    loadMore,
    hasMore,
    isLoadingMore,
    totalCount: data.length,
    visibleCount: visibleItems,
  };
}

/**
 * 平台特定的性能优化
 */
export function usePlatformOptimization() {
  const isWeb = Platform.OS === 'web';
  const isAndroid = Platform.OS === 'android';

  const optimizationConfig = useMemo(() => ({
    // Web平台优化
    web: {
      enableVirtualScrolling: true,
      enableImageLazyLoading: true,
      enablePreloadCriticalResources: true,
      maxConcurrentRequests: 6,
    },
    // Android平台优化
    android: {
      enableNativeDriver: true,
      enableHermes: true,
      enableNewArchitecture: true,
      optimizeMemoryUsage: true,
    },
    // 通用优化
    common: {
      enableMemoization: true,
      enableCallbackOptimization: true,
      enableStateBatching: true,
    },
  }), []);

  return {
    isWeb,
    isAndroid,
    config: optimizationConfig,
  };
}

/**
 * 内存使用监控Hook
 */
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = React.useState<{
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  }>({});

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
}

/**
 * 组件渲染性能监控Hook
 */
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef<number>(0);

  useEffect(() => {
    renderCount.current += 1;
    startTime.current = performance.now();
  });

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    if (__DEV__) {
      // 性能优化逻辑保留，但移除调试日志
    }
  });

  return {
    renderCount: renderCount.current,
  };
}

/**
 * 网络请求优化Hook
 */
export function useNetworkOptimization() {
  const requestCache = useRef<Map<string, { data: any; timestamp: number }>>(new Map());
  const activeRequests = useRef<Map<string, Promise<any>>>(new Map());

  const makeOptimizedRequest = useCallback(async <T>(
    key: string,
    requestFn: () => Promise<T>,
    options?: {
      cacheTime?: number;
      staleTime?: number;
    }
  ): Promise<T> => {
    const { cacheTime = 5 * 60 * 1000, staleTime = 30 * 1000 } = options || {};
    const now = Date.now();

    // 检查缓存
    const cached = requestCache.current.get(key);
    if (cached && (now - cached.timestamp) < staleTime) {
      return cached.data;
    }

    // 检查是否有正在进行的相同请求
    const activeRequest = activeRequests.current.get(key);
    if (activeRequest) {
      return activeRequest;
    }

    // 发起新请求
    const requestPromise = requestFn().then((data) => {
      // 缓存结果
      requestCache.current.set(key, { data, timestamp: now });
      
      // 清理过期缓存
      for (const [cacheKey, cacheValue] of requestCache.current.entries()) {
        if (now - cacheValue.timestamp > cacheTime) {
          requestCache.current.delete(cacheKey);
        }
      }
      
      // 移除活跃请求
      activeRequests.current.delete(key);
      
      return data;
    }).catch((error) => {
      activeRequests.current.delete(key);
      throw error;
    });

    activeRequests.current.set(key, requestPromise);
    return requestPromise;
  }, []);

  return { makeOptimizedRequest };
}

/**
 * 批量状态更新Hook
 */
export function useBatchedUpdates() {
  const updateQueue = useRef<Array<() => void>>([]);
  const isProcessing = useRef(false);

  const batchedUpdate = useCallback((updateFn: () => void) => {
    updateQueue.current.push(updateFn);
    
    if (!isProcessing.current) {
      isProcessing.current = true;
      
      // 使用requestAnimationFrame进行批量更新
      requestAnimationFrame(() => {
        const updates = updateQueue.current;
        updateQueue.current = [];
        isProcessing.current = false;
        
        updates.forEach(update => update());
      });
    }
  }, []);

  return { batchedUpdate };
}

export default {
  useDebounce,
  useThrottle,
  useOptimizedImage,
  useOptimizedList,
  usePlatformOptimization,
  useMemoryMonitor,
  useRenderPerformance,
  useNetworkOptimization,
  useBatchedUpdates,
};
