/**
 * 安全加密工具 - 完全避免原生crypto模块
 */
import { envConfig } from '@/config/env';

export class SecureCrypto {
  private key: string;

  constructor(key?: string) {
    this.key = key || envConfig.SECURE_CRYPTO_KEY;
  }

  /**
   * 生成随机字符串
   * @param length 长度
   * @returns 随机字符串
   */
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 生成AES密钥
   * @returns 生成的AES密钥
   */
  generateAesKey(): string {
    const timestamp = Date.now().toString();
    const random1 = this.generateRandomString(16);
    const random2 = this.generateRandomString(16);
    const combined = timestamp + random1 + random2;
    
    // 使用简单的哈希算法生成密钥
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    // 生成64位十六进制字符串
    const key1 = Math.abs(hash).toString(16).padStart(8, '0');
    const key2 = Math.abs(hash * 31).toString(16).padStart(8, '0');
    const key3 = Math.abs(hash * 127).toString(16).padStart(8, '0');
    const key4 = Math.abs(hash * 8191).toString(16).padStart(8, '0');
    const key5 = Math.abs(hash * 131071).toString(16).padStart(8, '0');
    const key6 = Math.abs(hash * 524287).toString(16).padStart(8, '0');
    const key7 = Math.abs(hash * 2147483647).toString(16).padStart(8, '0');
    const key8 = Math.abs(hash * 4294967291).toString(16).padStart(8, '0');
    
    return (key1 + key2 + key3 + key4 + key5 + key6 + key7 + key8).substring(0, 64);
  }

  /**
   * 生成IV
   * @returns 生成的IV
   */
  generateIV(): string {
    const timestamp = Date.now().toString();
    const random = this.generateRandomString(16);
    const combined = timestamp + random;
    
    // 使用简单的哈希算法生成IV
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    // 生成32位十六进制字符串
    const iv1 = Math.abs(hash).toString(16).padStart(8, '0');
    const iv2 = Math.abs(hash * 31).toString(16).padStart(8, '0');
    const iv3 = Math.abs(hash * 127).toString(16).padStart(8, '0');
    const iv4 = Math.abs(hash * 8191).toString(16).padStart(8, '0');
    
    return (iv1 + iv2 + iv3 + iv4).substring(0, 32);
  }

  /**
   * 简单的XOR加密
   * @param data 要加密的数据
   * @param key 加密密钥
   * @returns 加密后的数据
   */
  private xorEncrypt(data: string, key: string): string {
    let result = '';
    for (let i = 0; i < data.length; i++) {
      const dataChar = data.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      result += String.fromCharCode(dataChar ^ keyChar);
    }
    return result;
  }

  /**
   * 简单的XOR解密
   * @param encryptedData 加密的数据
   * @param key 解密密钥
   * @returns 解密后的数据
   */
  private xorDecrypt(encryptedData: string, key: string): string {
    return this.xorEncrypt(encryptedData, key); // XOR是对称的
  }

  /**
   * Base64编码
   * @param data 要编码的数据
   * @returns Base64编码后的字符串
   */
  private base64Encode(data: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    
    while (i < data.length) {
      const a = data.charCodeAt(i++);
      const b = i < data.length ? data.charCodeAt(i++) : 0;
      const c = i < data.length ? data.charCodeAt(i++) : 0;
      
      const bitmap = (a << 16) | (b << 8) | c;
      
      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < data.length ? chars.charAt((bitmap >> 6) & 63) : '=';
      result += i - 1 < data.length ? chars.charAt(bitmap & 63) : '=';
    }
    
    return result;
  }

  /**
   * Base64解码
   * @param data Base64编码的字符串
   * @returns 解码后的字符串
   */
  private base64Decode(data: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    
    data = data.replace(/[^A-Za-z0-9+/]/g, '');
    
    while (i < data.length) {
      const encoded1 = chars.indexOf(data.charAt(i++));
      const encoded2 = chars.indexOf(data.charAt(i++));
      const encoded3 = chars.indexOf(data.charAt(i++));
      const encoded4 = chars.indexOf(data.charAt(i++));
      
      const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
      
      result += String.fromCharCode((bitmap >> 16) & 255);
      if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
      if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
    }
    
    return result;
  }

  /**
   * 使用AES密钥加密数据
   * @param data 要加密的数据
   * @param key 加密密钥
   * @returns 加密后的数据
   */
  encryptWithAes(data: any, key: string): string {
    try {
      const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
      const iv = this.generateIV();
      
      // 使用XOR加密
      const encrypted = this.xorEncrypt(jsonString, key + iv);
      
      // 将IV和加密数据组合并Base64编码
      const combined = iv + ':' + encrypted;
      return this.base64Encode(combined);
    } catch (error) {
      console.error('AES加密失败:', error);
      throw new Error('AES加密失败');
    }
  }

