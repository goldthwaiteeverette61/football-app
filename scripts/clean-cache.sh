#!/bin/bash

echo "🧹 清理项目缓存和重新构建..."

# 清理Metro缓存
echo "清理Metro缓存..."
npx expo start --clear --reset-cache

# 清理TypeScript缓存
echo "清理TypeScript缓存..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf dist

# 重新安装依赖
echo "重新安装依赖..."
npm install

echo "✅ 清理完成！"
