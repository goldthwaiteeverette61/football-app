# 用户信息缓存系统

## 概述

用户信息缓存系统为应用提供了高效的用户数据管理功能，通过本地缓存减少API调用次数，提升用户体验。

## 用户信息字段

基于实际API响应，用户信息包含以下字段：

- **基本信息**：`userId`, `userName`, `nickName`, `email`
- **登录信息**：`loginIp`, `loginDate`
- **财务信息**：`balance`, `balanceLock`
- **钱包信息**：`walletAddressTron`, `walletAddressTronQrCode`
- **个人资料**：`avatar`, `invitationCode`, `inviterId`
- **安全设置**：`payPasswordSeted`

## 功能特性

- ✅ **智能缓存**：自动缓存用户信息，减少API调用
- ✅ **过期管理**：支持缓存过期时间设置（默认5分钟）
- ✅ **强制刷新**：支持强制更新用户信息
- ✅ **自动清理**：登出时自动清除缓存
- ✅ **类型安全**：完整的TypeScript类型支持

## 核心组件

### 1. UserInfoCache 类

用户信息缓存的核心管理类，提供单例模式访问。

```typescript
import userInfoCache from '@/services/userInfoCache';

// 获取缓存的用户信息
const userInfo = await userInfoCache.getUserInfo();

// 强制更新用户信息
await userInfoCache.forceUpdate(newUserInfo);

// 清除缓存
await userInfoCache.clearCache();
```

### 2. UserApi 服务

集成了缓存功能的用户API服务。

```typescript
import { userApi } from '@/services/userApi';

// 获取用户信息（带缓存）
const response = await userApi.getInfo();

// 强制刷新用户信息
const response = await userApi.refreshUserInfo();

// 清除用户信息缓存
await userApi.clearUserInfoCache();
```

### 3. AuthContext 集成

在认证上下文中集成了用户信息缓存功能。

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, refreshUserInfo, clearUserInfoCache } = useAuth();
  
  // 刷新用户信息
  const handleRefresh = async () => {
    await refreshUserInfo();
  };
  
  // 清除缓存
  const handleClearCache = async () => {
    await clearUserInfoCache();
  };
}
```

## 使用方法

### 基本使用

```typescript
import { userApi } from '@/services/userApi';

// 在组件中获取用户信息
const getUserInfo = async () => {
  try {
    const response = await userApi.getInfo();
    if (response.code === 200) {
      console.log('用户信息:', response.data);
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};
```

### 强制刷新

```typescript
import { useAuth } from '@/contexts/AuthContext';

function ProfileScreen() {
  const { refreshUserInfo } = useAuth();
  
  const handleRefresh = async () => {
    try {
      await refreshUserInfo();
      console.log('用户信息已刷新');
    } catch (error) {
      console.error('刷新失败:', error);
    }
  };
  
  return (
    <Button onPress={handleRefresh}>
      刷新用户信息
    </Button>
  );
}
```

### 缓存状态检查

```typescript
import userInfoCache from '@/services/userInfoCache';

// 检查缓存是否有效
const isValid = userInfoCache.isCacheValid();

// 检查是否需要更新
const needsUpdate = userInfoCache.needsUpdate();

// 获取缓存的用户信息
const cachedUserInfo = userInfoCache.getCachedUserInfo();
```

## 配置选项

### 缓存有效期

默认缓存有效期为5分钟，可以通过修改 `CACHE_DURATION` 常量来调整：

```typescript
// 在 userInfoCache.ts 中
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟
```

### 缓存键名

缓存使用的键名可以通过以下常量修改：

```typescript
const USER_INFO_CACHE_KEY = 'user_info_cache';
const CACHE_TIMESTAMP_KEY = 'user_info_cache_timestamp';
```

## 最佳实践

### 1. 页面加载时使用缓存

```typescript
useEffect(() => {
  const loadUserInfo = async () => {
    try {
      const response = await userApi.getInfo();
      // 使用缓存的用户信息，减少加载时间
    } catch (error) {
      // 处理错误
    }
  };
  
  loadUserInfo();
}, []);
```

### 2. 用户操作后刷新

```typescript
const handleUpdateProfile = async () => {
  try {
    // 更新用户信息
    await userApi.updateProfile(profileData);
    
    // 刷新缓存
    await refreshUserInfo();
  } catch (error) {
    console.error('更新失败:', error);
  }
};
```

### 3. 登出时清理

```typescript
const handleLogout = async () => {
  try {
    await logout(); // 这会自动清除用户信息缓存
  } catch (error) {
    console.error('登出失败:', error);
  }
};
```

## 错误处理

### 网络错误

当网络请求失败时，系统会：
1. 尝试使用缓存的用户信息
2. 如果缓存无效，返回错误
3. 记录错误日志

### 缓存错误

当缓存操作失败时，系统会：
1. 记录错误日志
2. 继续使用内存中的缓存
3. 在下次API调用时重新建立缓存

## 性能优化

### 1. 减少API调用

- 优先使用缓存数据
- 只在必要时进行API调用
- 批量更新用户信息

### 2. 内存管理

- 使用单例模式避免重复实例化
- 及时清理过期缓存
- 合理设置缓存有效期

### 3. 用户体验

- 快速显示缓存数据
- 后台更新最新数据
- 提供手动刷新选项

## 调试和监控

### 日志记录

系统会记录以下关键操作：
- 缓存加载和保存
- API调用成功和失败
- 缓存过期和清理

### 状态检查

```typescript
// 检查缓存状态
console.log('缓存有效:', userInfoCache.isCacheValid());
console.log('需要更新:', userInfoCache.needsUpdate());
console.log('缓存数据:', userInfoCache.getCachedUserInfo());
```

## 注意事项

1. **数据一致性**：缓存数据可能与服务器数据不同步，需要定期刷新
2. **存储空间**：缓存数据会占用本地存储空间，需要合理管理
3. **安全性**：敏感用户信息需要加密存储
4. **网络状态**：离线状态下只能使用缓存数据

## 更新日志

- **v1.0.0**: 初始版本，支持基本的用户信息缓存功能
- **v1.1.0**: 添加强制刷新和缓存状态检查功能
- **v1.2.0**: 集成AuthContext，提供统一的用户信息管理
