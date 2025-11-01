# 图片缓存优化系统使用指南

## 概述

本项目实现了一套完整的图片缓存优化系统，包括多级缓存、预加载、压缩和智能管理功能。

## 核心组件

### 1. EnhancedImageCacheService

增强的图片缓存服务，支持：
- 多级缓存策略
- 优先级管理
- 预加载队列
- 智能清理
- 性能统计

```typescript
import { enhancedImageCache, CachePriority } from '@/services/enhancedImageCache';

// 缓存图片
const cachedUri = await enhancedImageCache.cacheImage(url, CachePriority.HIGH);

// 获取缓存图片
const cachedImage = await enhancedImageCache.getCachedImageUri(url, CachePriority.NORMAL);

// 预加载图片
await enhancedImageCache.preloadImages([url1, url2, url3], CachePriority.LOW);

// 获取统计信息
const stats = await enhancedImageCache.getCacheStats();
```

### 2. EnhancedImage 组件

功能丰富的图片组件，支持：
- 懒加载
- 预加载
- 错误重试
- 备用图片
- 性能监控

```typescript
import { EnhancedImage, CachePriority } from '@/components/EnhancedImage';

<EnhancedImage
  uri="https://example.com/image.jpg"
  width={200}
  height={200}
  quality={80}
  enableCache={true}
  enableLazyLoading={true}
  enablePreload={false}
  priority={CachePriority.HIGH}
  fallbackUri="https://example.com/fallback.jpg"
  retryCount={3}
  retryDelay={1000}
  onLoadStart={() => console.log('开始加载')}
  onLoadEnd={() => console.log('加载完成')}
  onError={(error) => console.error('加载失败', error)}
  onCacheHit={(hit) => console.log('缓存命中', hit)}
/>
```

### 3. useImagePreload Hook

批量预加载Hook，支持：
- 批量预加载
- 进度跟踪
- 错误处理
- 取消功能

```typescript
import { useImagePreload, CachePriority } from '@/hooks/useImagePreload';

const { isLoading, progress, loaded, total, errors, preloadImages, cancelPreload } = useImagePreload(
  imageUrls,
  {
    priority: CachePriority.LOW,
    batchSize: 3,
    delay: 100,
    onProgress: (loaded, total) => console.log(`进度: ${loaded}/${total}`),
    onComplete: () => console.log('预加载完成'),
    onError: (error) => console.error('预加载失败', error),
  }
);

// 开始预加载
preloadImages();

// 取消预加载
cancelPreload();
```

### 4. ImageCompressionService

图片压缩服务，支持：
- Web和React Native平台
- 质量压缩
- 尺寸调整
- 格式转换

```typescript
import { imageCompression } from '@/utils/imageCompression';

// 压缩单张图片
const result = await imageCompression.compressImage(uri, {
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1080,
  format: 'jpeg',
});

// 批量压缩
const results = await imageCompression.compressImages(urls, {
  quality: 0.7,
  maxWidth: 1280,
  maxHeight: 720,
});

// 获取图片信息
const info = await imageCompression.getImageInfo(uri);
```

### 5. ImageCacheManager 组件

缓存管理组件，提供：
- 缓存统计显示
- 缓存清理功能
- 性能监控
- 统计重置

```typescript
import { ImageCacheManager } from '@/components/ImageCacheManager';

<ImageCacheManager
  onStatsUpdate={(stats) => {
    console.log('缓存统计更新:', stats);
  }}
/>
```

## 使用场景

### 1. 头像显示

```typescript
import { CachedAvatar } from '@/components/CachedAvatar';

<CachedAvatar
  size={60}
  source={{ uri: user.avatar }}
  priority={CachePriority.HIGH}
/>
```

### 2. 列表图片

```typescript
import { EnhancedImage, CachePriority } from '@/components/EnhancedImage';

<EnhancedImage
  uri={item.imageUrl}
  width={100}
  height={100}
  enableLazyLoading={true}
  priority={CachePriority.NORMAL}
  placeholder={<ActivityIndicator />}
/>
```

### 3. 预加载关键图片

```typescript
import { useImagePreload, CachePriority } from '@/hooks/useImagePreload';

const criticalImages = [
  'https://example.com/hero.jpg',
  'https://example.com/logo.png',
];

const { preloadImages } = useImagePreload(criticalImages, {
  priority: CachePriority.CRITICAL,
  batchSize: 2,
});

// 在组件挂载时预加载
useEffect(() => {
  preloadImages();
}, []);
```

