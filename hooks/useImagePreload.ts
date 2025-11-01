/**
 * 图片预加载Hook
 * 支持批量预加载、优先级管理和进度跟踪
 */

import { CachePriority, enhancedImageCache } from '@/services/enhancedImageCache';
import { useCallback, useRef, useState } from 'react';

interface PreloadOptions {
  priority?: CachePriority;
  batchSize?: number;
  delay?: number;
  onProgress?: (loaded: number, total: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

interface PreloadState {
  isLoading: boolean;
  progress: number;
  loaded: number;
  total: number;
  errors: string[];
}

export function useImagePreload(urls: string[], options: PreloadOptions = {}) {
  const {
    priority = CachePriority.LOW,
    batchSize = 3,
    delay = 100,
    onProgress,
    onComplete,
    onError,
  } = options;

  const [state, setState] = useState<PreloadState>({
    isLoading: false,
    progress: 0,
    loaded: 0,
    total: urls.length,
    errors: [],
  });

  const isPreloadingRef = useRef(false);
  const currentBatchRef = useRef(0);

  const preloadImages = useCallback(async () => {
    if (isPreloadingRef.current || urls.length === 0) return;

    isPreloadingRef.current = true;
    setState(prev => ({
      ...prev,
      isLoading: true,
      loaded: 0,
      errors: [],
    }));

    try {
      const batches = [];
      for (let i = 0; i < urls.length; i += batchSize) {
        batches.push(urls.slice(i, i + batchSize));
      }

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        currentBatchRef.current = i;

        // 并行处理当前批次
        const promises = batch.map(async (url) => {
          try {
            await enhancedImageCache.cacheImage(url, priority);
            return { success: true, url };
          } catch (error) {
            return { success: false, url, error };
          }
        });

        const results = await Promise.all(promises);
        
        // 更新状态
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success);
        
        setState(prev => ({
          ...prev,
          loaded: prev.loaded + successful,
          errors: [...prev.errors, ...failed.map(f => f.url)],
          progress: ((prev.loaded + successful) / urls.length) * 100,
        }));

        onProgress?.(state.loaded + successful, urls.length);

        // 批次间延迟
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      onComplete?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('预加载失败');
      onError?.(err);
    } finally {
      isPreloadingRef.current = false;
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [urls, priority, batchSize, delay, onProgress, onComplete, onError]);

  const cancelPreload = useCallback(() => {
    isPreloadingRef.current = false;
    setState(prev => ({
      ...prev,
      isLoading: false,
    }));
  }, []);

  const resetPreload = useCallback(() => {
    isPreloadingRef.current = false;
    currentBatchRef.current = 0;
    setState({
      isLoading: false,
      progress: 0,
      loaded: 0,
      total: urls.length,
      errors: [],
    });
  }, [urls.length]);

  return {
    ...state,
    preloadImages,
    cancelPreload,
    resetPreload,
  };
}

export default useImagePreload;
