# 🔧 SSR兼容性修复说明

## 问题描述

在服务端渲染（SSR）环境中，错误处理服务尝试访问`window`对象，导致以下错误：

```
Metro error: window is not defined
Code: errorService.ts
247 |       window.addEventListener('error', (event) => {
```

## 根本原因

1. **服务端渲染环境**：在Node.js环境中，`window`对象不存在
2. **全局错误处理器**：错误服务在构造函数中立即设置全局错误处理器
3. **平台检测不足**：只检查了`Platform.OS === 'web'`，没有检查`window`是否存在

## 修复方案

### 1. **增强平台检测**

```typescript
// 修复前
if (Platform.OS === 'web') {
  window.addEventListener('error', ...);
}

// 修复后
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('error', ...);
}
```

### 2. **延迟初始化**

```typescript
constructor() {
  this.initializeHandlers();
  this.initializeReporters();
  // 延迟设置全局错误处理器，确保在客户端环境中运行
  if (Platform.OS === 'web') {
    // 使用setTimeout确保在下一个事件循环中执行
    setTimeout(() => {
      this.setupGlobalErrorHandlers();
    }, 0);
  } else {
    this.setupGlobalErrorHandlers();
  }
}
```

### 3. **安全的单例模式**

```typescript
// 安全的单例实例创建
let errorServiceInstance: EnhancedErrorService | null = null;

export const getErrorService = (): EnhancedErrorService => {
  if (!errorServiceInstance) {
    errorServiceInstance = new EnhancedErrorService();
  }
  return errorServiceInstance;
};
```

## 修复的文件

### 1. `services/errorService.ts`
- ✅ 添加了`typeof window !== 'undefined'`检查
- ✅ 实现了延迟初始化机制
- ✅ 创建了安全的单例模式

### 2. `utils/webCompatibility.ts`
- ✅ 修复了`setupGlobalErrorHandlers`函数
- ✅ 修复了`handleChromeExtensionErrors`函数
- ✅ 确保所有Web特定功能都有适当的检查

### 3. `services/apiClient.ts`
- ✅ 更新为使用安全的错误服务获取方法

## 测试验证

创建了测试文件`__tests__/errorService.test.ts`来验证：

1. **SSR环境兼容性**：确保在服务端环境中不会抛出错误
2. **客户端环境功能**：确保在客户端环境中正常工作
3. **错误处理功能**：确保错误处理功能在两种环境中都可用

## 兼容性保证

### ✅ **服务端渲染（SSR）**
- 不会尝试访问`window`对象
- 错误处理功能仍然可用
- 不会影响服务端渲染过程

### ✅ **客户端环境**
- 全局错误处理器正常工作
- Chrome扩展错误过滤功能正常
- 所有Web特定功能可用

### ✅ **React Native环境**
- 原生错误处理机制不变
- 性能监控功能正常
- 平台特定优化保持

## 使用建议

### 1. **推荐用法**
```typescript
import { getErrorService } from '@/services/errorService';

// 在组件中使用
const errorService = getErrorService();
await errorService.handleApiError(error, context);
```

### 2. **向后兼容**
```typescript
import { errorService } from '@/services/errorService';

// 仍然可以使用（推荐使用getErrorService）
await errorService.handleApiError(error, context);
```

### 3. **Hook中使用**
```typescript
import { useErrorHandling } from '@/hooks/useErrorHandling';

// Hook内部已经使用了安全的错误服务
const { handleError } = useErrorHandling();
```

## 性能影响

### ✅ **无性能损失**
- 延迟初始化只在Web平台执行
- 单例模式确保只创建一次实例
- 错误处理逻辑保持不变

### ✅ **内存优化**
- 服务端环境中不会创建不必要的全局监听器
- 客户端环境中按需初始化
- 错误队列管理保持不变

## 总结

通过这次修复，错误处理服务现在完全兼容：

- ✅ **服务端渲染环境**：不会出现`window is not defined`错误
- ✅ **客户端环境**：所有功能正常工作
- ✅ **React Native环境**：原生功能不受影响
- ✅ **向后兼容**：现有代码无需修改
- ✅ **性能优化**：无额外性能开销

这个修复确保了错误处理系统在所有部署环境中都能稳定运行，为应用的可靠性提供了坚实的基础。