### 4. 图片压缩

```typescript
import { imageCompression } from '@/utils/imageCompression';

// 上传前压缩
const handleImageUpload = async (uri: string) => {
  const compressed = await imageCompression.compressImage(uri, {
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
  });
  
  // 上传压缩后的图片
  await uploadImage(compressed.uri);
};
```

## 配置选项

### 缓存配置

```typescript
// 在 enhancedImageCache.ts 中配置
const CACHE_CONFIG = {
  MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50MB
  CACHE_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7天
  MAX_CONCURRENT_DOWNLOADS: 5,
  PRELOAD_QUEUE_SIZE: 10,
  COMPRESSION_QUALITY: 0.8,
};
```

### 环境变量配置

```typescript
// 在 config/env.ts 中配置
export const envConfig = {
  CACHE_MAX_SIZE: 100 * 1024 * 1024, // 100MB
  CACHE_EXPIRE_TIME: 24 * 60 * 60 * 1000, // 24小时
};
```

## 性能优化建议

### 1. 优先级设置

- `CachePriority.CRITICAL`: 关键图片（Logo、头像）
- `CachePriority.HIGH`: 重要图片（产品图、横幅）
- `CachePriority.NORMAL`: 普通图片（列表图片）
- `CachePriority.LOW`: 次要图片（装饰图片）

### 2. 懒加载策略

```typescript
// 列表中的图片启用懒加载
<EnhancedImage
  uri={item.image}
  enableLazyLoading={true}
  priority={CachePriority.NORMAL}
/>

// 首屏图片禁用懒加载
<EnhancedImage
  uri={heroImage}
  enableLazyLoading={false}
  priority={CachePriority.CRITICAL}
/>
```

### 3. 预加载策略

```typescript
// 预加载下一页的图片
const nextPageImages = getNextPageImages();
const { preloadImages } = useImagePreload(nextPageImages, {
  priority: CachePriority.LOW,
  batchSize: 2,
});
```

### 4. 压缩策略

```typescript
// 根据用途选择压缩参数
const thumbnailOptions = {
  quality: 0.6,
  maxWidth: 200,
  maxHeight: 200,
};

const fullSizeOptions = {
  quality: 0.9,
  maxWidth: 1920,
  maxHeight: 1080,
};
```

## 监控和调试

### 1. 性能监控

```typescript
import { usePerformanceMonitor } from '@/utils/performanceMonitor';

const { recordCacheHit, recordPerformance } = usePerformanceMonitor('ImageComponent');

// 记录缓存命中
recordCacheHit(true);

// 记录性能指标
recordPerformance('imageLoad', loadTime);
```

### 2. 缓存统计

```typescript
const stats = await enhancedImageCache.getCacheStats();
console.log('缓存统计:', {
  文件数量: stats.fileCount,
  总大小: stats.totalSizeMB,
  命中率: stats.hitRate,
  压缩率: stats.compressionRatio,
});
```

### 3. 调试模式

```typescript
// 在开发环境中启用详细日志
if (__DEV__) {
  console.log('图片缓存调试信息:', {
    url,
    cached: !!cachedUri,
    loadTime,
    cacheHit,
  });
}
```

## 最佳实践

1. **合理设置优先级**: 根据图片重要性设置缓存优先级
2. **启用懒加载**: 列表中的图片应该启用懒加载
3. **预加载关键图片**: 预加载用户可能查看的图片
4. **监控缓存性能**: 定期检查缓存命中率和性能指标
5. **定期清理缓存**: 避免缓存占用过多存储空间
6. **错误处理**: 为图片加载失败提供备用方案
7. **压缩优化**: 根据显示需求选择合适的压缩参数

## 迁移指南

### 从旧版本迁移

1. 替换 `imageCache` 为 `enhancedImageCache`
2. 更新组件导入路径
3. 添加优先级参数
4. 启用新的功能特性

```typescript
// 旧版本
import { imageCache } from '@/services/imageCache';
const uri = await imageCache.getCachedImageUri(url);

// 新版本
import { enhancedImageCache, CachePriority } from '@/services/enhancedImageCache';
const uri = await enhancedImageCache.getCachedImageUri(url, CachePriority.NORMAL);
```

这套图片缓存优化系统提供了完整的图片加载、缓存和管理解决方案，能够显著提升应用的性能和用户体验。
