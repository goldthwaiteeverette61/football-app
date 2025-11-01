/**
 * 增强的图片缓存服务
 * 支持多级缓存、预加载、压缩和智能清理
 */

import { envConfig } from '@/config/env';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// 缓存配置
const CACHE_CONFIG = {
  // 缓存目录
  CACHE_DIR: Platform.OS === 'web' ? 'imageCache/' : `${FileSystem.documentDirectory}imageCache/`,
  
  // 缓存大小限制 (从环境变量读取)
  MAX_CACHE_SIZE: envConfig.CACHE_MAX_SIZE || (Platform.OS === 'web' ? 20 * 1024 * 1024 : 50 * 1024 * 1024),
  
  // 缓存过期时间 (从环境变量读取)
  CACHE_EXPIRY: envConfig.CACHE_EXPIRE_TIME || (Platform.OS === 'web' ? 3 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000),
  
  // 并发下载限制
  MAX_CONCURRENT_DOWNLOADS: Platform.OS === 'web' ? 3 : 5,
  
  // 预加载队列大小
  PRELOAD_QUEUE_SIZE: 10,
  
  // 压缩质量
  COMPRESSION_QUALITY: 0.8,
  
  // 缩略图尺寸
  THUMBNAIL_SIZES: {
    small: { width: 64, height: 64 },
    medium: { width: 128, height: 128 },
    large: { width: 256, height: 256 },
  },
};

// 缓存优先级
enum CachePriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4,
}

// 缓存元数据接口
interface CacheMetadata {
  url: string;
  localPath: string;
  timestamp: number;
  size: number;
  expiresAt: number;
  priority: CachePriority;
  accessCount: number;
  lastAccessed: number;
  compressed: boolean;
  thumbnailPath?: string;
}

// 预加载任务接口
interface PreloadTask {
  url: string;
  priority: CachePriority;
  timestamp: number;
}

// 缓存统计接口
interface CacheStats {
  fileCount: number;
  totalSize: number;
  totalSizeMB: string;
  maxSizeMB: string;
  hitRate: number;
  missRate: number;
  compressionRatio: number;
}

class EnhancedImageCacheService {
  private metadata: Map<string, CacheMetadata> = new Map();
  private downloadQueue: Array<() => Promise<void>> = [];
  private activeDownloads: Set<string> = new Set();
  private preloadQueue: PreloadTask[] = [];
  private isProcessingPreload = false;
  
