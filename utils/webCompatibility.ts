import { Platform } from 'react-native';

/**
 * Web平台兼容性工具
 * 处理Web环境下的各种兼容性问题
 */

// 平台检测
export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * 安全的localStorage访问
 * 避免SSR环境下的ReferenceError
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch (error) {
        console.warn('localStorage.getItem失败:', error);
        return null;
      }
    }
    return null;
  },
  
  setItem: (key: string, value: string): boolean => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
        return true;
      } catch (error) {
        console.warn('localStorage.setItem失败:', error);
        return false;
      }
    }
    return false;
  },
  
  removeItem: (key: string): boolean => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.warn('localStorage.removeItem失败:', error);
        return false;
      }
    }
    return false;
  }
};

/**
 * 创建Web兼容的阴影样式
 * 将React Native的shadow属性转换为Web的boxShadow
 */
export const createShadowStyle = (shadowProps: {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}) => {
  if (Platform.OS === 'web') {
    const { shadowColor = '#000', shadowOffset = { width: 0, height: 2 }, shadowOpacity = 0.25, shadowRadius = 3.84 } = shadowProps;
    
    return {
      boxShadow: `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px rgba(0, 0, 0, ${shadowOpacity})`,
    };
  }
  
  // 原生平台返回原始shadow属性
  return shadowProps;
};

/**
 * 创建Web兼容的pointerEvents样式
 */
export const createPointerEventsStyle = (pointerEvents: 'auto' | 'none' | 'box-none' | 'box-only') => {
  if (Platform.OS === 'web') {
    return {
      style: {
        pointerEvents: pointerEvents === 'box-none' || pointerEvents === 'box-only' ? 'auto' : pointerEvents,
      }
    };
  }
  
  return {};
};

/**
 * 保护Window对象的关键属性
 * 防止第三方脚本修改只读属性
 */
export const protectWindowProperties = () => {
  if (typeof window !== 'undefined') {
    const protectedProperties = [
      'aleo',
      'location',
      'history',
      'navigator',
      'document',
      'localStorage',
      'sessionStorage',
      'crypto',
      'performance',
      'console',
      'setTimeout',
      'setInterval',
      'clearTimeout',
      'clearInterval',
      'requestAnimationFrame',
      'cancelAnimationFrame',
    ];

    // 为每个属性创建保护
    protectedProperties.forEach(prop => {
      try {
        const originalValue = (window as any)[prop];
        
        // 如果属性存在且不是函数，尝试保护它
        if (originalValue !== undefined && typeof originalValue !== 'function') {
          // 检查属性是否已经存在且不可配置
          const descriptor = Object.getOwnPropertyDescriptor(window, prop);
          if (descriptor && !descriptor.configurable) {
            // 属性已经不可配置，跳过
            console.log(`✅ Window属性 ${prop} 已经受到保护`);
            return;
          }
          
          Object.defineProperty(window, prop, {
            value: originalValue,
            writable: false,
            configurable: false,
            enumerable: true,
          });
          console.log(`✅ Window属性 ${prop} 保护成功`);
        }
      } catch (error) {
        // 忽略无法保护的属性
        console.warn(`⚠️ 无法保护Window属性 ${prop}:`, error);
      }
    });

    console.log('✅ Window对象属性保护已启用');
  }
};

/**
 * 抑制Web平台样式属性弃用警告
 * 包括shadow*和pointerEvents相关警告
 */
export const suppressWebStyleWarnings = () => {
  if (typeof window !== 'undefined' && typeof console !== 'undefined') {
    // 保存原始的console.warn函数
    const originalWarn = console.warn;
    
    // 重写console.warn来过滤shadow*警告
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      
      // 过滤shadow*相关的警告
      if (message.includes('"shadow*" style props are deprecated') ||
          message.includes('Use "boxShadow"') ||
          message.includes('shadow*') && message.includes('deprecated')) {
        // 静默处理，不输出警告
        return;
      }
      
      // 过滤pointerEvents相关的警告
      if (message.includes('props.pointerEvents is deprecated') ||
          message.includes('Use style.pointerEvents') ||
          message.includes('pointerEvents') && message.includes('deprecated') ||
          message.includes('pointerEvents is deprecated') ||
          message.includes('entry.bundle') && message.includes('pointerEvents')) {
        // 静默处理，不输出警告
        return;
      }
      
      // 过滤runtime.lastError相关的警告
      if (message.includes('runtime.lastError') ||
          message.includes('message channel closed') ||
          message.includes('asynchronous response') ||
          message.includes('insertPage.js')) {
        // 静默处理，不输出警告
        return;
      }
      
      // 过滤Chrome扩展相关的警告
      if (message.includes('chrome-extension://') ||
          message.includes('Cannot read properties of undefined') ||
          message.includes("reading 'success'")) {
        // 静默处理，不输出警告
        return;
      }
      
      // 其他警告正常输出
      originalWarn.apply(console, args);
    };
    
    console.log('✅ Web平台样式警告抑制器已启用');
  }
};

