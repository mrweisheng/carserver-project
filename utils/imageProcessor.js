const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * 图片处理工具类
 */
class ImageProcessor {
  /**
   * 压缩图片
   * @param {string} inputPath - 输入图片路径
   * @param {string} outputPath - 输出图片路径
   * @param {Object} options - 处理选项
   * @returns {Promise<void>}
   */
  static async compressImage(inputPath, outputPath, options = {}) {
    const {
      quality = 80, // 压缩质量 (1-100)
      maxWidth = 1920, // 最大宽度
      maxHeight = 1080, // 最大高度
      format = 'jpeg' // 输出格式
    } = options;

    try {
      let pipeline = sharp(inputPath);

      // 获取图片信息
      const metadata = await pipeline.metadata();

      // 调整尺寸
      if (metadata.width > maxWidth || metadata.height > maxHeight) {
        pipeline = pipeline.resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // 根据格式处理
      switch (format.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
          pipeline = pipeline.jpeg({ quality });
          break;
        case 'png':
          pipeline = pipeline.png({ quality });
          break;
        case 'webp':
          pipeline = pipeline.webp({ quality });
          break;
        default:
          pipeline = pipeline.jpeg({ quality });
      }

      // 保存处理后的图片
      await pipeline.toFile(outputPath);

      // 删除原文件
      await fs.unlink(inputPath);

    } catch (error) {
      console.error('图片压缩失败:', error);
      throw new Error('图片处理失败');
    }
  }

  /**
   * 生成缩略图
   * @param {string} inputPath - 输入图片路径
   * @param {string} outputPath - 输出缩略图路径
   * @param {number} size - 缩略图尺寸（正方形）
   * @returns {Promise<void>}
   */
  static async generateThumbnail(inputPath, outputPath, size = 300) {
    try {
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);
    } catch (error) {
      console.error('缩略图生成失败:', error);
      throw new Error('缩略图生成失败');
    }
  }

  /**
   * 获取图片尺寸信息
   * @param {string} imagePath - 图片路径
   * @returns {Promise<Object>} 图片信息
   */
  static async getImageInfo(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha
      };
    } catch (error) {
      console.error('获取图片信息失败:', error);
      throw new Error('无法获取图片信息');
    }
  }

  /**
   * 批量处理图片
   * @param {Array} files - 文件数组
   * @param {string} baseDir - 基础目录
   * @param {Object} options - 处理选项
   * @returns {Promise<Array>} 处理结果
   */
  static async processMultipleImages(files, baseDir, options = {}) {
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await this.processSingleImage(file, baseDir, options);
        results.push({
          success: true,
          ...result,
          order: i
        });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          originalName: file.originalname,
          order: i
        });
      }
    }

    return results;
  }

  /**
   * 处理单个图片
   * @param {Object} file - 文件对象
   * @param {string} baseDir - 基础目录
   * @param {Object} options - 处理选项
   * @returns {Promise<Object>} 处理结果
   */
  static async processSingleImage(file, baseDir, options = {}) {
    const {
      generateThumbnail = true,
      thumbnailSize = 300,
      compression = true
    } = options;

    const inputPath = file.path;
    const filename = path.basename(inputPath);
    const nameWithoutExt = path.parse(filename).name;
    const ext = path.extname(filename);

    // 生成输出路径
    const outputPath = path.join(baseDir, `${nameWithoutExt}_processed${ext}`);
    const thumbnailPath = generateThumbnail
      ? path.join(baseDir, `${nameWithoutExt}_thumb${ext}`)
      : null;

    // 压缩图片
    if (compression) {
      await this.compressImage(inputPath, outputPath);
    }

    // 生成缩略图
    if (generateThumbnail && thumbnailPath) {
      await this.generateThumbnail(outputPath, thumbnailPath, thumbnailSize);
    }

    // 获取处理后的图片信息
    const imageInfo = await this.getImageInfo(outputPath);

    return {
      originalName: file.originalname,
      filename: path.basename(outputPath),
      path: outputPath,
      thumbnailPath: thumbnailPath,
      size: imageInfo.size,
      width: imageInfo.width,
      height: imageInfo.height,
      format: imageInfo.format
    };
  }
}

module.exports = ImageProcessor;