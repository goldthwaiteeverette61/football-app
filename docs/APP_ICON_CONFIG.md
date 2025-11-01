# ScoreRED 应用图标配置指南

## 📱 图标配置概述

ScoreRED应用支持多种平台的图标配置，包括iOS、Android和Web平台。

---

## 🎯 当前图标配置

### 配置文件位置
- **主配置**: `app.json`
- **图标文件**: `assets/images/`

### 当前图标设置
```json
{
  "expo": {
    "icon": "./assets/images/icon.png",           // 主应用图标
    "ios": {
      // iOS使用主图标
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",  // Android自适应图标前景
        "backgroundColor": "#ffffff"                              // Android自适应图标背景色
      }
    },
    "web": {
      "favicon": "./assets/images/favicon.png"     // Web网站图标
    },
    "plugins": [
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",  // 启动屏幕图标
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ]
    ]
  }
}
```

---

## 📐 图标尺寸要求

### 1. 主应用图标 (icon.png)
- **尺寸**: 1024x1024 像素
- **格式**: PNG
- **用途**: iOS App Store, Android Play Store
- **要求**: 
  - 正方形
  - 无圆角
  - 无阴影
  - 背景透明或纯色

### 2. Android 自适应图标 (adaptive-icon.png)
- **尺寸**: 1024x1024 像素
- **格式**: PNG
- **用途**: Android 8.0+ 自适应图标
- **要求**:
  - 正方形
  - 图标内容居中
  - 背景透明
  - 安全区域: 中心 66% 区域

### 3. Web 网站图标 (favicon.png)
- **尺寸**: 32x32 或 64x64 像素
- **格式**: PNG 或 ICO
- **用途**: 浏览器标签页图标
- **要求**: 小尺寸清晰可见

### 4. 启动屏幕图标 (splash-icon.png)
- **尺寸**: 建议 200x200 像素
- **格式**: PNG
- **用途**: 应用启动时的加载图标
- **要求**: 简洁明了，适合小尺寸显示

---

## 🛠️ 图标生成工具

### 1. Expo 官方工具
```bash
# 安装 expo-cli (如果未安装)
npm install -g @expo/cli

# 生成所有尺寸的图标
npx expo install expo-cli
npx expo install expo-cli@latest
npx expo install expo-cli@latest --fix
```

### 2. 在线图标生成器
- **App Icon Generator**: https://appicon.co/
- **Icon Kitchen**: https://icon.kitchen/
- **MakeAppIcon**: https://makeappicon.com/

### 3. 设计工具
- **Figma**: 免费在线设计工具
- **Sketch**: macOS 设计工具
- **Adobe Illustrator**: 专业矢量设计工具

---

## 🎨 图标设计指南

### 设计原则
1. **简洁明了**: 图标应该在小尺寸下清晰可见
2. **品牌一致**: 与应用整体设计风格保持一致
3. **高对比度**: 确保在各种背景下都能清晰显示
4. **避免文字**: 图标中避免使用文字，因为小尺寸下难以阅读

### 颜色建议
- **主色调**: 使用应用的主品牌色
- **背景色**: 考虑在不同主题下的显示效果
- **对比度**: 确保足够的对比度

### ScoreRED 品牌建议
- **主色**: 红色系 (#FF0000 或 #DC143C)
- **辅助色**: 白色、黑色
- **风格**: 现代、简洁、专业

---

## 📱 平台特定配置

### iOS 配置
```json
{
  "ios": {
    "icon": "./assets/images/icon.png",
    "supportsTablet": true,
    "userInterfaceStyle": "light"
  }
}
```

### Android 配置
```json
{
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/images/adaptive-icon.png",
      "backgroundColor": "#ffffff"
    },
    "package": "com.scoreonred.scoreapp",
    "userInterfaceStyle": "light"
  }
}
```

### Web 配置
```json
{
  "web": {
    "favicon": "./assets/images/favicon.png",
    "bundler": "metro",
    "output": "static"
  }
}
```

---

## 🔄 更新图标步骤

### 1. 准备新图标
1. 设计或获取新的图标文件
2. 确保符合尺寸要求
3. 保存为PNG格式

### 2. 替换文件
```bash
# 替换主图标
cp new-icon.png assets/images/icon.png

# 替换Android自适应图标
cp new-adaptive-icon.png assets/images/adaptive-icon.png

# 替换Web图标
cp new-favicon.png assets/images/favicon.png

# 替换启动屏幕图标
cp new-splash-icon.png assets/images/splash-icon.png
```

### 3. 更新配置 (如需要)
```json
// 如果需要更改背景色
{
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/images/adaptive-icon.png",
      "backgroundColor": "#FF0000"  // 改为红色背景
    }
  }
}
```

### 4. 重新构建应用
```bash
# 清除缓存
npx expo start --clear

# 构建新版本
eas build --platform all
```

---

## 🧪 测试图标

### 1. 开发环境测试
```bash
# 启动开发服务器
npx expo start

# 在模拟器中查看图标效果
npx expo start --ios
npx expo start --android
```

### 2. 不同尺寸测试
- **小尺寸**: 检查在应用列表中的显示效果
- **中等尺寸**: 检查在主屏幕上的显示效果
- **大尺寸**: 检查在设置中的显示效果

### 3. 不同主题测试
- **浅色主题**: 检查在浅色背景下的显示效果
- **深色主题**: 检查在深色背景下的显示效果

---

## 📊 图标优化建议

### 性能优化
1. **文件大小**: 保持图标文件大小合理
2. **格式选择**: PNG格式提供最佳质量
3. **压缩优化**: 使用适当的压缩级别

### 用户体验
1. **识别性**: 确保图标易于识别
2. **一致性**: 保持与应用内图标风格一致
3. **可访问性**: 考虑色盲用户的体验

---

## 🚀 发布前检查

### 检查清单
- [ ] 主图标 (icon.png) 尺寸正确 (1024x1024)
- [ ] Android自适应图标 (adaptive-icon.png) 尺寸正确
- [ ] Web图标 (favicon.png) 尺寸合适
- [ ] 启动屏幕图标 (splash-icon.png) 清晰可见
- [ ] 所有图标在不同主题下显示正常
- [ ] 图标文件大小合理
- [ ] 应用名称和图标匹配

### 测试步骤
1. **本地测试**: 在开发环境中测试所有图标
2. **模拟器测试**: 在iOS和Android模拟器中测试
3. **真机测试**: 在真实设备上测试
4. **构建测试**: 使用EAS Build构建测试版本

---

## 📝 常见问题

### Q: 图标显示不清晰怎么办？
A: 检查图标尺寸是否正确，确保使用PNG格式，避免过度压缩。

### Q: Android自适应图标显示异常？
A: 确保前景图标居中，背景色设置正确，图标内容在安全区域内。

### Q: 如何为不同平台设置不同图标？
A: 可以在iOS和Android配置中分别设置不同的图标路径。

### Q: 图标更新后没有生效？
A: 清除应用缓存，重新构建应用，或卸载重装应用。

---

*最后更新: 2024-01-16*  
*版本: v1.0.0*