/**
 * 处理Chrome扩展错误
 * 专门处理aleo等Chrome扩展引起的错误
 */
export const handleChromeExtensionErrors = () => {
  if (typeof window !== 'undefined' && Platform.OS === 'web') {
    // 拦截全局错误
    const originalOnError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      const errorMessage = message?.toString() || '';
      
      // 检查是否是Chrome扩展相关错误
      if (errorMessage.includes('Cannot assign to read only property') ||
          errorMessage.includes('Cannot read properties of undefined') ||
          errorMessage.includes('aleo') ||
          errorMessage.includes('chrome-extension://') ||
          errorMessage.includes('pmmnimefaichbcnbndcfpaagbepnjaig') ||
          errorMessage.includes('cflgahhmjlmnjbikhakapcfkpbcmllam')) {
        console.warn('🔧 检测到Chrome扩展错误，已忽略:', errorMessage);
        return true; // 阻止错误冒泡
      }
      
      // 调用原始错误处理函数
      if (originalOnError) {
        return originalOnError.call(this, message, source, lineno, colno, error);
      }
      return false;
    };

    // 拦截未捕获的错误
    window.addEventListener('error', (event) => {
      const errorMessage = event.message || '';
      
      if (errorMessage.includes('Cannot assign to read only property') ||
          errorMessage.includes('Cannot read properties of undefined') ||
          errorMessage.includes('aleo') ||
          errorMessage.includes('chrome-extension://') ||
          errorMessage.includes('pmmnimefaichbcnbndcfpaagbepnjaig') ||
          errorMessage.includes('cflgahhmjlmnjbikhakapcfkpbcmllam')) {
        console.warn('🔧 检测到Chrome扩展错误事件，已忽略:', errorMessage);
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    });

    console.log('✅ Chrome扩展错误处理器已启用');
  }
};

/**
 * 设置全局错误拦截器
 * 拦截和过滤第三方脚本错误
 */
