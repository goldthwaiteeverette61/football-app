import { UserInfo } from '../services/authApi';

/**
 * 解析JWT token
 * @param token JWT token字符串
 * @returns 解析后的payload对象
 */
export function parseJWT(token: string): any {
  try {
    console.log('🔍 开始解析JWT token...');
    console.log('📄 Token长度:', token.length);
    console.log('📄 Token预览:', token.substring(0, 50) + '...');
    
    // JWT格式: header.payload.signature
    const parts = token.split('.');
    console.log('📄 JWT部分数量:', parts.length);
    
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // 解码payload部分（base64url解码）
    const payload = parts[1];
    console.log('📄 Payload部分长度:', payload.length);
    console.log('📄 Payload预览:', payload.substring(0, 50) + '...');
    
    // 添加padding如果需要
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    console.log('📄 添加padding后的长度:', paddedPayload.length);
    
    // 使用atob解码base64
    const decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    console.log('📄 解码后的payload长度:', decodedPayload.length);
    console.log('📄 解码后的payload内容:', decodedPayload);
    
    const parsedPayload = JSON.parse(decodedPayload);
    console.log('✅ JWT解析成功');
    console.log('📊 解析后的payload:', parsedPayload);
    
    return parsedPayload;
  } catch (error) {
    console.error('❌ JWT解析失败:', error);
    console.error('📄 原始token:', token);
    throw new Error('JWT解析失败');
  }
}

/**
 * 从JWT token中提取用户信息
 * @param token JWT access_token
 * @returns 用户信息对象
 */
export function extractUserInfoFromToken(token: string): UserInfo {
  try {
    const payload = parseJWT(token);
    
    return {
      loginType: payload.loginType || '',
      loginId: payload.loginId || '',
      rnStr: payload.rnStr || '',
      clientid: payload.clientid || '',
      tenantId: payload.tenantId || '',
      userId: payload.userId || 0,
      userName: payload.userName || '',
      deptId: payload.deptId || 0,
      deptName: payload.deptName || '',
      deptCategory: payload.deptCategory || '',
    };
  } catch (error) {
    console.error('从JWT token提取用户信息失败:', error);
    throw new Error('用户信息提取失败');
  }
}

/**
 * 检查JWT token是否过期
 * @param token JWT token字符串
 * @returns 是否过期
 */
export function isTokenExpired(token: string): boolean {
  try {
    console.log('⏰ 检查token是否过期...');
    
    // 尝试从JWT token中解析过期时间
    const payload = parseJWT(token);
    const exp = payload.exp; // JWT标准中的过期时间字段
    
    console.log('📊 Token过期时间字段 (exp):', exp);
    
    if (!exp) {
      console.log('❌ 没有找到过期时间字段，认为已过期');
      return true; // 没有过期时间，认为已过期
    }
    
    const currentTime = Math.floor(Date.now() / 1000); // 当前时间戳（秒）
    console.log('📊 当前时间戳:', currentTime);
    console.log('📊 Token过期时间戳:', exp);
    console.log('📊 时间差 (秒):', exp - currentTime);
    
    const isExpired = currentTime >= exp;
    console.log('📊 Token是否过期:', isExpired);
    
    if (isExpired) {
      console.log('❌ Token已过期');
    } else {
      console.log('✅ Token仍然有效');
    }
    
    return isExpired;
  } catch (error) {
    console.error('❌ 检查token过期时间失败:', error);
    return true; // 解析失败，认为已过期
  }
}

/**
 * 检查token是否过期（基于expire_in）
 * @param tokenCreateTime token创建时间戳（毫秒）
 * @param expireIn 过期时间（秒）
 * @returns 是否过期
 */
