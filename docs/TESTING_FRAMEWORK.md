# 🧪 测试框架文档

## 概述

本项目已搭建完整的测试框架，支持单元测试、集成测试和端到端测试。测试框架基于Jest和React Testing Library，为React Native和Expo项目提供全面的测试支持。

## 🚀 快速开始

### 运行测试

```bash
# 运行所有测试
npm test

# 监听模式运行测试
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# CI环境运行测试
npm run test:ci

# 调试模式运行测试
npm run test:debug
```

### 测试目录结构

```
__tests__/
├── components/           # 组件测试
│   └── LoadingSpinner.test.tsx
├── hooks/               # Hook测试
│   └── useFootballCalculator.test.tsx
├── services/            # 服务测试
│   └── errorService.test.tsx
├── integration/         # 集成测试
│   └── footballCalculator.test.tsx
└── test-utils.tsx      # 测试工具函数
```

## 📋 测试配置

### Jest配置 (jest.config.js)

```javascript
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@expo|expo|@unimodules|unimodules|sentry-expo|native-base|react-navigation|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-gesture-handler|react-native-reanimated|react-native-paper|react-native-vector-icons|react-native-svg|react-native-qrcode-svg|react-native-webview|react-native-view-shot|react-native-worklets)/)',
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '^@hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@contexts/(.*)$': '<rootDir>/contexts/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@constants/(.*)$': '<rootDir>/constants/$1',
    '^@types/(.*)$': '<rootDir>/types/$1',
  },
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'contexts/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/__mocks__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### 全局设置 (jest.global.js)

- 模拟React Native模块
- 模拟Expo模块
- 模拟第三方库
- 设置全局变量和API

### 测试设置 (jest.setup.js)

- 配置React Testing Library
- 自定义匹配器
- 模拟浏览器API
- 测试环境清理

## 🛠️ 测试工具

### 自定义渲染函数

```typescript
import { render } from '../__tests__/test-utils';

// 自动包装PaperProvider和SafeAreaProvider
render(<MyComponent />);
```

### 模拟数据

```typescript
import { mockUser, mockMatch, mockApiResponse } from '../__tests__/test-utils';

// 使用预定义的模拟数据
const user = mockUser;
const match = mockMatch;
```

### API模拟

```typescript
import { mockApiCall, mockApiError, mockFetch } from '../__tests__/test-utils';

// 模拟成功的API调用
mockApiCall({ success: true, data: {} });

// 模拟失败的API调用
mockApiError('Network error');

// 模拟fetch请求
mockFetch({ success: true });
```

### 用户交互模拟

```typescript
import { testUtils } from '../__tests__/test-utils';

// 模拟用户输入
testUtils.mockUserInput(inputElement, 'test text');

// 模拟用户点击
testUtils.mockUserPress(buttonElement);

// 模拟滚动
testUtils.mockScroll(scrollElement, 100);
```

## 📝 测试类型

### 1. 组件测试

测试React组件的渲染、交互和状态变化。

```typescript
import React from 'react';
import { render, screen } from '../__tests__/test-utils';
import { LoadingSpinner } from '@/components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders correctly with default props', () => {
    render(<LoadingSpinner />);
    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
  });

  it('renders with custom text', () => {
    const customText = 'Custom loading text';
    render(<LoadingSpinner text={customText} />);
    expect(screen.getByText(customText)).toBeTruthy();
  });
});
```

### 2. Hook测试

测试自定义Hook的逻辑和状态管理。

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useFootballCalculator } from '@/components/football-calculator/useFootballCalculator';

describe('useFootballCalculator', () => {
  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useFootballCalculator());
    
    expect(result.current.matches).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.activeTab).toBe('spf');
  });

  it('changes active tab correctly', () => {
    const { result } = renderHook(() => useFootballCalculator());
    
    act(() => {
      result.current.setActiveTab('rq');
    });
    
    expect(result.current.activeTab).toBe('rq');
  });
});
```

### 3. 服务测试

测试API服务、工具函数和业务逻辑。

```typescript
import { ErrorService, ErrorSeverity, ErrorType } from '@/services/errorService';

describe('ErrorService', () => {
  let errorService: ErrorService;

  beforeEach(() => {
    errorService = new ErrorService();
  });

  it('正确分类网络错误', () => {
    const networkError = new Error('Network request failed');
    const errorType = errorService['classifyError'](networkError);
    expect(errorType).toBe(ErrorType.NETWORK);
  });

  it('处理API错误', async () => {
    const mockError = new Error('API request failed');
    const mockContext = { screen: 'TestScreen', action: 'test_action' };

    const result = await errorService.handleApiError(mockError, mockContext);

    expect(result).toBeDefined();
    expect(result.type).toBe(ErrorType.API);
    expect(result.severity).toBe(ErrorSeverity.MEDIUM);
  });
});
```

