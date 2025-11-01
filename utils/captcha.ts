import { authApi } from '@/services/authApi';

/**
 * 验证码工具类
 */
class CaptchaManager {
  private cooldownTime = 0;
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * 获取验证码
   */
  async getCaptcha(): Promise<{ captchaId: string; captchaImage: string } | null> {
    try {
      // 检查冷却时间
      if (this.cooldownTime > 0) {
        console.log(`⏰ 验证码仍在冷却中，剩余${this.cooldownTime}秒`);
        throw new Error(`验证码获取过于频繁，请${this.cooldownTime}秒后再试`);
      }

      console.log('🔄 正在获取验证码...');
      const response = await authApi.getCaptcha();
      
      if (response.success && response.data) {
        console.log('✅ 验证码获取成功');
        return {
          captchaId: response.data.uuid,
          captchaImage: response.data.img,
        };
      } else {
        console.error('❌ 验证码获取失败:', response.message);
        
        // 检查是否是code=500的频繁访问错误
        if (response.code === 500) {
          this.startCooldown(30);
        }
        
        return null;
      }
    } catch (error: any) {
      console.error('❌ 验证码API调用失败:', error);
      
      // 处理频繁访问错误
      if (error.name === 'CAPTCHA_FREQUENT' || (error.message && error.message.includes('频繁'))) {
        this.startCooldown(30);
      }
      
      return null;
    }
  }

  /**
   * 开始冷却倒计时
   */
  private startCooldown(seconds: number) {
    this.cooldownTime = seconds;
    console.log(`⏰ 验证码访问频繁，开始${seconds}秒冷却倒计时`);
    
    this.cooldownInterval = setInterval(() => {
      this.cooldownTime--;
      if (this.cooldownTime <= 0) {
        this.cooldownTime = 0;
        if (this.cooldownInterval) {
          clearInterval(this.cooldownInterval);
          this.cooldownInterval = null;
        }
      }
    }, 1000);
  }

  /**
   * 获取当前冷却时间
   */
  getCooldownTime(): number {
    return this.cooldownTime;
  }

  /**
   * 清除冷却时间
   */
  clearCooldown() {
    this.cooldownTime = 0;
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
  }
}

// 导出单例实例
export default new CaptchaManager();
