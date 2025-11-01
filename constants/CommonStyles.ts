import { StyleSheet } from 'react-native';

/**
 * 通用样式常量
 * 减少重复代码，提高一致性
 */
export const CommonStyles = StyleSheet.create({
  // 容器样式
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  // 滚动视图样式
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  
  // 加载容器样式
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // 空状态容器样式
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  // 错误容器样式
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  // 状态栏背景样式
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  
  // 导航栏背景样式
  navigationBarBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 0,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  
  // 卡片样式
  card: {
    margin: 8,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  
  // 按钮样式
  primaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // 输入框样式
  input: {
    marginVertical: 8,
  },
  
  // 文本样式
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  
  caption: {
    fontSize: 12,
    opacity: 0.7,
  },
  
  // 布局样式
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  column: {
    flexDirection: 'column',
  },
  
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  spaceAround: {
    justifyContent: 'space-around',
  },
  
  // 间距样式
  marginSmall: {
    margin: 8,
  },
  
  marginMedium: {
    margin: 16,
  },
  
  marginLarge: {
    margin: 24,
  },
  
  paddingSmall: {
    padding: 8,
  },
  
  paddingMedium: {
    padding: 16,
  },
  
  paddingLarge: {
    padding: 24,
  },
  
  // 边框样式
  border: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  
  borderRadius: {
    borderRadius: 8,
  },
  
  borderRadiusLarge: {
    borderRadius: 16,
  },
  
  // 阴影样式
  shadow: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  
  shadowLarge: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6.27,
  },
});

/**
 * 通用颜色常量
 */
export const CommonColors = {
  primary: '#1976d2',
  secondary: '#9c27b0',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  
  // 灰度
  white: '#ffffff',
  black: '#000000',
  gray50: '#fafafa',
  gray100: '#f5f5f5',
  gray200: '#eeeeee',
  gray300: '#e0e0e0',
  gray400: '#bdbdbd',
  gray500: '#9e9e9e',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
  
  // 透明色
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

/**
 * 通用尺寸常量
 */
export const CommonSizes = {
  // 间距
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // 字体大小
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  
  // 圆角
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    round: 50,
  },
  
  // 高度
  height: {
    button: 48,
    input: 56,
    card: 80,
    header: 64,
  },
};