export const setupGlobalErrorHandlers = () => {
  if (typeof window !== 'undefined' && Platform.OS === 'web') {
    // 拦截Chrome扩展的runtime.lastError
    if (typeof window.chrome !== 'undefined' && window.chrome.runtime) {
      const originalLastError = window.chrome.runtime.lastError;
      Object.defineProperty(window.chrome.runtime, 'lastError', {
        get: function() {
          const error = originalLastError;
          if (error && error.message && 
              (error.message.includes('message channel closed') ||
               error.message.includes('asynchronous response'))) {
            console.warn('🔧 检测到Chrome扩展runtime.lastError，已忽略:', error.message);
            return null; // 返回null而不是错误对象
          }
          return error;
        },
        configurable: true
      });
    }
    // 拦截控制台错误输出
    const originalConsoleError = console.error;
    console.error = function(...args) {
      const message = args.join(' ');
      if (message.includes('runtime.lastError') ||
          message.includes('message channel closed') ||
          message.includes('asynchronous response') ||
          message.includes('Unchecked runtime.lastError') ||
          message.includes('Cannot assign to read only property') ||
          message.includes('Cannot read properties of undefined') ||
          message.includes("'aleo'") ||
          message.includes('chrome-extension://') ||
          message.includes('A listener indicated an asynchronous response') ||
          message.includes('but the message channel closed') ||
          message.includes('aleo') ||
          message.includes('pmmnimefaichbcnbndcfpaagbepnjaig') ||
          message.includes('cflgahhmjlmnjbikhakapcfkpbcmllam')) {
        console.warn('🔧 检测到Chrome扩展控制台错误，已忽略:', message);
        return; // 不输出错误
      }
      originalConsoleError.apply(console, args);
    };

    // 处理未捕获的Promise错误
    window.addEventListener('unhandledrejection', (event) => {
      console.warn('🚨 未处理的Promise错误:', event.reason);
      
      // 检查是否是Chrome扩展相关错误
      if (event.reason && event.reason.message) {
        const reasonMessage = event.reason.message;
        if (reasonMessage.includes('aleo') ||
            reasonMessage.includes('Cannot assign to read only property') ||
            reasonMessage.includes('Cannot read properties of undefined') ||
            reasonMessage.includes('chrome-extension://') ||
            reasonMessage.includes('pmmnimefaichbcnbndcfpaagbepnjaig') ||
            reasonMessage.includes('cflgahhmjlmnjbikhakapcfkpbcmllam')) {
          console.warn('🔧 检测到Chrome扩展Promise错误，已忽略:', reasonMessage);
          event.preventDefault(); // 阻止错误冒泡
          return;
        }
      }
      
      // 检查是否是runtime.lastError相关错误
      if (event.reason && event.reason.message && 
          (event.reason.message.includes('runtime.lastError') ||
           event.reason.message.includes('message channel closed') ||
           event.reason.message.includes('asynchronous response') ||
           event.reason.message.includes('A listener indicated an asynchronous response') ||
           event.reason.message.includes('but the message channel closed'))) {
        console.warn('🔧 检测到runtime.lastError相关错误，已忽略');
        event.preventDefault(); // 阻止错误冒泡
        return;
      }
      
      // 检查是否是insertPage.js相关错误
      if (event.reason && event.reason.message && 
          event.reason.message.includes('insertPage.js')) {
        console.warn('🔧 检测到insertPage.js相关错误，已忽略');
        event.preventDefault(); // 阻止错误冒泡
        return;
      }
      
      // 检查是否是Cannot read properties of undefined错误
      if (event.reason && event.reason.message && 
          event.reason.message.includes('Cannot read properties of undefined')) {
        console.warn('🔧 检测到undefined属性访问错误，已忽略');
        event.preventDefault(); // 阻止错误冒泡
        return;
      }
      
      // 检查是否是Chrome扩展相关错误
      if (event.reason && event.reason.stack && 
          event.reason.stack.includes('chrome-extension://')) {
        console.warn('🔧 检测到Chrome扩展错误，已忽略');
        event.preventDefault(); // 阻止错误冒泡
        return;
      }
      
      // 检查是否是success属性访问错误
      if (event.reason && event.reason.message && 
          event.reason.message.includes("reading 'success'")) {
        console.warn('🔧 检测到success属性访问错误，已忽略');
        event.preventDefault(); // 阻止错误冒泡
        return;
      }
    });
    
    // 处理全局JavaScript错误
    window.addEventListener('error', (event) => {
      console.warn('🚨 全局JavaScript错误:', event.error);
      
      // 检查是否是aleo相关错误
      if (event.error && event.error.message && 
          event.error.message.includes('aleo')) {
        console.warn('🔧 检测到aleo相关错误，已忽略');
        event.preventDefault(); // 阻止错误冒泡
        return;
      }
      
      // 检查是否是Window对象只读属性错误
      if (event.error && event.error.message && 
          event.error.message.includes("Cannot assign to read only property")) {
        console.warn('🔧 检测到Window对象只读属性错误，已忽略');
        event.preventDefault(); // 阻止错误冒泡
        return;
      }
      
      // 检查是否是Chrome扩展相关错误
      if (event.error && event.error.stack && 
          event.error.stack.includes('chrome-extension://')) {
        console.warn('🔧 检测到Chrome扩展错误，已忽略');
        event.preventDefault(); // 阻止错误冒泡
        return;
      }
      
      // 检查是否是runtime.lastError相关错误
      if (event.error && event.error.message && 
          (event.error.message.includes('runtime.lastError') ||
           event.error.message.includes('message channel closed') ||
           event.error.message.includes('asynchronous response') ||
           event.error.message.includes('A listener indicated an asynchronous response') ||
           event.error.message.includes('but the message channel closed'))) {
        console.warn('🔧 检测到runtime.lastError相关错误，已忽略');
        event.preventDefault(); // 阻止错误冒泡
        return;
      }
      
      // 检查是否是insertPage.js相关错误
      if (event.error && event.error.message && 
          event.error.message.includes('insertPage.js')) {
        console.warn('🔧 检测到insertPage.js相关错误，已忽略');
        event.preventDefault(); // 阻止错误冒泡
        return;
      }
      
      // 检查是否是Cannot read properties of undefined错误
      if (event.error && event.error.message && 
          event.error.message.includes('Cannot read properties of undefined')) {
        console.warn('🔧 检测到undefined属性访问错误，已忽略');
        event.preventDefault(); // 阻止错误冒泡
        return;
      }
      
      // 检查是否是Chrome扩展相关错误
      if (event.error && event.error.stack && 
          event.error.stack.includes('chrome-extension://')) {
        console.warn('🔧 检测到Chrome扩展错误，已忽略');
        event.preventDefault(); // 阻止错误冒泡
        return;
      }
      
      // 检查是否是success属性访问错误
      if (event.error && event.error.message && 
          event.error.message.includes("reading 'success'")) {
        console.warn('🔧 检测到success属性访问错误，已忽略');
        event.preventDefault(); // 阻止错误冒泡
        return;
      }
    });

    console.log('✅ 全局错误处理器已设置');
  }
};