export function isTokenExpiredByExpireIn(tokenCreateTime: number, expireIn: number): boolean {
  try {
    console.log('⏰ 检查token是否过期 (基于expire_in)...');
    console.log('📊 Token创建时间:', new Date(tokenCreateTime).toISOString());
    console.log('📊 过期时间 (秒):', expireIn);
    
    // 验证输入参数
    if (!tokenCreateTime || !expireIn || tokenCreateTime <= 0 || expireIn <= 0) {
      console.warn('⚠️ 无效的token时间参数，认为未过期');
      return false;
    }
    
    const currentTime = Date.now(); // 当前时间戳（毫秒）
    const tokenAge = (currentTime - tokenCreateTime) / 1000; // token年龄（秒）
    const remainingTime = expireIn - tokenAge; // 剩余时间（秒）
    
    console.log('📊 当前时间:', new Date(currentTime).toISOString());
    console.log('📊 Token年龄 (秒):', tokenAge);
    console.log('📊 剩余时间 (秒):', remainingTime);
    
    // 添加5分钟的缓冲时间，避免边界情况
    const bufferTime = 5 * 60; // 5分钟
    const isExpired = remainingTime <= bufferTime;
    console.log('📊 Token是否过期 (含5分钟缓冲):', isExpired);
    
    if (isExpired) {
      console.log('❌ Token已过期 (剩余时间 <= 5分钟缓冲)');
    } else {
      console.log('✅ Token仍然有效 (剩余时间 > 5分钟缓冲)');
    }
    
    return isExpired;
  } catch (error) {
    console.error('❌ 检查token过期时间失败:', error);
    console.warn('⚠️ 检查失败，认为token未过期，继续使用');
    return false; // 解析失败，认为未过期，避免误判
  }
}

/**
 * 检查token是否过期（基于存储的expire_in）
 * @param token JWT token字符串
 * @param expireIn 过期时间（秒）
 * @returns 是否过期
 */
export function isTokenExpiredByStoredExpireIn(token: string, expireIn: number): boolean {
  try {
    console.log('⏰ 检查token是否过期 (基于存储的expire_in)...');
    console.log('📊 过期时间 (秒):', expireIn);
    
    // 验证输入参数
    if (!expireIn || expireIn <= 0) {
      console.warn('⚠️ 无效的expire_in参数，认为未过期');
      return false;
    }
    
    // 尝试从JWT token中解析创建时间
    const payload = parseJWT(token);
    const iat = payload.iat; // JWT标准中的签发时间字段
    
    if (!iat) {
      console.warn('⚠️ 没有找到签发时间字段，认为未过期');
      return false;
    }
    
    const currentTime = Math.floor(Date.now() / 1000); // 当前时间戳（秒）
    const tokenAge = currentTime - iat; // token年龄（秒）
    const remainingTime = expireIn - tokenAge; // 剩余时间（秒）
    
    console.log('📊 当前时间:', new Date(currentTime * 1000).toISOString());
    console.log('📊 Token签发时间:', new Date(iat * 1000).toISOString());
    console.log('📊 Token年龄 (秒):', tokenAge);
    console.log('📊 剩余时间 (秒):', remainingTime);
    
    // 添加5分钟的缓冲时间，避免边界情况
    const bufferTime = 5 * 60; // 5分钟
    const isExpired = remainingTime <= bufferTime;
    console.log('📊 Token是否过期 (含5分钟缓冲):', isExpired);
    
    if (isExpired) {
      console.log('❌ Token已过期 (剩余时间 <= 5分钟缓冲)');
    } else {
      console.log('✅ Token仍然有效 (剩余时间 > 5分钟缓冲)');
    }
    
    return isExpired;
  } catch (error) {
    console.error('❌ 检查token过期时间失败:', error);
    console.warn('⚠️ 检查失败，认为token未过期，继续使用');
    return false; // 解析失败，认为未过期，避免误判
  }
}

/**
 * 获取JWT token的剩余有效时间（秒）
 * @param token JWT token字符串
 * @returns 剩余有效时间（秒），如果已过期返回0
 */
export function getTokenRemainingTime(token: string): number {
  try {
    const payload = parseJWT(token);
    const exp = payload.exp;
    
    if (!exp) {
      return 0;
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    const remainingTime = exp - currentTime;
    
    return Math.max(0, remainingTime);
  } catch (error) {
    console.error('获取token剩余时间失败:', error);
    return 0;
  }
}
