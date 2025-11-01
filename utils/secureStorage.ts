import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * 安全存储工具类
 * 在开发环境使用 SecureStore，生产环境使用 AsyncStorage
 */
class SecureStorage {
  private static instance: SecureStorage;
  private isDevelopment: boolean;

  private constructor() {
    // 判断是否为开发环境
    this.isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
  }

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  /**
   * 存储数据
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isDevelopment && Platform.OS !== 'web') {
        // 开发环境使用 SecureStore
        await SecureStore.setItemAsync(key, value);
        console.log(`🔐 [SecureStore] 存储成功: ${key}`);
      } else {
        // 生产环境使用 AsyncStorage
        await AsyncStorage.setItem(key, value);
        console.log(`💾 [AsyncStorage] 存储成功: ${key}`);
      }
    } catch (error) {
      console.error(`❌ 存储失败 [${key}]:`, error);
      throw error;
    }
  }

  /**
   * 获取数据
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isDevelopment && Platform.OS !== 'web') {
        // 开发环境使用 SecureStore
        const value = await SecureStore.getItemAsync(key);
        console.log(`🔐 [SecureStore] 获取成功: ${key}`, value ? '有数据' : '无数据');
        return value;
      } else {
        // 生产环境使用 AsyncStorage
        const value = await AsyncStorage.getItem(key);
        console.log(`💾 [AsyncStorage] 获取成功: ${key}`, value ? '有数据' : '无数据');
        return value;
      }
    } catch (error) {
      console.error(`❌ 获取失败 [${key}]:`, error);
      return null;
    }
  }

  /**
   * 删除数据
   */
  async removeItem(key: string): Promise<void> {
    try {
      if (this.isDevelopment && Platform.OS !== 'web') {
        // 开发环境使用 SecureStore
        await SecureStore.deleteItemAsync(key);
        console.log(`🔐 [SecureStore] 删除成功: ${key}`);
      } else {
        // 生产环境使用 AsyncStorage
        await AsyncStorage.removeItem(key);
        console.log(`💾 [AsyncStorage] 删除成功: ${key}`);
      }
    } catch (error) {
      console.error(`❌ 删除失败 [${key}]:`, error);
      throw error;
    }
  }

  /**
   * 清除所有数据
   */
  async clear(): Promise<void> {
    try {
      if (this.isDevelopment && Platform.OS !== 'web') {
        // SecureStore 没有 clear 方法，需要手动删除
        console.log(`🔐 [SecureStore] 无法批量清除，请手动删除`);
      } else {
        // 生产环境使用 AsyncStorage
        await AsyncStorage.clear();
        console.log(`💾 [AsyncStorage] 清除成功`);
      }
    } catch (error) {
      console.error(`❌ 清除失败:`, error);
      throw error;
    }
  }

  /**
   * 检查是否支持安全存储
   */
  isAvailable(): boolean {
    if (this.isDevelopment && Platform.OS !== 'web') {
      return SecureStore.isAvailableAsync();
    }
    return true; // AsyncStorage 总是可用的
  }
}

export default SecureStorage.getInstance();
