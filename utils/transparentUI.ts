import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import { Platform } from 'react-native';

/**
 * 设置状态栏透明（保持顶部正常）
 */
export async function setupStatusBarTransparent() {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    console.log('🔄 设置状态栏透明');
    
    await SystemUI.setStatusBarBackgroundColorAsync('transparent');
    await SystemUI.setStatusBarStyleAsync('light-content');
    await SystemUI.setStatusBarVisibilityAsync('visible');
    
    console.log('✅ 状态栏透明设置完成');
  } catch (error) {
    console.log('❌ 状态栏透明设置失败:', error);
  }
}

/**
 * 专门设置Android底部导航栏完全透明
 * 使用新版本SDK的增强功能
 */
export async function setupBottomNavigationTransparent() {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    console.log('🔄 设置Android底部导航栏完全透明 (SDK 54.0.10)');
    
    // 新方法1: 使用新版本SDK的增强透明支持
    await NavigationBar.setPositionAsync('absolute');
    
    // 新方法2: 使用更精确的透明值
    const transparentColors = [
      '#00000000', // 完全透明 ARGB
      'transparent', // CSS透明
      'rgba(0,0,0,0)', // RGBA透明
      '#00FFFFFF', // 白色透明
      '#00000001', // 几乎透明
      '#0000000A', // 极低透明度
    ];
    
    // 尝试设置完全透明
    for (const color of transparentColors) {
      try {
        await NavigationBar.setBackgroundColorAsync(color);
        console.log(`✅ 设置透明背景: ${color}`);
        // 给每个设置一点时间生效
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.log(`❌ 设置透明背景失败: ${color}`, error);
      }
    }
    
    // 新方法3: 使用新版本的行为设置
    await NavigationBar.setBehaviorAsync('overlay-swipe');
    await NavigationBar.setVisibilityAsync('visible');
    
    // 新方法4: 设置按钮样式为深色（适合透明背景）
    await NavigationBar.setButtonStyleAsync('dark');
    
    // 新方法5: 尝试设置边框为透明
    try {
      await NavigationBar.setBorderColorAsync('#00000000');
    } catch (error) {
      console.log('⚠️ 设置边框颜色失败（可能不支持）:', error);
    }
    
    // 新方法6: 延迟再次尝试设置透明
    setTimeout(async () => {
      try {
        await NavigationBar.setBackgroundColorAsync('#00000000');
        console.log('🔄 延迟设置完全透明背景');
      } catch (error) {
        console.log('❌ 延迟设置透明背景失败:', error);
      }
    }, 500);
    
    console.log('✅ Android底部导航栏完全透明设置完成 (SDK 54.0.10)');
  } catch (error) {
    console.log('❌ Android底部导航栏透明设置失败:', error);
  }
}

/**
 * 将Android底部系统导航栏背景设置为指定颜色
 * 用于与应用底部栏背景保持一致
 */
export async function setBottomNavigationBarColor(color: string) {
  if (Platform.OS !== 'android') {
    return;
  }
  try {
    console.log(`🎨 设置Android底部导航栏颜色: ${color}`);
    
    // 设置位置为absolute以启用edge-to-edge模式
    await NavigationBar.setPositionAsync('absolute');
    
    // 设置背景颜色
    await NavigationBar.setBackgroundColorAsync(color);
    
    // 确保导航栏可见
    await NavigationBar.setVisibilityAsync('visible');
    
    // 设置按钮样式（根据背景颜色自动选择）
    const isLightColor = color === '#ffffff' || color === '#fffbff' || color === '#FFFBFE' || color.startsWith('#fff');
    await NavigationBar.setButtonStyleAsync(isLightColor ? 'dark' : 'light');
    
    // 设置交互行为
    await NavigationBar.setBehaviorAsync('overlay-swipe');
    
    console.log('✅ Android底部导航栏颜色设置完成');
  } catch (error) {
    console.log('❌ 设置底部导航栏颜色失败:', error);
  }
}

/**
 * 完整的透明UI设置
 */
export async function setupTransparentUI() {
  if (Platform.OS === 'web') {
    console.log('🌐 Web平台跳过SystemUI设置');
    return;
  }

  try {
    console.log('🔄 开始透明UI设置');
    
    // 设置状态栏
    await setupStatusBarTransparent();
    
    // 设置底部导航栏（仅Android）
    if (Platform.OS === 'android') {
      await setupBottomNavigationTransparent();
    }
    
    console.log('✅ 透明UI设置完成');
  } catch (error) {
    console.log('❌ 透明UI设置失败:', error);
  }
}

/**
 * 新版本SDK的增强透明设置
 */
export async function setupEnhancedTransparentUI() {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    console.log('🚀 使用新版本SDK增强透明设置');
    
    // 设置状态栏
    await setupStatusBarTransparent();
    
    if (Platform.OS === 'android') {
      // 使用新版本的增强方法
      await setupBottomNavigationTransparent();
      
      // 额外的延迟设置，确保完全透明
      setTimeout(async () => {
        try {
          await NavigationBar.setBackgroundColorAsync('#00000000');
          await NavigationBar.setPositionAsync('absolute');
          console.log('🔄 最终透明设置完成');
        } catch (error) {
          console.log('❌ 最终透明设置失败:', error);
        }
      }, 2000);
    }
    
    console.log('✅ 增强透明UI设置完成');
  } catch (error) {
    console.log('❌ 增强透明UI设置失败:', error);
  }
}

/**
 * 应用启动时的透明设置
 */
export async function setupAppStartTransparentUI() {
  if (Platform.OS === 'web') {
    return;
  }
  
  // 使用新的增强方法
  await setupEnhancedTransparentUI();
  
  // 延迟执行确保底部导航栏生效
  setTimeout(async () => {
    if (Platform.OS === 'android') {
      await setupBottomNavigationTransparent();
    }
  }, 1000);
}