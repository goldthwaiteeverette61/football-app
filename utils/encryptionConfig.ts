import AsyncStorage from '@react-native-async-storage/async-storage';

// 加密配置存储键
const ENCRYPTION_CONFIG_KEY = 'encryption_config';

// 加密配置接口
interface EncryptionConfig {
  publicKey: string;
  privateKey: string;
  algorithm: string;
  enabled: boolean;
}

// 默认加密配置
const DEFAULT_CONFIG: EncryptionConfig = {
  publicKey: '',
  privateKey: '',
  algorithm: 'RSA',
  enabled: true,
};

/**
 * 获取加密配置
 */
export async function getEncryptionConfig(): Promise<EncryptionConfig> {
  try {
    const stored = await AsyncStorage.getItem(ENCRYPTION_CONFIG_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('获取加密配置失败:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * 保存加密配置
 */
export async function setEncryptionConfig(config: EncryptionConfig): Promise<void> {
  try {
    await AsyncStorage.setItem(ENCRYPTION_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('保存加密配置失败:', error);
  }
}

/**
 * 从服务器获取加密配置
 */
export async function fetchEncryptionConfigFromServer(): Promise<EncryptionConfig> {
  try {
    // 这里应该调用服务器API获取加密配置
    // 暂时返回默认配置
    const response = await fetch('https://api.score.red/app/config/encryption');
    
    if (response.ok) {
      const config = await response.json();
      await setEncryptionConfig(config);
      return config;
    }
    
    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('从服务器获取加密配置失败:', error);
    return DEFAULT_CONFIG;
  }
}

/**
 * 清除加密配置
 */
export async function clearEncryptionConfig(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ENCRYPTION_CONFIG_KEY);
  } catch (error) {
    console.error('清除加密配置失败:', error);
  }
}
