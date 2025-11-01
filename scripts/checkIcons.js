#!/usr/bin/env node

/**
 * ScoreRED 应用图标配置检查脚本
 * 检查图标文件是否存在和配置是否正确
 */

const fs = require('fs');
const path = require('path');

// 图标配置检查
const ICON_CONFIG = {
  main: {
    path: './assets/images/icon.png',
    required: true,
    description: '主应用图标'
  },
  android: {
    path: './assets/images/adaptive-icon.png',
    required: true,
    description: 'Android 自适应图标'
  },
  web: {
    path: './assets/images/favicon.png',
    required: true,
    description: 'Web 网站图标'
  },
  splash: {
    path: './assets/images/splash-icon.png',
    required: true,
    description: '启动屏幕图标'
  }
};

// 检查文件是否存在
function checkFileExists(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  return fs.existsSync(fullPath);
}

// 获取文件信息
function getFileInfo(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  
  const stats = fs.statSync(fullPath);
  return {
    size: stats.size,
    modified: stats.mtime
  };
}

// 检查图标配置
function checkIconConfig() {
  console.log('🔍 检查图标配置...\n');
  
  let allGood = true;
  
  for (const [key, config] of Object.entries(ICON_CONFIG)) {
    const exists = checkFileExists(config.path);
    const status = exists ? '✅' : '❌';
    
    console.log(`${status} ${config.description}: ${config.path}`);
    
    if (exists) {
      const fileInfo = getFileInfo(config.path);
      if (fileInfo) {
        const sizeKB = (fileInfo.size / 1024).toFixed(2);
        console.log(`   大小: ${sizeKB} KB`);
        console.log(`   修改时间: ${fileInfo.modified.toLocaleString()}`);
      }
    } else {
      allGood = false;
      if (config.required) {
        console.log(`   ⚠️  必需文件缺失！`);
      }
    }
    console.log('');
  }
  
  return allGood;
}

// 检查 app.json 配置
function checkAppJsonConfig() {
  console.log('📝 检查 app.json 配置...\n');
  
  const appJsonPath = path.join(process.cwd(), 'app.json');
  
  if (!fs.existsSync(appJsonPath)) {
    console.log('❌ app.json 文件不存在');
    return false;
  }
  
  try {
    const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    
    // 检查主图标配置
    if (appConfig.expo.icon) {
      console.log(`✅ 主图标: ${appConfig.expo.icon}`);
    } else {
      console.log('❌ 主图标未配置');
    }
    
    // 检查Android配置
    if (appConfig.expo.android?.adaptiveIcon) {
      console.log(`✅ Android自适应图标: ${appConfig.expo.android.adaptiveIcon.foregroundImage}`);
      console.log(`✅ Android背景色: ${appConfig.expo.android.adaptiveIcon.backgroundColor}`);
    } else {
      console.log('❌ Android自适应图标未配置');
    }
    
    // 检查Web配置
    if (appConfig.expo.web?.favicon) {
      console.log(`✅ Web图标: ${appConfig.expo.web.favicon}`);
    } else {
      console.log('❌ Web图标未配置');
    }
    
    // 检查启动屏幕配置
    const splashPlugin = appConfig.expo.plugins?.find(plugin => 
      Array.isArray(plugin) && plugin[0] === 'expo-splash-screen'
    );
    
    if (splashPlugin && splashPlugin[1]?.image) {
      console.log(`✅ 启动屏幕图标: ${splashPlugin[1].image}`);
    } else {
      console.log('❌ 启动屏幕图标未配置');
    }
    
    return true;
  } catch (error) {
    console.log('❌ app.json 解析失败:', error.message);
    return false;
  }
}

// 生成建议
function generateSuggestions() {
  console.log('\n💡 建议和下一步:\n');
  
  console.log('1. 图标设计建议:');
  console.log('   - 使用简洁明了的设计');
  console.log('   - 确保在小尺寸下清晰可见');
  console.log('   - 避免使用过多细节');
  console.log('   - 保持品牌一致性\n');
  
  console.log('2. 图标生成:');
  console.log('   npm run generate-icons <源文件路径>');
  console.log('   示例: npm run generate-icons assets/images/logo.svg\n');
  
  console.log('3. 测试图标:');
  console.log('   npx expo start --clear');
  console.log('   在模拟器中检查图标显示效果\n');
  
  console.log('4. 构建应用:');
  console.log('   eas build --platform all');
  console.log('   生成包含新图标的应用包\n');
}

// 主函数
function main() {
  console.log('🚀 ScoreRED 应用图标配置检查');
  console.log('=====================================\n');
  
  const configOk = checkIconConfig();
  const appJsonOk = checkAppJsonConfig();
  
  console.log('\n📊 检查结果:');
  console.log(`图标文件: ${configOk ? '✅ 正常' : '❌ 有问题'}`);
  console.log(`配置文件: ${appJsonOk ? '✅ 正常' : '❌ 有问题'}`);
  
  if (configOk && appJsonOk) {
    console.log('\n🎉 图标配置检查通过！');
  } else {
    console.log('\n⚠️  图标配置需要修复');
    generateSuggestions();
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  checkIconConfig,
  checkAppJsonConfig
};
