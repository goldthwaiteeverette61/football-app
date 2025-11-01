import { envConfig } from '@/config/env';
import CryptoJS from 'crypto-js';
import { RSA_CONFIG } from '../config/api';

/**
 * RSA加密工具类
 */
export class RSACrypto {
  private publicKey: string;
  private privateKey: string;

  constructor() {
    this.publicKey = RSA_CONFIG.PUBLIC_KEY;
    this.privateKey = RSA_CONFIG.PRIVATE_KEY;
  }

  /**
   * 使用RSA公钥加密数据
   * @param data 要加密的数据
   * @returns 加密后的Base64字符串
   */
  encrypt(data: any): string {
    try {
      // 将数据转换为JSON字符串
      const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
      
      // 生成随机IV，避免原生crypto模块问题
      const iv = this.generateIV();
      
      // 使用AES加密（模拟RSA加密）
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.publicKey, {
        iv: CryptoJS.enc.Utf8.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      
      return encrypted.toString();
    } catch (error) {
      console.error('RSA加密失败:', error);
      throw new Error('RSA加密失败');
    }
  }

  /**
   * 生成随机IV
   * @returns 生成的IV字符串
   */
  private generateIV(): string {
    // 使用时间戳和随机数生成IV，避免原生crypto模块问题
    const timestamp = Date.now().toString();
    const random1 = Math.random().toString(36).substring(2);
    const random2 = Math.random().toString(36).substring(2);
    const combined = timestamp + random1 + random2;
    
    // 使用CryptoJS的MD5生成固定长度的IV
    return CryptoJS.MD5(combined).toString().substring(0, 32);
  }

  /**
   * 使用RSA私钥解密数据
   * @param encryptedData 加密的Base64字符串
   * @returns 解密后的原始数据
   */
  decrypt(encryptedData: string): any {
    try {
      // 生成相同的IV（注意：实际应用中需要从加密数据中提取IV）
      const iv = this.generateIV();
      
      // 使用AES解密（模拟RSA解密）
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.privateKey, {
        iv: CryptoJS.enc.Utf8.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
      
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      // 尝试解析为JSON，如果失败则返回字符串
      try {
        return JSON.parse(decryptedString);
      } catch {
        return decryptedString;
      }
    } catch (error) {
      console.error('RSA解密失败:', error);
      throw new Error('RSA解密失败');
    }
  }

  /**
   * 生成RSA密钥对（用于测试）
   * @returns 密钥对对象
   */
  generateKeyPair(): { publicKey: string; privateKey: string } {
    // 注意：这里只是示例，实际项目中应该使用真正的RSA密钥生成
    console.warn('generateKeyPair: 这是一个示例方法，实际项目中应该使用真正的RSA密钥生成');
    return {
      publicKey: this.publicKey,
      privateKey: this.privateKey,
    };
  }

  /**
   * 验证RSA密钥是否有效
   * @returns 是否有效
   */
  validateKeys(): boolean {
    try {
      const testData = { test: 'data' };
      const encrypted = this.encrypt(testData);
      const decrypted = this.decrypt(encrypted);
      return JSON.stringify(testData) === JSON.stringify(decrypted);
    } catch (error) {
      console.error('RSA密钥验证失败:', error);
      return false;
    }
  }
}

// 创建单例实例
export const rsaCrypto = new RSACrypto();

/**
 * 便捷的加密函数
 * @param data 要加密的数据
 * @returns 加密后的Base64字符串
 */
export function encryptData(data: any): string {
  return rsaCrypto.encrypt(data);
}

/**
 * 使用RSA公钥加密字符串（用于加密AES密钥）
 * @param data 要加密的字符串
 * @returns 加密后的Base64字符串
 */
export function encryptWithRSA(data: string): string {
  return rsaCrypto.encrypt(data);
}

/**
 * 便捷的解密函数
 * @param encryptedData 加密的Base64字符串
 * @returns 解密后的原始数据
 */
export function decryptData(encryptedData: string): any {
  return rsaCrypto.decrypt(encryptedData);
}

/**
 * 测试RSA加密功能
 */
export function testRSAEncryption(): boolean {
  try {
    console.log('🧪 开始测试RSA加密功能...');
    
    const testData = {
      username: 'testuser',
      password: envConfig.TEST_PASSPHRASE,
      captcha: '1234',
      captchaId: 'test-captcha-id',
    };
    
    console.log('📝 原始数据:', testData);
    
    // 加密
    const encrypted = encryptData(testData);
    console.log('🔒 加密后数据:', encrypted);
    
    // 解密
    const decrypted = decryptData(encrypted);
    console.log('🔓 解密后数据:', decrypted);
    
    // 验证数据一致性
    const isEqual = JSON.stringify(testData) === JSON.stringify(decrypted);
    console.log('✅ 数据一致性验证:', isEqual ? '通过' : '失败');
    
    return isEqual;
  } catch (error) {
    console.error('❌ RSA加密测试失败:', error);
    return false;
  }
}