  // 缓存统计
  private stats = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    compressedSize: 0,
    originalSize: 0,
  };

  constructor() {
    this.initializeCache();
  }

  // 初始化缓存
  private async initializeCache() {
    try {
      // Web平台跳过文件系统操作
      if (Platform.OS === 'web') {
        await this.loadCacheMetadata();
        return;
      }

      // 确保缓存目录存在
      const dirInfo = await FileSystem.getInfoAsync(CACHE_CONFIG.CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_CONFIG.CACHE_DIR, { intermediates: true });
      }

      // 加载缓存元数据
      await this.loadCacheMetadata();
      
      // 清理过期缓存
      await this.cleanExpiredCache();
      
      // 启动预加载处理
      this.startPreloadProcessor();
    } catch (error) {
      console.error('初始化增强图片缓存失败:', error);
    }
  }

  // 加载缓存元数据
  private async loadCacheMetadata() {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            const metadataStr = localStorage.getItem('enhancedImageCacheMetadata');
            if (metadataStr) {
              const metadata = JSON.parse(metadataStr);
              Object.entries(metadata).forEach(([key, value]) => {
                this.metadata.set(key, value as CacheMetadata);
              });
            }
          } catch (error) {
            console.warn('Web平台加载缓存元数据失败:', error);
          }
        }
        return;
      }

      const metadataPath = `${CACHE_CONFIG.CACHE_DIR}metadata.json`;
      const metadataInfo = await FileSystem.getInfoAsync(metadataPath);
      
      if (metadataInfo.exists) {
        const metadataContent = await FileSystem.readAsStringAsync(metadataPath);
        const metadata = JSON.parse(metadataContent);
        
        Object.entries(metadata).forEach(([key, value]) => {
          this.metadata.set(key, value as CacheMetadata);
        });
      }
    } catch (error) {
      console.error('加载缓存元数据失败:', error);
    }
  }

  // 保存缓存元数据
  private async saveCacheMetadata() {
    try {
      const metadata = Object.fromEntries(this.metadata);
      
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            localStorage.setItem('enhancedImageCacheMetadata', JSON.stringify(metadata));
          } catch (error) {
            console.warn('Web平台保存缓存元数据失败:', error);
          }
        }
        return;
      }

      const metadataPath = `${CACHE_CONFIG.CACHE_DIR}metadata.json`;
      await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify(metadata));
    } catch (error) {
      console.error('保存缓存元数据失败:', error);
    }
  }

  // 生成缓存键
  private async generateCacheKey(url: string): Promise<string> {
    const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, url, {
      encoding: Crypto.CryptoEncoding.BASE64,
    });
    return hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  // 获取缓存的图片URI
  async getCachedImageUri(url: string, priority: CachePriority = CachePriority.NORMAL): Promise<string | null> {
    try {
      if (!url || url.trim() === '' || url === 'null' || url === 'undefined') {
        return null;
      }

      this.stats.totalRequests++;
      const cacheKey = await this.generateCacheKey(url);
      const metadata = this.metadata.get(cacheKey);

      if (!metadata) {
        this.stats.misses++;
        return null;
      }

      // 更新访问统计
      metadata.accessCount++;
      metadata.lastAccessed = Date.now();
      metadata.priority = Math.max(metadata.priority, priority);

      // Web平台直接返回URL
      if (Platform.OS === 'web') {
        if (Date.now() > metadata.expiresAt) {
          this.metadata.delete(cacheKey);
          await this.saveCacheMetadata();
          this.stats.misses++;
          return null;
        }
        
        this.stats.hits++;
        return url;
      }

      // 原生平台检查文件是否存在
      const fileInfo = await FileSystem.getInfoAsync(metadata.localPath);
      if (!fileInfo.exists) {
        this.metadata.delete(cacheKey);
        await this.saveCacheMetadata();
        this.stats.misses++;
        return null;
      }

      // 检查是否过期
      if (Date.now() > metadata.expiresAt) {
        await this.deleteCachedImage(cacheKey);
        this.stats.misses++;
        return null;
      }

      this.stats.hits++;
      return metadata.localPath;
    } catch (error) {
      console.error('获取缓存图片失败:', error);
      this.stats.misses++;
      return null;
    }
  }

  // 缓存图片
  async cacheImage(url: string, priority: CachePriority = CachePriority.NORMAL): Promise<string | null> {
    try {
      if (!url || url.trim() === '' || url === 'null' || url === 'undefined') {
        return null;
      }

      const cacheKey = await this.generateCacheKey(url);
      
      // 检查是否已缓存
      const cachedUri = await this.getCachedImageUri(url, priority);
      if (cachedUri) {
        return cachedUri;
      }

      // Web平台跳过文件下载
      if (Platform.OS === 'web') {
        const metadata: CacheMetadata = {
          url,
          localPath: url,
          timestamp: Date.now(),
          size: 0,
          expiresAt: Date.now() + CACHE_CONFIG.CACHE_EXPIRY,
          priority,
          accessCount: 1,
          lastAccessed: Date.now(),
          compressed: false,
        };

        this.metadata.set(cacheKey, metadata);
        await this.saveCacheMetadata();
        return url;
      }

      // 原生平台下载图片
      const localPath = `${CACHE_CONFIG.CACHE_DIR}${cacheKey}.jpg`;
      const downloadResult = await FileSystem.downloadAsync(url, localPath);

      if (downloadResult.status === 200) {
        const fileInfo = await FileSystem.getInfoAsync(localPath);
        
        const metadata: CacheMetadata = {
          url,
          localPath,
          timestamp: Date.now(),
          size: fileInfo.size || 0,
          expiresAt: Date.now() + CACHE_CONFIG.CACHE_EXPIRY,
          priority,
          accessCount: 1,
          lastAccessed: Date.now(),
          compressed: false,
        };

        this.metadata.set(cacheKey, metadata);
        await this.saveCacheMetadata();

        // 检查缓存大小，必要时清理
        await this.manageCacheSize();

        return localPath;
      } else {
        console.error('图片下载失败:', downloadResult.status);
        return null;
      }
    } catch (error) {
      console.error('缓存图片失败:', error);
      return null;
    }
  }

  // 预加载图片
  async preloadImages(urls: string[], priority: CachePriority = CachePriority.LOW): Promise<void> {
    const tasks: PreloadTask[] = urls.map(url => ({
      url,
      priority,
      timestamp: Date.now(),
    }));

    this.preloadQueue.push(...tasks);
    
    // 按优先级排序
    this.preloadQueue.sort((a, b) => b.priority - a.priority);
    
    // 限制队列大小
    if (this.preloadQueue.length > CACHE_CONFIG.PRELOAD_QUEUE_SIZE) {
      this.preloadQueue = this.preloadQueue.slice(0, CACHE_CONFIG.PRELOAD_QUEUE_SIZE);
    }
  }

  // 启动预加载处理器
  private startPreloadProcessor() {
    if (this.isProcessingPreload) return;
    
    this.isProcessingPreload = true;
    this.processPreloadQueue();
  }

  // 处理预加载队列
  private async processPreloadQueue() {
    while (this.preloadQueue.length > 0) {
      const task = this.preloadQueue.shift();
      if (task) {
        try {
          await this.cacheImage(task.url, task.priority);
        } catch (error) {
          console.error('预加载图片失败:', error);
        }
      }
      
      // 避免阻塞主线程
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.isProcessingPreload = false;
  }

  // 管理缓存大小
  private async manageCacheSize() {
    try {
      let totalSize = 0;
      const entries = Array.from(this.metadata.entries());

      entries.forEach(([_, metadata]) => {
        totalSize += metadata.size;
      });

      if (totalSize > CACHE_CONFIG.MAX_CACHE_SIZE) {
        // 按优先级和时间排序，删除低优先级和旧的缓存
        entries.sort((a, b) => {
          const priorityDiff = a[1].priority - b[1].priority;
          if (priorityDiff !== 0) return priorityDiff;
          return a[1].lastAccessed - b[1].lastAccessed;
        });
        
        for (const [key, metadata] of entries) {
          await this.deleteCachedImage(key);
          totalSize -= metadata.size;
          
          if (totalSize <= CACHE_CONFIG.MAX_CACHE_SIZE * 0.8) {
            break;
          }
        }
      }
    } catch (error) {
      console.error('管理缓存大小失败:', error);
    }
  }

  // 清理过期缓存
  private async cleanExpiredCache() {
    try {
      const now = Date.now();
      const expiredKeys: string[] = [];

      this.metadata.forEach((metadata, key) => {
        if (now > metadata.expiresAt) {
          expiredKeys.push(key);
        }
      });

      for (const key of expiredKeys) {
        await this.deleteCachedImage(key);
      }

      if (expiredKeys.length > 0) {
        console.log('清理过期缓存:', expiredKeys.length, '个文件');
      }
    } catch (error) {
      console.error('清理过期缓存失败:', error);
    }
  }

  // 删除缓存的图片
  private async deleteCachedImage(cacheKey: string) {
    try {
      const metadata = this.metadata.get(cacheKey);
      if (metadata) {
        if (Platform.OS !== 'web') {
          const fileInfo = await FileSystem.getInfoAsync(metadata.localPath);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(metadata.localPath);
          }
          
          if (metadata.thumbnailPath) {
            const thumbInfo = await FileSystem.getInfoAsync(metadata.thumbnailPath);
            if (thumbInfo.exists) {
              await FileSystem.deleteAsync(metadata.thumbnailPath);
            }
          }
        }
        
        this.metadata.delete(cacheKey);
        await this.saveCacheMetadata();
      }
    } catch (error) {
      console.error('删除缓存图片失败:', error);
    }
  }

  // 清除所有缓存
  async clearAllCache() {
    try {
      if (Platform.OS === 'web') {
        this.metadata.clear();
        await this.saveCacheMetadata();
        return;
      }

      const dirInfo = await FileSystem.getInfoAsync(CACHE_CONFIG.CACHE_DIR);
      if (dirInfo.exists) {
        await FileSystem.deleteAsync(CACHE_CONFIG.CACHE_DIR);
        await FileSystem.makeDirectoryAsync(CACHE_CONFIG.CACHE_DIR, { intermediates: true });
      }

      this.metadata.clear();
      await this.saveCacheMetadata();
    } catch (error) {
      console.error('清除缓存失败:', error);
    }
  }

  // 获取缓存统计信息
  async getCacheStats(): Promise<CacheStats> {
    try {
      let totalSize = 0;
      let fileCount = 0;

      this.metadata.forEach((metadata) => {
        totalSize += metadata.size;
        fileCount++;
      });

      const hitRate = this.stats.totalRequests > 0 ? (this.stats.hits / this.stats.totalRequests) * 100 : 0;
      const missRate = this.stats.totalRequests > 0 ? (this.stats.misses / this.stats.totalRequests) * 100 : 0;
      const compressionRatio = this.stats.originalSize > 0 ? (this.stats.compressedSize / this.stats.originalSize) * 100 : 0;

      return {
        fileCount,
        totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        maxSizeMB: (CACHE_CONFIG.MAX_CACHE_SIZE / 1024 / 1024).toFixed(2),
        hitRate: Number(hitRate.toFixed(2)),
        missRate: Number(missRate.toFixed(2)),
        compressionRatio: Number(compressionRatio.toFixed(2)),
      };
    } catch (error) {
      console.error('获取缓存统计失败:', error);
      return {
        fileCount: 0,
        totalSize: 0,
        totalSizeMB: '0',
        maxSizeMB: '0',
        hitRate: 0,
        missRate: 0,
        compressionRatio: 0,
      };
    }
  }

  // 重置统计信息
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      compressedSize: 0,
      originalSize: 0,
    };
  }
}

// 导出单例实例
export const enhancedImageCache = new EnhancedImageCacheService();
export { CachePriority };
export default enhancedImageCache;
