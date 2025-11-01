# ScoreRED Web应用 Docker部署指南

## 📋 概述

本文档介绍如何使用Docker容器化部署ScoreRED Web应用。

## 🚀 快速开始

### 1. 构建Web版本

首先确保已经构建了Web版本：

```bash
npx expo export --platform web
```

### 2. 构建Docker镜像

使用提供的构建脚本：

```bash
./build-docker.sh
```

或者手动构建：

```bash
docker build -t score-app-web:1.2.0 .
```

### 3. 运行容器

#### 使用Docker命令：

```bash
docker run -d -p 8080:80 --name score-app-web score-app-web:1.2.0
```

#### 使用Docker Compose：

```bash
docker-compose up -d
```

### 4. 访问应用

打开浏览器访问：http://localhost:8080

## 📁 文件结构

```
├── Dockerfile              # Docker镜像构建文件
├── nginx.conf             # Nginx配置文件
├── docker-compose.yml     # Docker Compose配置
├── .dockerignore          # Docker构建忽略文件
├── build-docker.sh        # 构建脚本
└── dist/                  # Web应用构建输出目录
```

## ⚙️ 配置说明

### Nginx配置特性

- **Gzip压缩**: 自动压缩静态资源
- **缓存策略**: 静态资源长期缓存，HTML文件不缓存
- **SPA支持**: 支持单页应用路由
- **安全头**: 添加安全相关的HTTP头
- **健康检查**: 提供`/health`端点

### Docker配置特性

- **基础镜像**: 使用轻量级的`nginx:alpine`
- **多阶段构建**: 优化镜像大小
- **健康检查**: 内置健康检查机制
- **端口暴露**: 默认暴露80端口

## 🔧 自定义配置

### 修改端口

编辑`docker-compose.yml`中的端口映射：

```yaml
ports:
  - "3000:80"  # 将本地3000端口映射到容器80端口
```

### 添加环境变量

在`docker-compose.yml`中添加环境变量：

```yaml
environment:
  - NODE_ENV=production
  - API_URL=https://api.example.com
```

### 配置反向代理

如果需要代理API请求，修改`nginx.conf`中的API配置：

```nginx
location /api/ {
    proxy_pass http://backend-service:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 📊 监控和日志

### 查看容器日志

```bash
docker logs score-app-web
```

### 查看实时日志

```bash
docker logs -f score-app-web
```

### 进入容器

```bash
docker exec -it score-app-web sh
```

## 🚀 生产部署

### 1. 使用Docker Registry

```bash
# 标记镜像
docker tag score-app-web:1.2.0 your-registry.com/score-app-web:1.2.0

# 推送镜像
docker push your-registry.com/score-app-web:1.2.0
```

### 2. 使用Docker Swarm

```bash
# 初始化Swarm
docker swarm init

# 部署服务
docker service create --name score-app-web --publish 8080:80 score-app-web:1.2.0
```

### 3. 使用Kubernetes

创建`k8s-deployment.yaml`：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: score-app-web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: score-app-web
  template:
    metadata:
      labels:
        app: score-app-web
    spec:
      containers:
      - name: score-app-web
        image: score-app-web:1.2.0
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
```

## 🔍 故障排除

### 常见问题

1. **容器无法启动**
   - 检查端口是否被占用
   - 查看容器日志：`docker logs score-app-web`

2. **页面无法访问**
   - 确认端口映射正确
   - 检查防火墙设置

3. **静态资源加载失败**
   - 确认dist目录存在
   - 检查Nginx配置

### 调试命令

```bash
# 检查容器状态
docker ps

# 检查镜像
docker images

# 检查网络
docker network ls

# 检查卷
docker volume ls
```

## 📈 性能优化

### 镜像优化

- 使用多阶段构建减少镜像大小
- 使用Alpine Linux基础镜像
- 清理不必要的文件和缓存

### Nginx优化

- 启用Gzip压缩
- 配置适当的缓存策略
- 使用HTTP/2（需要SSL证书）

## 🔒 安全考虑

- 定期更新基础镜像
- 使用非root用户运行容器
- 配置适当的安全头
- 限制容器资源使用

## 📝 版本信息

- **应用版本**: 1.2.0
- **Docker版本**: 支持Docker 20.10+
- **Nginx版本**: Alpine Linux with Nginx
- **最后更新**: 2024年9月
