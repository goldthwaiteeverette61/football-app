#!/bin/bash

# --- Expo Web 自动部署脚本 ---

# 设置颜色变量
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- 在这里修改您的配置 ---
# 1. Expo Web 打包后的输出目录 (默认为 dist)
BUILD_DIR="dist"

# 2. [已更新] Nginx 部署的目标目录
TARGET_DIR="/var/www/football-app"
# --- 配置结束 ---

# 获取脚本所在的当前目录作为项目目录
PROJECT_DIR=$(pwd)

echo -e "${GREEN}部署开始：正在更新 Expo Web 应用...${NC}"
echo "项目路径: $PROJECT_DIR"
echo "目标路径: $TARGET_DIR"

# 步骤 1: 执行打包命令
echo -e "\n${GREEN}步骤 1/4: 正在执行 [npx expo export]...${NC}"
npx expo export

# 步骤 2: 检查打包是否成功
if [ $? -ne 0 ]; then
    echo -e "\n${RED}错误：打包失败 (npx expo export)！${NC}"
    echo "部署已中止。请检查上面的错误日志。"
    exit 1
fi
echo -e "${GREEN}打包成功！${NC}"

# 步骤 3: 清理旧的部署文件
echo -e "\n${GREEN}步骤 2/4: 正在清理目标文件夹 '$TARGET_DIR' ...${NC}"
if [ -d "$TARGET_DIR" ]; then
    sudo rm -rf "$TARGET_DIR"/*
    if [ $? -ne 0 ]; then
        echo -e "\n${RED}错误：清理目标文件夹失败。请检查权限。${NC}"
        exit 1
    fi
else
    echo "目标文件夹不存在，将自动创建..."
    sudo mkdir -p "$TARGET_DIR"
fi
echo -e "${GREEN}清理完成。${NC}"

# 步骤 4: 复制新的文件到目标文件夹
echo -e "\n${GREEN}步骤 3/4: 正在复制新文件到 '$TARGET_DIR' ...${NC}"
sudo cp -r "$BUILD_DIR"/* "$TARGET_DIR"/
if [ $? -ne 0 ]; then
    echo -e "\n${RED}错误：复制文件失败。${NC}"
    exit 1
fi
echo -e "${GREEN}文件复制成功。${NC}"

# 步骤 5: 设定正确的文件权限（非常重要！）
echo -e "\n${GREEN}步骤 4/4: 正在为 Nginx (www-data) 设定文件权限...${NC}"
sudo chown -R www-data:www-data "$TARGET_DIR"
sudo chmod -R 755 "$TARGET_DIR"
if [ $? -ne 0 ]; then
    echo -e "\n${RED}错误：设定权限失败。${NC}"
    exit 1
fi
echo -e "${GREEN}权限设定成功。${NC}"

echo -e "\n${GREEN}===========================================${NC}"
echo -e "${GREEN}🎉 部署完成！Expo Web 应用已成功更新到新目录。${NC}"
echo "请清除浏览器缓存后，刷新您的网站。"