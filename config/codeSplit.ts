/**
 * 代码分割配置
 * 定义应用的代码分割策略
 */

export interface CodeSplitConfig {
  // 页面级别的代码分割
  pages: {
    [key: string]: {
      chunk: string;
      priority: 'high' | 'medium' | 'low';
      preload: boolean;
      dependencies?: string[];
    };
  };
  
  // 组件级别的代码分割
  components: {
    [key: string]: {
      chunk: string;
      lazy: boolean;
      preload: boolean;
    };
  };
  
  // 第三方库的分割
  vendors: {
    [key: string]: {
      chunk: string;
      priority: 'high' | 'medium' | 'low';
    };
  };
}

export const codeSplitConfig: CodeSplitConfig = {
  pages: {
    // 核心页面 - 高优先级
    'betting': {
      chunk: 'core',
      priority: 'high',
      preload: true,
    },
    'wallet': {
      chunk: 'core',
      priority: 'high',
      preload: true,
    },
    'discover': {
      chunk: 'core',
      priority: 'high',
      preload: true,
    },
    'profile': {
      chunk: 'core',
      priority: 'high',
      preload: true,
    },
    
    // 功能页面 - 中优先级
    'football-calculator': {
      chunk: 'features',
      priority: 'medium',
      preload: true,
      dependencies: ['discover'],
    },
    'scheme-betting': {
      chunk: 'features',
      priority: 'medium',
      preload: true,
      dependencies: ['betting'],
    },
    'orders': {
      chunk: 'features',
      priority: 'medium',
      preload: true,
      dependencies: ['betting'],
    },
    'red-trend': {
      chunk: 'features',
      priority: 'medium',
      preload: true,
      dependencies: ['betting'],
    },
    'claim-management': {
      chunk: 'features',
      priority: 'medium',
      preload: true,
      dependencies: ['betting'],
    },
    
    // 工具页面 - 低优先级
    'football-matches': {
      chunk: 'utils',
      priority: 'low',
      preload: false,
      dependencies: ['discover'],
    },
    'calculator-orders': {
      chunk: 'utils',
      priority: 'low',
      preload: false,
      dependencies: ['discover'],
    },
    'edit-profile': {
      chunk: 'utils',
      priority: 'low',
      preload: false,
      dependencies: ['profile'],
    },
    'invite-friends': {
      chunk: 'utils',
      priority: 'low',
      preload: false,
      dependencies: ['profile'],
    },
    'security-settings': {
      chunk: 'utils',
      priority: 'low',
      preload: false,
      dependencies: ['profile'],
    },
    'betting-strategy': {
      chunk: 'utils',
      priority: 'low',
      preload: false,
      dependencies: ['profile'],
    },
    'cache-management': {
      chunk: 'utils',
      priority: 'low',
      preload: false,
      dependencies: ['profile'],
    },
    'address-management': {
      chunk: 'utils',
      priority: 'low',
      preload: false,
      dependencies: ['profile'],
    },
    'add-edit-address': {
      chunk: 'utils',
      priority: 'low',
      preload: false,
      dependencies: ['profile'],
    },
    
    // 钱包相关页面
    'transactions': {
      chunk: 'wallet',
      priority: 'medium',
      preload: true,
      dependencies: ['wallet'],
    },
    'transaction-detail': {
      chunk: 'wallet',
      priority: 'low',
      preload: false,
      dependencies: ['wallet', 'transactions'],
    },
    'recharge': {
      chunk: 'wallet',
      priority: 'medium',
      preload: true,
      dependencies: ['wallet'],
    },
    'withdraw': {
      chunk: 'wallet',
      priority: 'medium',
      preload: true,
      dependencies: ['wallet'],
    },
    'withdraw-onchain': {
      chunk: 'wallet',
      priority: 'low',
      preload: false,
      dependencies: ['wallet'],
    },
    'transfer-internal': {
      chunk: 'wallet',
      priority: 'low',
      preload: false,
      dependencies: ['wallet'],
    },
  },
  
  components: {
    // 重构后的组件
    'football-calculator': {
      chunk: 'components',
      lazy: true,
      preload: true,
    },
    'betting-screen': {
      chunk: 'components',
      lazy: true,
      preload: true,
    },
    
    // 通用组件
    'loading-spinner': {
      chunk: 'common',
      lazy: false,
      preload: true,
    },
    'error-boundary': {
      chunk: 'common',
      lazy: false,
      preload: true,
    },
    'optimized-image': {
      chunk: 'common',
      lazy: true,
      preload: true,
    },
    'optimized-flat-list': {
      chunk: 'common',
      lazy: true,
      preload: true,
    },
    'optimized-scroll-view': {
      chunk: 'common',
      lazy: true,
      preload: true,
    },
  },
  
  vendors: {
    // React相关
    'react': {
      chunk: 'vendor-react',
      priority: 'high',
    },
    'react-native': {
      chunk: 'vendor-react',
      priority: 'high',
    },
    'react-native-paper': {
      chunk: 'vendor-ui',
      priority: 'high',
    },
    
    // 导航相关
    'expo-router': {
      chunk: 'vendor-navigation',
      priority: 'high',
    },
    '@react-navigation/native': {
      chunk: 'vendor-navigation',
      priority: 'high',
    },
    
    // 工具库
    'expo-crypto': {
      chunk: 'vendor-utils',
      priority: 'medium',
    },
    'expo-secure-store': {
      chunk: 'vendor-utils',
      priority: 'medium',
    },
    'expo-file-system': {
      chunk: 'vendor-utils',
      priority: 'low',
    },
  },
};

// 获取页面的代码分割配置
export function getPageConfig(pageName: string) {
  return codeSplitConfig.pages[pageName];
}

// 获取组件的代码分割配置
export function getComponentConfig(componentName: string) {
  return codeSplitConfig.components[componentName];
}

// 获取第三方库的代码分割配置
export function getVendorConfig(vendorName: string) {
  return codeSplitConfig.vendors[vendorName];
}

// 获取高优先级页面列表
export function getHighPriorityPages(): string[] {
  return Object.entries(codeSplitConfig.pages)
    .filter(([_, config]) => config.priority === 'high')
    .map(([pageName, _]) => pageName);
}

// 获取需要预加载的页面列表
export function getPreloadPages(): string[] {
  return Object.entries(codeSplitConfig.pages)
    .filter(([_, config]) => config.preload)
    .map(([pageName, _]) => pageName);
}

// 获取页面的依赖关系
export function getPageDependencies(pageName: string): string[] {
  const config = getPageConfig(pageName);
  return config?.dependencies || [];
}

// 获取所有依赖页面
export function getAllDependencies(pageName: string): string[] {
  const dependencies = new Set<string>();
  const visited = new Set<string>();
  
  function collectDeps(page: string) {
    if (visited.has(page)) return;
    visited.add(page);
    
    const deps = getPageDependencies(page);
    deps.forEach(dep => {
      dependencies.add(dep);
      collectDeps(dep);
    });
  }
  
  collectDeps(pageName);
  return Array.from(dependencies);
}