### 4. 集成测试

测试完整的用户流程和组件交互。

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import { FootballCalculatorRefactored } from '@/components/football-calculator/FootballCalculatorRefactored';

describe('足球计算器集成测试', () => {
  it('完整流程：加载比赛 -> 选择投注 -> 提交投注', async () => {
    // 模拟API响应
    const mockMatches = [mockMatch];
    footballCalculatorApi.getMatches.mockResolvedValue({
      success: true,
      data: mockMatches,
    });

    // 渲染组件
    render(<FootballCalculatorRefactored />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('Team A')).toBeTruthy();
    });

    // 选择投注
    const homeWinButton = screen.getByText('主胜');
    fireEvent.press(homeWinButton);

    // 输入金额
    const amountInput = screen.getByPlaceholderText('请输入投注金额');
    fireEvent.changeText(amountInput, '100');

    // 提交投注
    const submitButton = screen.getByText('提交投注');
    fireEvent.press(submitButton);

    // 验证结果
    await waitFor(() => {
      expect(screen.getByText('投注提交成功！')).toBeTruthy();
    });
  });
});
```

## 🎯 测试最佳实践

### 1. 测试命名

```typescript
// ✅ 好的命名
describe('LoadingSpinner', () => {
  it('renders correctly with default props', () => {});
  it('renders with custom text', () => {});
  it('applies custom color', () => {});
});

// ❌ 不好的命名
describe('Component', () => {
  it('test 1', () => {});
  it('test 2', () => {});
});
```

### 2. 测试结构

```typescript
describe('ComponentName', () => {
  // 设置
  beforeEach(() => {
    // 每个测试前的设置
  });

  // 测试用例
  it('should do something when condition', () => {
    // Arrange - 准备
    const props = { testProp: 'value' };
    
    // Act - 执行
    render(<Component {...props} />);
    
    // Assert - 断言
    expect(screen.getByText('expected text')).toBeTruthy();
  });
});
```

### 3. 模拟和存根

```typescript
// 模拟API调用
jest.mock('@/services/api', () => ({
  apiService: {
    getData: jest.fn(),
  },
}));

// 在测试中设置模拟返回值
apiService.getData.mockResolvedValue({ data: 'test' });
```

### 4. 异步测试

```typescript
it('handles async operations', async () => {
  render(<AsyncComponent />);
  
  // 等待异步操作完成
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeTruthy();
  });
});
```

### 5. 错误测试

```typescript
it('handles errors gracefully', async () => {
  // 模拟错误
  mockApiError('Network error');
  
  render(<ErrorComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Error occurred')).toBeTruthy();
  });
});
```

## 📊 覆盖率报告

### 覆盖率阈值

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### 查看覆盖率报告

```bash
npm run test:coverage
```

报告将生成在 `coverage/` 目录中，包含HTML格式的详细报告。

## 🔧 调试测试

### 调试单个测试

```bash
# 运行特定测试文件
npm test -- LoadingSpinner.test.tsx

# 运行特定测试用例
npm test -- --testNamePattern="renders correctly"
```

### 调试模式

```bash
npm run test:debug
```

### 常见问题

1. **模块解析错误**: 检查 `moduleNameMapping` 配置
2. **模拟不生效**: 确保模拟在 `beforeEach` 中重置
3. **异步测试失败**: 使用 `waitFor` 等待异步操作
4. **内存泄漏**: 使用 `--detectOpenHandles` 检测

## 📚 相关资源

- [Jest文档](https://jestjs.io/docs/getting-started)
- [React Testing Library文档](https://testing-library.com/docs/react-native-testing-library/intro)
- [Expo测试指南](https://docs.expo.dev/guides/testing-with-jest/)
- [React Native测试最佳实践](https://reactnative.dev/docs/testing-overview)

## 🎉 总结

测试框架已完全搭建完成，包括：

- ✅ **Jest配置** - 完整的测试环境配置
- ✅ **测试工具** - 自定义渲染函数和模拟数据
- ✅ **组件测试** - LoadingSpinner组件测试示例
- ✅ **Hook测试** - useFootballCalculator Hook测试示例
- ✅ **服务测试** - ErrorService服务测试示例
- ✅ **集成测试** - 足球计算器完整流程测试
- ✅ **测试脚本** - 多种测试运行模式
- ✅ **覆盖率报告** - 代码覆盖率监控
- ✅ **文档** - 完整的测试指南和最佳实践

现在您可以开始编写测试，确保代码质量和应用稳定性！
