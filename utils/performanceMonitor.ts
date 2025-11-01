/**
 * 性能监控工具
 * 用于监控应用性能指标和优化建议
 */

import React from 'react';
import { Platform } from 'react-native';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  networkRequests: number;
  cacheHitRate: number;
  componentRenderCount: number;
}

interface PerformanceReport {
  timestamp: string;
  platform: string;
  metrics: PerformanceMetrics;
  recommendations: string[];
  score: number; // 0-100
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    networkRequests: 0,
    cacheHitRate: 0,
    componentRenderCount: 0,
  };

  private reports: PerformanceReport[] = [];
  private isMonitoring = false;

  // 开始监控
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('🚀 性能监控已启动');
    
    // Web平台监控内存使用
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      this.startMemoryMonitoring();
    }
  }

  // 停止监控
  stopMonitoring() {
    this.isMonitoring = false;
    console.log('⏹️ 性能监控已停止');
  }

  // 记录渲染时间
  recordRenderTime(componentName: string, renderTime: number) {
    this.metrics.renderTime = renderTime;
    
    if (__DEV__) {
      // 性能监控逻辑保留，但移除调试日志
    }
  }

  // 记录网络请求
  recordNetworkRequest() {
    this.metrics.networkRequests++;
  }

  // 记录缓存命中率
  recordCacheHit(hit: boolean) {
    const total = this.metrics.cacheHitRate + 1;
    this.metrics.cacheHitRate = hit ? 
      (this.metrics.cacheHitRate * (total - 1) + 1) / total :
      (this.metrics.cacheHitRate * (total - 1)) / total;
  }

  // 记录组件渲染次数
  recordComponentRender(componentName: string) {
    this.metrics.componentRenderCount++;
    
    if (__DEV__) {
      console.log(`🔄 ${componentName} 渲染次数: ${this.metrics.componentRenderCount}`);
    }
  }

  // 记录滚动性能
  recordScrollPerformance(scrollTime: number) {
    if (__DEV__) {
      console.log(`📜 滚动性能: ${scrollTime.toFixed(2)}ms`);
    }
  }

  // Web平台内存监控
  private startMemoryMonitoring() {
    if (Platform.OS !== 'web') return;

    const monitorMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        };
      }
    };

    // 每5秒监控一次内存使用
    setInterval(monitorMemory, 5000);
    monitorMemory(); // 立即执行一次
  }

  // 生成性能报告
  generateReport(): PerformanceReport {
    const recommendations: string[] = [];
    let score = 100;

    // 分析渲染时间
    if (this.metrics.renderTime > 16.67) { // 超过60fps阈值
      recommendations.push('渲染时间过长，建议优化组件渲染逻辑');
      score -= 20;
    }

    // 分析内存使用（仅Web平台）
    if (this.metrics.memoryUsage) {
      const memoryUsagePercent = (this.metrics.memoryUsage.usedJSHeapSize / this.metrics.memoryUsage.jsHeapSizeLimit) * 100;
      if (memoryUsagePercent > 80) {
        recommendations.push('内存使用率过高，建议检查内存泄漏');
        score -= 15;
      }
    }

    // 分析缓存命中率
    if (this.metrics.cacheHitRate < 0.7) {
      recommendations.push('缓存命中率较低，建议优化缓存策略');
      score -= 10;
    }

    // 分析网络请求数量
    if (this.metrics.networkRequests > 50) {
      recommendations.push('网络请求过多，建议合并请求或使用缓存');
      score -= 10;
    }

    // 分析组件渲染次数
    if (this.metrics.componentRenderCount > 100) {
      recommendations.push('组件渲染次数过多，建议使用React.memo或useMemo优化');
      score -= 15;
    }

    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      platform: Platform.OS,
      metrics: { ...this.metrics },
      recommendations,
      score: Math.max(0, score),
    };

    this.reports.push(report);
    return report;
  }

  // 获取性能报告
  getReports(): PerformanceReport[] {
    return [...this.reports];
  }

  // 获取最新报告
  getLatestReport(): PerformanceReport | null {
    return this.reports.length > 0 ? this.reports[this.reports.length - 1] : null;
  }

  // 重置指标
  resetMetrics() {
    this.metrics = {
      renderTime: 0,
      networkRequests: 0,
      cacheHitRate: 0,
      componentRenderCount: 0,
    };
    this.reports = [];
  }

  // 导出报告
  exportReport(): string {
    const report = this.generateReport();
    return JSON.stringify(report, null, 2);
  }

  // 打印性能摘要
  printSummary() {
    const report = this.getLatestReport();
    if (!report) {
      console.log('📊 暂无性能数据');
      return;
    }

    console.log('📊 性能监控摘要:');
    // 性能评分逻辑保留，但移除调试日志
    console.log(`⏱️ 平均渲染时间: ${report.metrics.renderTime.toFixed(2)}ms`);
    console.log(`🌐 网络请求数: ${report.metrics.networkRequests}`);
    console.log(`💾 缓存命中率: ${(report.metrics.cacheHitRate * 100).toFixed(1)}%`);
    console.log(`🔄 组件渲染次数: ${report.metrics.componentRenderCount}`);
    
    if (report.metrics.memoryUsage) {
      console.log(`🧠 内存使用: ${(report.metrics.memoryUsage.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB / ${(report.metrics.memoryUsage.jsHeapSizeLimit / 1024 / 1024).toFixed(1)}MB`);
    }

    if (report.recommendations.length > 0) {
      console.log('💡 优化建议:');
      report.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
  }
}

// 导出单例实例
export const performanceMonitor = new PerformanceMonitor();

// 导出Hook用于React组件
export function usePerformanceMonitor(componentName: string) {
  const startTime = React.useRef<number>(0);

  React.useEffect(() => {
    startTime.current = performance.now();
  });

  React.useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    performanceMonitor.recordRenderTime(componentName, renderTime);
    performanceMonitor.recordComponentRender(componentName);
  });

  return {
    recordNetworkRequest: () => performanceMonitor.recordNetworkRequest(),
    recordCacheHit: (hit: boolean) => performanceMonitor.recordCacheHit(hit),
    recordScrollPerformance: (scrollTime: number) => performanceMonitor.recordScrollPerformance(scrollTime),
  };
}

export default performanceMonitor;
