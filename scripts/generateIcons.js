#!/usr/bin/env node

/**
 * ScoreRED 应用图标生成脚本
 * 用于生成不同尺寸的应用图标
 */

const fs = require('fs');
const path = require('path');

// 图标尺寸配置
const ICON_SIZES = {
  // 主应用图标
  main: {
    sizes: [1024, 512, 256, 128, 64, 32],
    outputDir: 'assets/images/icons',
    prefix: 'icon'
  },
  
  // Android 自适应图标
  android: {
    sizes: [1024, 512, 256, 128, 64],
    outputDir: 'assets/images/android',
    prefix: 'adaptive-icon'
  },
  
  // iOS 图标
  ios: {
    sizes: [1024, 512, 256, 128, 64, 32],
    outputDir: 'assets/images/ios',
    prefix: 'ios-icon'
  },
  
  // Web 图标
  web: {
    sizes: [64, 32, 16],
    outputDir: 'assets/images/web',
    prefix: 'favicon'
  },
  
  // 启动屏幕图标
  splash: {
    sizes: [200, 100, 50],
    outputDir: 'assets/images/splash',
    prefix: 'splash-icon'
  }
};

// 检查依赖
function checkDependencies() {
  console.log('🔍 检查依赖...');
  
  try {
    require('sharp');
    console.log('✅ Sharp 已安装');
  } catch (error) {
    console.log('❌ Sharp 未安装，正在安装...');
    const { execSync } = require('child_process');
    execSync('npm install sharp', { stdio: 'inherit' });
    console.log('✅ Sharp 安装完成');
  }
}

// 创建输出目录
function createOutputDirs() {
  console.log('📁 创建输出目录...');
  
  Object.values(ICON_SIZES).forEach(config => {
    const dir = path.join(process.cwd(), config.outputDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ 创建目录: ${config.outputDir}`);
    }
  });
}

// 生成图标
async function generateIcons(inputPath) {
  const sharp = require('sharp');
  
  console.log(`🎨 开始生成图标，源文件: ${inputPath}`);
  
  for (const [platform, config] of Object.entries(ICON_SIZES)) {
    console.log(`\n📱 生成 ${platform} 平台图标...`);
    
    for (const size of config.sizes) {
      const outputPath = path.join(
        process.cwd(), 
        config.outputDir, 
        `${config.prefix}-${size}.png`
      );
      
      try {
        await sharp(inputPath)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .png()
          .toFile(outputPath);
        
        console.log(`  ✅ ${size}x${size} -> ${outputPath}`);
      } catch (error) {
        console.error(`  ❌ 生成 ${size}x${size} 失败:`, error.message);
      }
    }
  }
}

// 更新 app.json 配置
function updateAppConfig() {
  console.log('\n📝 更新 app.json 配置...');
  
  const appJsonPath = path.join(process.cwd(), 'app.json');
  
  if (!fs.existsSync(appJsonPath)) {
    console.log('❌ app.json 文件不存在');
    return;
  }
  
  const appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  // 更新图标路径
  appConfig.expo.icon = './assets/images/icons/icon-1024.png';
  appConfig.expo.android.adaptiveIcon.foregroundImage = './assets/images/android/adaptive-icon-1024.png';
  appConfig.expo.web.favicon = './assets/images/web/favicon-32.png';
  appConfig.expo.plugins[1][1].image = './assets/images/splash/splash-icon-200.png';
  
  fs.writeFileSync(appJsonPath, JSON.stringify(appConfig, null, 2));
  console.log('✅ app.json 配置已更新');
}

// 生成图标清单
function generateIconManifest() {
  console.log('\n📋 生成图标清单...');
  
  const manifest = {
    generated: new Date().toISOString(),
    icons: {}
  };
  
  for (const [platform, config] of Object.entries(ICON_SIZES)) {
    manifest.icons[platform] = {
      sizes: config.sizes,
      outputDir: config.outputDir,
      files: config.sizes.map(size => `${config.prefix}-${size}.png`)
    };
  }
  
  const manifestPath = path.join(process.cwd(), 'assets/images/icon-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ 图标清单已生成: assets/images/icon-manifest.json');
}

// 主函数
async function main() {
  console.log('🚀 ScoreRED 应用图标生成器');
  console.log('=====================================\n');
  
  // 检查命令行参数
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('使用方法: node scripts/generateIcons.js <源图标文件路径>');
    console.log('示例: node scripts/generateIcons.js assets/images/logo.svg');
    console.log('\n支持的源文件格式:');
    console.log('- SVG (推荐)');
    console.log('- PNG');
    console.log('- JPG');
    console.log('- WebP');
    process.exit(1);
  }
  
  const inputPath = args[0];
  
  // 检查源文件是否存在
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ 源文件不存在: ${inputPath}`);
    process.exit(1);
  }
  
  try {
    // 检查依赖
    checkDependencies();
    
    // 创建输出目录
    createOutputDirs();
    
    // 生成图标
    await generateIcons(inputPath);
    
    // 更新配置
    updateAppConfig();
    
    // 生成清单
    generateIconManifest();
    
    console.log('\n🎉 图标生成完成！');
    console.log('\n📱 下一步:');
    console.log('1. 检查生成的图标文件');
    console.log('2. 根据需要调整 app.json 配置');
    console.log('3. 测试应用图标显示效果');
    console.log('4. 重新构建应用');
    
  } catch (error) {
    console.error('❌ 生成图标失败:', error.message);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  generateIcons,
  ICON_SIZES
};