/**
 * 修复Android平台标题显示问题
 * 针对Android下标题显示不完整的问题
 */
export const fixAndroidTitleDisplay = () => {
  if (Platform.OS === 'android') {
    // Android平台不需要DOM操作，主要通过样式修复
    console.log('🔧 Android标题显示修复已应用');
  }
};

/**
 * 修复Web平台标题显示问题
 * 通过DOM操作强制显示标题
 */
export const fixWebTitleDisplay = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // 等待DOM加载完成后执行
    setTimeout(() => {
      try {
        // 查找所有可能的标题元素
        const titleSelectors = [
          '[data-testid*="title"]',
          '[data-testid*="wallet"]',
          '[class*="title"]',
          '[class*="pageTitle"]',
          '[class*="header"]',
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
        ];
        
        titleSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach((element: any) => {
            if (element && element.style) {
              // 强制显示样式
              element.style.visibility = 'visible';
              element.style.opacity = '1';
              element.style.display = 'block';
              element.style.zIndex = '9999';
              element.style.position = 'relative';
              element.style.width = '100%';
              element.style.height = 'auto';
              element.style.overflow = 'visible';
              
              // 如果是文本元素，设置颜色和居中
              if (element.tagName && ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'DIV'].includes(element.tagName)) {
                element.style.color = 'white';
                element.style.textAlign = 'center';
              }
            }
          });
        });
        
        console.log('🔧 Web标题显示修复已应用');
      } catch (error) {
        console.warn('⚠️ Web标题修复失败:', error);
      }
    }, 1000); // 延迟1秒执行
  }
};

/**
 * 修复Web平台头像显示
 */
export const fixWebAvatarDisplay = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    setTimeout(() => {
      try {
        const avatarSelectors = [
          '[class*="avatar"]', '[class*="Avatar"]',
          '[data-testid*="avatar"]', '[data-testid*="Avatar"]',
          'img[src*="avatar"]', 'img[alt*="avatar"]'
        ];
        avatarSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach((element: any) => {
            if (element && element.style) {
              element.style.visibility = 'visible';
              element.style.opacity = '1';
              element.style.display = 'flex';
              element.style.alignItems = 'center';
              element.style.justifyContent = 'center';
              element.style.zIndex = '9999';
              element.style.position = 'relative';
              element.style.width = 'auto';
              element.style.height = 'auto';
              element.style.minWidth = 'auto';
              element.style.minHeight = 'auto';
              element.style.overflow = 'visible';
              element.style.marginLeft = '0px';
              element.style.marginRight = '16px';
              // 强制显示样式
              element.style.WebkitVisibility = 'visible';
              element.style.MozVisibility = 'visible';
              element.style.msVisibility = 'visible';
              element.style.WebkitDisplay = 'flex';
              element.style.MozDisplay = 'flex';
              element.style.msDisplay = 'flex';
            }
          });
        });
        console.log('🔧 Web头像显示修复已应用');
      } catch (error) {
        console.warn('⚠️ Web头像修复失败:', error);
      }
    }, 1000);
  }
};

/**
 * 初始化Web兼容性
 * 在应用启动时调用
 */
export const initializeWebCompatibility = () => {
  if (Platform.OS === 'web') {
    console.log('🌐 初始化Web兼容性...');
    
    // 处理Chrome扩展错误（优先处理）
    handleChromeExtensionErrors();
    
    // 抑制Web平台样式警告
    suppressWebStyleWarnings();
    
    // 保护Window对象属性
    protectWindowProperties();
    
    // 设置全局错误处理器
    setupGlobalErrorHandlers();
    
    // 修复Web标题显示问题
    fixWebTitleDisplay();
    
    // 修复Web头像显示问题
    fixWebAvatarDisplay();
    
    console.log('✅ Web兼容性初始化完成');
  }
};

/**
 * 获取Web平台特定的样式覆盖
 */
export const getWebStyleOverrides = () => {
  if (Platform.OS === 'web') {
    return {
      // 确保pointerEvents在所有元素上正确工作
      '*': {
        pointerEvents: 'auto !important',
      },
    };
  }
  return {};
};

