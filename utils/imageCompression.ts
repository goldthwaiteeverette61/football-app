/**
 * 图片压缩工具
 * 支持Web和React Native平台的图片压缩
 */

import { Platform } from 'react-native';

interface CompressionOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp';
  resizeMode?: 'contain' | 'cover' | 'stretch';
}

interface CompressionResult {
  uri: string;
  width: number;
  height: number;
  size: number;
  originalSize: number;
  compressionRatio: number;
}

class ImageCompressionService {
  private static instance: ImageCompressionService;
  
  static getInstance(): ImageCompressionService {
    if (!ImageCompressionService.instance) {
      ImageCompressionService.instance = new ImageCompressionService();
    }
    return ImageCompressionService.instance;
  }

  /**
   * 压缩图片
   */
  async compressImage(
    uri: string, 
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    const {
      quality = 0.8,
      maxWidth = 1920,
      maxHeight = 1080,
      format = 'jpeg',
      resizeMode = 'contain',
    } = options;

    try {
      if (Platform.OS === 'web') {
        return await this.compressImageWeb(uri, { quality, maxWidth, maxHeight, format });
      } else {
        return await this.compressImageNative(uri, { quality, maxWidth, maxHeight, format, resizeMode });
      }
    } catch (error) {
      console.error('图片压缩失败:', error);
      throw error;
    }
  }

  /**
   * Web平台图片压缩
   */
  private async compressImageWeb(
    uri: string,
    options: { quality: number; maxWidth: number; maxHeight: number; format: string }
  ): Promise<CompressionResult> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('无法获取Canvas上下文'));
            return;
          }

          // 计算压缩后的尺寸
          const { width, height } = this.calculateCompressedDimensions(
            img.width,
            img.height,
            options.maxWidth,
            options.maxHeight
          );

          canvas.width = width;
          canvas.height = height;

          // 绘制压缩后的图片
          ctx.drawImage(img, 0, 0, width, height);

          // 转换为Blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('图片压缩失败'));
                return;
              }

              const compressedUri = URL.createObjectURL(blob);
              const originalSize = this.estimateImageSize(img.width, img.height);
              
              resolve({
                uri: compressedUri,
                width,
                height,
                size: blob.size,
                originalSize,
                compressionRatio: (blob.size / originalSize) * 100,
              });
            },
            `image/${options.format}`,
            options.quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('图片加载失败'));
      };

      img.src = uri;
    });
  }

  /**
   * React Native平台图片压缩
   */
  private async compressImageNative(
    uri: string,
    options: { quality: number; maxWidth: number; maxHeight: number; format: string; resizeMode: string }
  ): Promise<CompressionResult> {
    try {
      // 获取原始图片信息
      const originalInfo = await ImageManipulator.manipulateAsync(uri, [], { format: ImageManipulator.SaveFormat.JPEG });
      
      // 计算压缩后的尺寸
      const { width, height } = this.calculateCompressedDimensions(
        originalInfo.width,
        originalInfo.height,
        options.maxWidth,
        options.maxHeight
      );

      // 压缩图片
      const compressedResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width,
              height,
            },
          },
        ],
        {
          compress: options.quality,
          format: options.format === 'png' ? ImageManipulator.SaveFormat.PNG : ImageManipulator.SaveFormat.JPEG,
        }
      );

      const originalSize = this.estimateImageSize(originalInfo.width, originalInfo.height);
      
      return {
        uri: compressedResult.uri,
        width: compressedResult.width,
        height: compressedResult.height,
        size: compressedResult.size || 0,
        originalSize,
        compressionRatio: compressedResult.size ? (compressedResult.size / originalSize) * 100 : 0,
      };
    } catch (error) {
      console.error('Native图片压缩失败:', error);
      throw error;
    }
  }

  /**
   * 计算压缩后的尺寸
   */
  private calculateCompressedDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    const aspectRatio = originalWidth / originalHeight;
    
    let width = maxWidth;
    let height = maxWidth / aspectRatio;
    
    if (height > maxHeight) {
      height = maxHeight;
      width = maxHeight * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  /**
   * 估算图片大小
   */
  private estimateImageSize(width: number, height: number): number {
    // 粗略估算：每像素3字节（RGB）
    return width * height * 3;
  }

  /**
   * 批量压缩图片
   */
  async compressImages(
    uris: string[],
    options: CompressionOptions = {}
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];
    
    for (const uri of uris) {
      try {
        const result = await this.compressImage(uri, options);
        results.push(result);
      } catch (error) {
        console.error(`压缩图片失败: ${uri}`, error);
        // 如果压缩失败，返回原始信息
        results.push({
          uri,
          width: 0,
          height: 0,
          size: 0,
          originalSize: 0,
          compressionRatio: 0,
        });
      }
    }
    
    return results;
  }

  /**
   * 获取图片信息
   */
  async getImageInfo(uri: string): Promise<{ width: number; height: number; size?: number }> {
    if (Platform.OS === 'web') {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            width: img.width,
            height: img.height,
          });
        };
        img.onerror = () => reject(new Error('无法加载图片'));
        img.src = uri;
      });
    } else {
      try {
        const result = await ImageManipulator.manipulateAsync(uri, [], { format: ImageManipulator.SaveFormat.JPEG });
        return {
          width: result.width,
          height: result.height,
          size: result.size,
        };
      } catch (error) {
        throw new Error('无法获取图片信息');
      }
    }
  }
}

// 导出单例实例
export const imageCompression = ImageCompressionService.getInstance();
export default imageCompression;