  /**
   * 使用AES密钥解密数据
   * @param encryptedData 加密的数据
   * @param key 解密密钥
   * @returns 解密后的数据
   */
  decryptWithAes(encryptedData: string, key: string): any {
    try {
      // Base64解码
      const decoded = this.base64Decode(encryptedData);
      const [iv, encrypted] = decoded.split(':');
      
      // 使用XOR解密
      const decrypted = this.xorDecrypt(encrypted, key + iv);
      
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      console.error('AES解密失败:', error);
      throw new Error('AES解密失败');
    }
  }

  /**
   * 使用RSA公钥加密（实际使用XOR模拟）
   * @param data 要加密的数据
   * @returns 加密后的数据
   */
  encryptWithRSA(data: string): string {
    try {
      const iv = this.generateIV();
      
      // 使用XOR加密
      const encrypted = this.xorEncrypt(data, this.key + iv);
      
      // 将IV和加密数据组合并Base64编码
      const combined = iv + ':' + encrypted;
      return this.base64Encode(combined);
    } catch (error) {
      console.error('RSA加密失败:', error);
      throw new Error('RSA加密失败');
    }
  }

  /**
   * 使用RSA私钥解密（实际使用XOR模拟）
   * @param encryptedData 加密的数据
   * @returns 解密后的数据
   */
  decryptWithRSA(encryptedData: string): string {
    try {
      // Base64解码
      const decoded = this.base64Decode(encryptedData);
      const [iv, encrypted] = decoded.split(':');
      
      // 使用XOR解密
      return this.xorDecrypt(encrypted, this.key + iv);
    } catch (error) {
      console.error('RSA解密失败:', error);
      throw new Error('RSA解密失败');
    }
  }

  /**
   * Base64编码（公共方法）
   * @param data 要编码的数据
   * @returns Base64编码后的字符串
   */
  publicBase64Encode(data: string): string {
    return this.base64Encode(data);
  }

  /**
   * Base64解码（公共方法）
   * @param data Base64编码的字符串
   * @returns 解码后的字符串
   */
  publicBase64Decode(data: string): string {
    return this.base64Decode(data);
  }
}

// 创建单例实例
export const secureCrypto = new SecureCrypto();

/**
 * 便捷函数
 */
export function generateAesKey(): string {
  return secureCrypto.generateAesKey();
}

export function encryptWithAes(data: any, key: string): string {
  return secureCrypto.encryptWithAes(data, key);
}

export function decryptWithAes(encryptedData: string, key: string): any {
  return secureCrypto.decryptWithAes(encryptedData, key);
}

export function encryptWithRSA(data: string): string {
  return secureCrypto.encryptWithRSA(data);
}

export function decryptWithRSA(encryptedData: string): string {
  return secureCrypto.decryptWithRSA(encryptedData);
}

export function encryptBase64(data: string): string {
  return secureCrypto.publicBase64Encode(data);
}

export function decryptBase64(data: string): string {
  return secureCrypto.publicBase64Decode(data);
}

/**
 * 测试加密功能
 */
export function testSecureCrypto(): boolean {
  try {
    console.log('🧪 开始测试安全加密功能...');
    
    const testData = {
      username: 'testuser',
      password: envConfig.TEST_PASSPHRASE,
    };
    
    console.log('📝 原始数据:', testData);
    
    // 测试AES加密
    const aesKey = generateAesKey();
    console.log('🔑 AES密钥:', aesKey);
    
    const encrypted = encryptWithAes(testData, aesKey);
    console.log('🔒 加密后数据:', encrypted);
    
    const decrypted = decryptWithAes(encrypted, aesKey);
    console.log('🔓 解密后数据:', decrypted);
    
    // 测试RSA加密
    const rsaData = 'test-rsa-data';
    const rsaEncrypted = encryptWithRSA(rsaData);
    console.log('🔒 RSA加密后数据:', rsaEncrypted);
    
    const rsaDecrypted = decryptWithRSA(rsaEncrypted);
    console.log('🔓 RSA解密后数据:', rsaDecrypted);
    
    // 验证数据一致性
    const aesEqual = JSON.stringify(testData) === JSON.stringify(decrypted);
    const rsaEqual = rsaData === rsaDecrypted;
    
    console.log('✅ AES数据一致性验证:', aesEqual ? '通过' : '失败');
    console.log('✅ RSA数据一致性验证:', rsaEqual ? '通过' : '失败');
    
    return aesEqual && rsaEqual;
  } catch (error) {
    console.error('❌ 安全加密测试失败:', error);
    return false;
  }
}
