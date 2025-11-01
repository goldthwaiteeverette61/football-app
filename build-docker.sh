#!/bin/bash

# ScoreRED Web应用Docker构建脚本
# 版本: 1.2.0

set -e

echo "🚀 开始构建ScoreRED Web应用Docker镜像..."

# 检查dist目录是否存在
if [ ! -d "dist" ]; then
    echo "❌ dist目录不存在，请先运行 'npx expo export --platform web' 构建Web版本"
    exit 1
fi

# 设置镜像名称和标签
IMAGE_NAME="nrt.vultrcr.com/score/score-app"
VERSION="v1.3.5"
TAG="${IMAGE_NAME}:${VERSION}"
LATEST_TAG="${IMAGE_NAME}:latest"

echo "📦 构建Docker镜像: ${TAG}"

# 构建Docker镜像
docker build -t ${TAG} -t ${LATEST_TAG} .

if [ $? -eq 0 ]; then
    echo "✅ Docker镜像构建成功!"
    echo "📋 镜像信息:"
    docker images | grep ${IMAGE_NAME}
    
    echo ""
    echo "🎯 使用方法:"
    echo "  运行容器: docker run -d -p 8080:80 ${TAG}"
    echo "  使用docker-compose: docker-compose up -d"
    echo "  访问应用: http://localhost:8080"
    
    echo ""
    echo "📊 镜像大小:"
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep ${IMAGE_NAME}
    
else
    echo "❌ Docker镜像构建失败!"
    exit 1
fi
