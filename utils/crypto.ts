import { envConfig } from '@/config/env';
import CryptoJS from 'crypto-js';
import JSEncrypt from 'jsencrypt';
import { RSA_CONFIG } from '../config/api';

/**
 * 随机生成32位的字符串
 * @returns {string}
 */
function generateRandomString(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < 32; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

/**
 * 随机生成aes 密钥
 * @returns {CryptoJS.lib.WordArray}
 */
export function generateAesKey(): CryptoJS.lib.WordArray {
  return CryptoJS.enc.Utf8.parse(generateRandomString());
}

/**
 * 加密base64
 * @param str CryptoJS.lib.WordArray
 * @returns {string}
 */
export function encryptBase64(str: CryptoJS.lib.WordArray): string {
  return CryptoJS.enc.Base64.stringify(str);
}

/**
 * 解密base64
 * @param str string
 * @returns {CryptoJS.lib.WordArray}
 */
export function decryptBase64(str: string): CryptoJS.lib.WordArray {
  return CryptoJS.enc.Base64.parse(str);
}

/**
 * 使用密钥对数据进行加密
 * @param message string
 * @param aesKey CryptoJS.lib.WordArray
 * @returns {string}
 */
export function encryptWithAes(message: string, aesKey: CryptoJS.lib.WordArray): string {
  const encrypted = CryptoJS.AES.encrypt(message, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.toString();
}

/**
 * 使用密钥对数据进行解密
 * @param message string
 * @param aesKey CryptoJS.lib.WordArray
 * @returns {string}
 */
export function decryptWithAes(message: string, aesKey: CryptoJS.lib.WordArray): string {
  const decrypted = CryptoJS.AES.decrypt(message, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * 使用RSA公钥加密
 * @param data string
 * @returns {string}
 */
export function encryptWithRSA(data: string): string {
  try {
    console.log('🔐 开始RSA加密...');
    console.log('原始数据:', data);
    
    const encryptor = new JSEncrypt();
    encryptor.setPublicKey(RSA_CONFIG.PUBLIC_KEY);
    
    const encrypted = encryptor.encrypt(data);
    
    if (!encrypted) {
      throw new Error('RSA加密失败：返回空值');
    }
    
    console.log('RSA加密结果:', encrypted);
    return encrypted;
  } catch (error) {
    console.error('RSA加密失败:', error);
    throw new Error('RSA加密失败');
  }
}

/**
 * 使用RSA私钥解密
 * @param encryptedData string
 * @returns {string}
 */
export function decryptWithRSA(encryptedData: string): string {
  try {
    console.log('🔓 开始RSA解密...');
    console.log('加密数据:', encryptedData);
    
    const encryptor = new JSEncrypt();
    encryptor.setPrivateKey(RSA_CONFIG.PRIVATE_KEY);
    
    const decrypted = encryptor.decrypt(encryptedData);
    
    if (!decrypted) {
      throw new Error('RSA解密失败：返回空值');
    }
    
    console.log('RSA解密结果:', decrypted);
    return decrypted;
  } catch (error) {
    console.error('RSA解密失败:', error);
    throw new Error('RSA解密失败');
  }
}

/**
 * 测试加密功能
 */
export function testCrypto(): boolean {
  try {
    console.log('🧪 开始测试加密功能...');
    
    // 测试AES加密
    const testData = 'Hello World! This is a test for crypto.';
    const aesKey = generateAesKey();
    console.log('测试数据:', testData);
    console.log('AES密钥:', aesKey.toString());
    
    const aesEncrypted = encryptWithAes(testData, aesKey);
    console.log('AES加密结果:', aesEncrypted);
    
    const aesDecrypted = decryptWithAes(aesEncrypted, aesKey);
    console.log('AES解密结果:', aesDecrypted);
    
    const aesSuccess = testData === aesDecrypted;
    console.log('AES测试结果:', aesSuccess ? '✅ 通过' : '❌ 失败');
    
    // 测试RSA加密
    const rsaEncrypted = encryptWithRSA(testData);
    console.log('RSA加密结果:', rsaEncrypted);
    
    const rsaDecrypted = decryptWithRSA(rsaEncrypted);
    console.log('RSA解密结果:', rsaDecrypted);
    
    const rsaSuccess = testData === rsaDecrypted;
    console.log('RSA测试结果:', rsaSuccess ? '✅ 通过' : '❌ 失败');
    
    return aesSuccess && rsaSuccess;
  } catch (error) {
    console.error('❌ 加密测试失败:', error);
    return false;
  }
}

/**
 * 测试混合加密功能
 */
export function testHybridEncryption(): boolean {
  try {
    console.log('🔐 开始测试混合加密...');
    
    // 生成AES密钥
    const aesKey = generateAesKey();
    console.log('生成的AES密钥:', aesKey.toString());
    
    // 测试数据
    const testData = {
      clientId: 'e5cd7e4891bf95d1d19206ce24a7b32e',
      grantType: 'password',
      tenantId: '000000',
      code: '1234',
      uuid: 'test-uuid',
      username: envConfig.TEST_USERNAME,
      password: envConfig.TEST_PASSWORD,
    };
    
    console.log('测试数据:', testData);
    
    // 用AES加密数据
    const jsonString = JSON.stringify(testData);
    const aesEncrypted = encryptWithAes(jsonString, aesKey);
    console.log('AES加密结果:', aesEncrypted);
    
    // 用RSA加密AES密钥
    const base64AesKey = encryptBase64(aesKey);
    const rsaEncryptedKey = encryptWithRSA(base64AesKey);
    console.log('RSA加密AES密钥结果:', rsaEncryptedKey);
    
    // 解密AES密钥
    const decryptedBase64AesKey = decryptWithRSA(rsaEncryptedKey);
    const decryptedAesKey = decryptBase64(decryptedBase64AesKey);
    console.log('解密的AES密钥:', decryptedAesKey.toString());
    
    // 解密数据
    const decryptedJsonString = decryptWithAes(aesEncrypted, decryptedAesKey);
    const decryptedData = JSON.parse(decryptedJsonString);
    console.log('解密的数据:', decryptedData);
    
    const success = JSON.stringify(testData) === JSON.stringify(decryptedData);
    console.log('混合加密测试结果:', success ? '✅ 通过' : '❌ 失败');
    
    return success;
  } catch (error) {
    console.error('❌ 混合加密测试失败:', error);
    return false;
  }
}