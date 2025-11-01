# 环境变量配置指南

本项目已将所有硬编码的密钥和敏感信息移至环境变量，以提高安全性和可维护性。

## 环境变量文件

### 1. 创建环境变量文件

复制 `env.example` 文件为 `.env`：

```bash
cp env.example .env
```

### 2. 配置环境变量

编辑 `.env` 文件，填入实际的配置值：

```bash
# API 配置
API_BASE_URL=https://api.score.red
API_TIMEOUT=10000
API_VERSION=v1
API_ENCRYPT=true

# RSA 加密密钥（生产环境请使用自己的密钥）
RSA_PUBLIC_KEY=你的RSA公钥
RSA_PRIVATE_KEY=你的RSA私钥

# 安全加密密钥（生产环境请使用强密钥）
SECURE_CRYPTO_KEY=你的安全密钥

# 测试数据（仅用于开发环境）
TEST_USERNAME=admin
TEST_PASSWORD=admin123
TEST_PASSPHRASE=testpass123

# 应用配置
APP_NAME=ScoreGPT
APP_VERSION=1.3.8
APP_ENVIRONMENT=production

# 缓存配置
CACHE_MAX_SIZE=100000000
CACHE_EXPIRE_TIME=86400000

# 日志配置
LOG_LEVEL=info
LOG_ENABLE_CONSOLE=false
```

## 环境变量说明

### API 配置
- `API_BASE_URL`: API 服务器基础 URL
- `API_TIMEOUT`: API 请求超时时间（毫秒）
- `API_VERSION`: API 版本
- `API_ENCRYPT`: 是否启用加密

### 加密配置
- `RSA_PUBLIC_KEY`: RSA 公钥（用于加密）
- `RSA_PRIVATE_KEY`: RSA 私钥（用于解密）
- `SECURE_CRYPTO_KEY`: 安全加密密钥

### 测试数据
- `TEST_USERNAME`: 测试用户名
- `TEST_PASSWORD`: 测试密码
- `TEST_PASSPHRASE`: 测试密码短语

### 应用配置
- `APP_NAME`: 应用名称
- `APP_VERSION`: 应用版本
- `APP_ENVIRONMENT`: 运行环境（development/production）

### 缓存配置
- `CACHE_MAX_SIZE`: 缓存最大大小（字节）
- `CACHE_EXPIRE_TIME`: 缓存过期时间（毫秒）

### 日志配置
- `LOG_LEVEL`: 日志级别（debug/info/warn/error）
- `LOG_ENABLE_CONSOLE`: 是否启用控制台日志

## 使用方法

### 在代码中使用环境变量

```typescript
import { envConfig } from '@/config/env';

// 使用 API 配置
const apiUrl = envConfig.API_BASE_URL;

// 使用加密密钥
const publicKey = envConfig.RSA_PUBLIC_KEY;

// 使用测试数据
const testUser = envConfig.TEST_USERNAME;
```

### 环境变量优先级

1. Expo Constants (app.json 中的 extra 配置)
2. process.env (Web 环境)
3. 默认配置值

## 安全注意事项

### 生产环境
- ✅ 使用强密钥替换默认密钥
- ✅ 设置 `APP_ENVIRONMENT=production`
- ✅ 设置 `LOG_ENABLE_CONSOLE=false`
- ✅ 定期轮换密钥

### 开发环境
- ✅ 可以使用默认配置进行开发
- ✅ 设置 `APP_ENVIRONMENT=development`
- ✅ 可以启用控制台日志进行调试

### 密钥管理
- 🔒 永远不要将 `.env` 文件提交到版本控制系统
- 🔒 使用不同的密钥用于不同环境
- 🔒 定期更新密钥
- 🔒 使用密钥管理服务（如 AWS KMS、Azure Key Vault）

## 部署配置

### Expo 配置

在 `app.json` 中添加环境变量：

```json
{
  "expo": {
    "extra": {
      "API_BASE_URL": "https://api.score.red",
      "API_ENCRYPT": true,
      "RSA_PUBLIC_KEY": "你的RSA公钥",
      "SECURE_CRYPTO_KEY": "你的安全密钥"
    }
  }
}
```

### Docker 配置

在 `docker-compose.yml` 中使用环境变量：

```yaml
version: '3.8'
services:
  app:
    build: .
    environment:
      - API_BASE_URL=${API_BASE_URL}
      - RSA_PUBLIC_KEY=${RSA_PUBLIC_KEY}
      - SECURE_CRYPTO_KEY=${SECURE_CRYPTO_KEY}
    env_file:
      - .env
```

## 迁移完成

以下硬编码值已迁移到环境变量：

- ✅ API 基础 URL
- ✅ RSA 公钥和私钥
- ✅ 安全加密密钥
- ✅ 测试用户名和密码
- ✅ 应用配置信息
- ✅ 缓存配置
- ✅ 日志配置

现在项目更加安全，配置更加灵活！