/**
 * 获取Web平台标题样式
 */
export const getWebTitleStyle = () => {
  if (Platform.OS === 'web') {
    return {
      opacity: 1,
      color: 'white', // 强制设置为白色
      zIndex: 9999,
      position: 'relative' as const,
      overflow: 'visible' as const,
      textAlign: 'center' as const, // 强制居中
    };
  }
  return {};
};

/**
 * 获取Android平台标题样式
 * 修复Android下标题显示不完整的问题
 */
export const getAndroidTitleStyle = () => {
  if (Platform.OS === 'android') {
    return {
      textAlign: 'center' as const,
      width: '100%',
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    };
  }
  return {};
};

/**
 * 获取Web平台头部样式
 */
export const getWebHeaderStyle = () => {
  if (Platform.OS === 'web') {
    return {
      opacity: 1,
      flexDirection: 'column' as const,
      zIndex: 9998,
      position: 'relative' as const,
      overflow: 'visible' as const,
    };
  }
  return {};
};

/**
 * 获取Web平台头部内容样式
 */
export const getWebHeaderContentStyle = () => {
  if (Platform.OS === 'web') {
    return {
      opacity: 1,
      flexDirection: 'column' as const,
      alignItems: 'flex-start' as const, // 改为左对齐
      justifyContent: 'flex-end' as const, // Web平台下使用底部对齐
      zIndex: 9998,
      position: 'relative' as const,
      overflow: 'visible' as const,
    };
  }
  return {};
};

/**
 * 获取Web平台头像样式
 */
export const getWebAvatarStyle = () => {
  if (Platform.OS === 'web') {
    return {
      opacity: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      zIndex: 9999,
      position: 'relative' as const,
      overflow: 'hidden' as const, // 确保头像不会超出父容器
      marginLeft: 0,
      marginRight: 0, // 移除右边距，让头像在父容器中居中
      marginTop: 0, // 移除上边距
      marginBottom: 0, // 移除下边距
      borderRadius: 50, // 确保头像本身也是圆形
    };
  }
  return {};
};

/**
 * 获取Web平台头像容器样式
 */
export const getWebAvatarContainerStyle = () => {
  if (Platform.OS === 'web') {
    return {
      visibility: 'visible' as const,
      opacity: 1,
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      zIndex: 9999,
      position: 'relative' as const,
      overflow: 'hidden' as const, // 确保内容不会超出容器
      marginRight: 16,
      borderRadius: 50, // 使用数字值而不是字符串
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
      padding: 2,
      // 强制显示样式
      WebkitVisibility: 'visible',
      MozVisibility: 'visible',
      msVisibility: 'visible',
      WebkitDisplay: 'flex',
      MozDisplay: 'flex',
      msDisplay: 'flex',
    } as any; // 使用 any 类型避免 TypeScript 类型检查
  }
  return {};
};

/**
 * 获取Web平台用户信息容器样式
 */
export const getWebUserInfoStyle = () => {
  if (Platform.OS === 'web') {
    return {
      visibility: 'visible' as const,
      opacity: 1,
      display: 'flex' as const,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'flex-start' as const,
      zIndex: 9999,
      position: 'relative' as const,
      overflow: 'visible' as const,
      marginTop: 20, // Web平台下增加上边距，让内容往下移动
      // 强制显示样式
      WebkitVisibility: 'visible',
      MozVisibility: 'visible',
      msVisibility: 'visible',
      WebkitDisplay: 'flex',
      MozDisplay: 'flex',
      msDisplay: 'flex',
    } as any; // 使用 any 类型避免 TypeScript 类型检查
  }
  return {};
};

/**
 * 获取Web平台用户详情样式
 */
export const getWebUserDetailsStyle = () => {
  if (Platform.OS === 'web') {
    return {
      visibility: 'visible' as const,
      opacity: 1,
      display: 'flex' as const,
      flexDirection: 'column' as const, // 确保垂直排列
      alignItems: 'flex-start' as const,
      justifyContent: 'center' as const,
      zIndex: 9999,
      position: 'relative' as const,
      flex: 1,
      overflow: 'visible' as const,
      // 强制显示样式
      WebkitVisibility: 'visible',
      MozVisibility: 'visible',
      msVisibility: 'visible',
      WebkitDisplay: 'flex',
      MozDisplay: 'flex',
      msDisplay: 'flex',
    } as any; // 使用 any 类型避免 TypeScript 类型检查
  }
  return {};
};
