# API 服务文档

## 概述

本项目基于 `https://api.score.red` 构建了完整的API服务体系，包含认证、用户管理、钱包、倍投和发现等功能模块。

## 项目结构

```
config/
├── api.ts                 # API配置和端点定义

services/
├── apiClient.ts          # 通用API客户端
├── authApi.ts            # 认证相关API
├── userApi.ts            # 用户相关API
├── walletApi.ts          # 钱包相关API
├── bettingApi.ts         # 倍投相关API
├── discoverApi.ts        # 发现相关API
└── index.ts              # 统一导出
```

## API 配置

### 基础配置
- **基础地址**: `https://api.score.red`
- **API版本**: `v1`
- **超时时间**: 10秒
- **认证方式**: Bearer Token

### 端点结构
```
https://api.score.red/api/v1/{endpoint}
```

### 请求头
所有API请求都包含以下标准请求头：
- `Content-Type: application/json`
- `Accept: application/json`
- `clientid: e5cd7e4891bf95d1d19206ce24a7b32e`
- `Authorization: Bearer {token}` (认证请求)

## 功能模块

### 1. 认证模块 (AuthApi)

#### 登录
```typescript
POST /auth/login
{
  "clientId": "e5cd7e4891bf95d1d19206ce24a7b32e",
  "grantType": "password",
  "tenantId": "000000",
  "code": "string",        // 验证码
  "uuid": "string",        // 验证码UUID
  "username": "string",    // 用户名
  "password": "string"     // 密码
}
```

#### 注册
```typescript
POST /auth/register
{
  "username": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string",
  "inviteCode": "string",
  "captcha": "string",
  "captchaId": "string"
}
```

#### 获取验证码
```typescript
GET /auth/captcha
Response: {
  "captchaId": "string",
  "captchaImage": "base64_string",
  "expiresIn": 300
}
```

### 2. 用户模块 (UserApi)

#### 获取用户信息
```typescript
GET /user/profile
```

#### 更新用户信息
```typescript
PUT /user/profile
{
  "username": "string",
  "email": "string",
  "phone": "string",
  "realName": "string",
  "gender": "male|female|other",
  "birthday": "YYYY-MM-DD",
  "address": "string"
}
```

### 3. 钱包模块 (WalletApi)

#### 获取余额
```typescript
GET /wallet/balance
Response: {
  "totalBalance": 1000.00,
  "availableBalance": 800.00,
  "frozenBalance": 200.00,
  "currency": "CNY"
}
```

#### 创建充值订单
```typescript
POST /wallet/deposit
{
  "amount": 100.00,
  "paymentMethod": "alipay|wechat|bank|crypto",
  "paymentAccount": "string",
  "captcha": "string",
  "captchaId": "string"
}
```

### 4. 倍投模块 (BettingApi)

#### 获取策略列表
```typescript
GET /betting/strategies
```

#### 创建策略
```typescript
POST /betting/strategies
{
  "name": "string",
  "description": "string",
  "baseAmount": 10.00,
  "multiplier": 2.0,
  "maxRounds": 10,
  "targetProfit": 100.00,
  "stopLoss": 50.00
}
```

### 5. 发现模块 (DiscoverApi)

#### 获取推荐内容
```typescript
GET /discover/featured?page=1&limit=20&category=string
```

#### 搜索内容
```typescript
POST /discover/search
{
  "query": "string",
  "type": "article|video|image|strategy|news|tutorial",
  "category": "string",
  "tags": ["string"],
  "sortBy": "relevance|date|popularity|rating",
  "page": 1,
  "limit": 20
}
```

## 错误处理

### HTTP状态码
- `200` - 成功
- `201` - 创建成功
- `400` - 请求错误
- `401` - 未授权
- `403` - 禁止访问
- `404` - 资源不存在
- `409` - 冲突
- `500` - 服务器错误

### 错误响应格式
```typescript
{
  "success": false,
  "message": "错误描述",
  "code": 400
}
```

## 使用示例

### 在组件中使用API

```typescript
import { authApi, walletApi } from '@/services';

// 登录
const handleLogin = async () => {
  try {
    const response = await authApi.login({
      username: 'user123',
      password: 'password123',
      captcha: 'ABCD',
      captchaId: 'captcha-id'
    });
    
    if (response.success) {
      // 登录成功
      console.log('用户信息:', response.data.user);
    }
  } catch (error) {
    console.error('登录失败:', error.message);
  }
};

// 获取钱包余额
const getBalance = async () => {
  try {
    const response = await walletApi.getBalance();
    if (response.success) {
      console.log('余额:', response.data.totalBalance);
    }
  } catch (error) {
    console.error('获取余额失败:', error.message);
  }
};
```

### 在AuthContext中使用

```typescript
import { useAuth } from '@/contexts/AuthContext';

const { login, register, logout, getCaptcha } = useAuth();

// 获取验证码
const captchaData = await getCaptcha();

// 登录
await login(username, password, captcha, captchaId);
```

## 安全特性

1. **Token认证**: 使用JWT Bearer Token进行API认证
2. **验证码**: 所有敏感操作都需要验证码验证
3. **请求超时**: 防止长时间等待
4. **错误处理**: 统一的错误处理和用户友好的错误消息
5. **自动刷新**: 支持Token自动刷新机制

## 开发注意事项

1. **环境变量**: 生产环境请确保API基础地址正确配置
2. **错误处理**: 所有API调用都应该包含适当的错误处理
3. **加载状态**: 长时间API调用应该显示加载状态
4. **缓存策略**: 根据业务需求实现适当的数据缓存
5. **网络状态**: 处理网络连接问题

## 扩展指南

### 添加新的API端点

1. 在 `config/api.ts` 中添加端点定义
2. 在相应的服务文件中实现API方法
3. 在 `services/index.ts` 中导出新的类型和方法
4. 更新相关组件的使用

### 添加新的服务模块

1. 创建新的服务文件 (如 `services/newModuleApi.ts`)
2. 实现API方法
3. 在 `services/index.ts` 中导出
4. 在需要的地方导入使用

