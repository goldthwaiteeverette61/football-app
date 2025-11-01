/**
 * 智能路由导航Hook
 * 集成预加载功能的导航Hook
 */

import { routePreloader } from '@/services/routePreloader';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

export function useSmartNavigation() {
  const router = useRouter();
  const currentRouteRef = useRef<string>('');
  const navigationHistoryRef = useRef<string[]>([]);

  // 智能导航函数
  const navigate = useCallback(async (route: string, params?: any) => {
    try {
      // 记录导航历史
      if (currentRouteRef.current) {
        navigationHistoryRef.current.push(currentRouteRef.current);
        // 保持历史记录在合理范围内
        if (navigationHistoryRef.current.length > 10) {
          navigationHistoryRef.current = navigationHistoryRef.current.slice(-10);
        }
      }

      // 更新当前路由
      currentRouteRef.current = route;

      // 预加载相关页面
      await routePreloader.smartPreload(route);

      // 执行导航
      if (params) {
        router.push({ pathname: route, params });
      } else {
        router.push(route);
      }
    } catch (error) {
      console.error('导航失败:', error);
    }
  }, [router]);

  // 预加载特定页面
  const preloadPage = useCallback(async (pageName: string) => {
    await routePreloader.preloadPage(pageName);
  }, []);

  // 批量预加载页面
  const preloadPages = useCallback(async (pages: string[]) => {
    await routePreloader.preloadPages(pages);
  }, []);

  // 检查页面是否已预加载
  const isPagePreloaded = useCallback((pageName: string) => {
    return routePreloader.isPagePreloaded(pageName);
  }, []);

  // 获取预加载统计
  const getPreloadStats = useCallback(() => {
    return routePreloader.getPreloadStats();
  }, []);

  // 返回上一页
  const goBack = useCallback(() => {
    if (navigationHistoryRef.current.length > 0) {
      const previousRoute = navigationHistoryRef.current.pop();
      if (previousRoute) {
        router.back();
      }
    } else {
      router.back();
    }
  }, [router]);

  // 替换当前页面
  const replace = useCallback(async (route: string, params?: any) => {
    try {
      // 预加载目标页面
      await routePreloader.preloadPage(route);

      // 执行替换
      if (params) {
        router.replace({ pathname: route, params });
      } else {
        router.replace(route);
      }
    } catch (error) {
      console.error('页面替换失败:', error);
    }
  }, [router]);

  // 初始化时预加载核心页面
  useEffect(() => {
    const initializePreloading = async () => {
      try {
        // 延迟预加载，避免影响应用启动
        setTimeout(async () => {
          await routePreloader.preloadCorePages();
        }, 2000);
      } catch (error) {
        console.error('初始化预加载失败:', error);
      }
    };

    initializePreloading();
  }, []);

  return {
    navigate,
    preloadPage,
    preloadPages,
    isPagePreloaded,
    getPreloadStats,
    goBack,
    replace,
    currentRoute: currentRouteRef.current,
    navigationHistory: navigationHistoryRef.current,
  };
}
