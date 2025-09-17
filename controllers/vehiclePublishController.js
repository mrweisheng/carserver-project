const { Vehicle, VehicleImage, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const ImageProcessor = require('../utils/imageProcessor');
const path = require('path');

/**
 * 车辆发布控制器
 */
class VehiclePublishController {
  /**
   * 格式化座位数字段，确保与存量数据兼容
   * @param {string} seats - 座位数输入
   * @returns {string} 格式化后的座位数
   */
  static formatSeatsField(seats) {
    if (!seats) return '';

    // 移除所有空格和特殊字符，只保留数字
    const numericOnly = String(seats).replace(/[^\d]/g, '');

    if (!numericOnly) return '';

    // 统一格式化为："数字座位"，如 "5座位"
    return `${numericOnly}座位`;
  }
  /**
   * 生成唯一车辆ID
   * @param {number} userId - 用户ID
   * @returns {string} 车辆ID
   */
  static generateVehicleId(userId) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `u${userId}_v${timestamp}_${random}`;
  }

  /**
   * 验证车辆数据
   */
  static validateVehicleData() {
    return [
      // 必填字段验证
      body('car_brand')
        .notEmpty()
        .withMessage('车辆品牌不能为空')
        .isLength({ max: 100 })
        .withMessage('车辆品牌长度不能超过100个字符'),

      body('car_model')
        .notEmpty()
        .withMessage('车辆型号不能为空')
        .isLength({ max: 200 })
        .withMessage('车辆型号长度不能超过200个字符'),

      body('year')
        .notEmpty()
        .withMessage('年份不能为空')
        .matches(/^(19|20)\d{2}$/)
        .withMessage('年份格式不正确'),

      body('price')
        .notEmpty()
        .withMessage('价格不能为空')
        .custom((value) => {
          // 支持数字和字符串格式的价格
          const priceStr = String(value);
          const numPrice = parseFloat(priceStr.replace(/[^\d.]/g, ''));
          return !isNaN(numPrice) && numPrice > 0;
        })
        .withMessage('价格格式不正确'),

      body('contact_name')
        .notEmpty()
        .withMessage('联系人姓名不能为空')
        .isLength({ max: 100 })
        .withMessage('联系人姓名长度不能超过100个字符'),

      body('phone_number')
        .notEmpty()
        .withMessage('联系电话不能为空')
        .isLength({ min: 8, max: 15 })
        .withMessage('手机号长度应在8-15位之间')
        .matches(/^[\d\+\-\(\)\s]+$/)
        .withMessage('手机号只能包含数字、加号、减号、括号和空格')
        .custom((value) => {
          // 清理格式，只保留数字
          const cleanPhone = value.replace(/[\s\-\+\(\)]/g, '');
          // 支持中国大陆手机号（11位）和香港手机号（8位）
          const chinaMainlandPattern = /^1[3-9]\d{9}$/;
          const hongKongPattern = /^[2-9]\d{7}$/;
          return chinaMainlandPattern.test(cleanPhone) || hongKongPattern.test(cleanPhone);
        })
        .withMessage('手机号格式不正确'),

      // 可选字段验证
      body('vehicle_type')
        .optional()
        .isIn([1, 2, 3, 4, 5])
        .withMessage('车辆类型不正确'),

      body('fuel_type')
        .optional()
        .isLength({ max: 50 })
        .withMessage('燃料类型长度不能超过50个字符'),

      body('seats')
        .optional()
        .custom((value) => {
          if (value) {
            // 验证座位数格式：只允许数字、汉字"座位"、空格
            const seatsPattern = /^[\d\s座位]*$/;
            if (!seatsPattern.test(value)) {
              throw new Error('座位数只能包含数字和"座位"文字');
            }
          }
          return true;
        })
        .withMessage('座位数格式不正确'),

      body('engine_volume')
        .optional()
        .isLength({ max: 50 })
        .withMessage('发动机容积长度不能超过50个字符'),

      body('transmission')
        .optional()
        .isLength({ max: 50 })
        .withMessage('传动方式长度不能超过50个字符'),

      body('description')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('描述长度不能超过2000个字符'),

      body('publish_status')
        .optional()
        .isIn([1, 2, 3])
        .withMessage('发布状态不正确')
    ];
  }

  /**
   * 发布车辆（包含图片上传）
   */
  static async publishVehicle(req, res) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          code: 400,
          message: '参数验证失败',
          errors: errors.array()
        });
      }

      const userId = req.user.id;
      const vehicleData = req.body;
      const files = req.files || [];

      // 开始数据库事务
      const transaction = await sequelize.transaction();

      try {
        // 生成车辆ID
        const vehicleId = VehiclePublishController.generateVehicleId(userId);

        // 处理价格字段
        const priceStr = String(vehicleData.price);
        const currentPrice = parseFloat(priceStr.replace(/[^\d.]/g, ''));

        // 准备车辆数据
        const vehicleCreateData = {
          vehicle_id: vehicleId,
          user_id: userId,
          vehicle_type: parseInt(vehicleData.vehicle_type) || 1,
          vehicle_status: 1, // 未售
          publish_status: parseInt(vehicleData.publish_status) || 1, // 已发布
          page_number: 0, // 用户发布的设为0
          car_number: vehicleId,
          car_url: '', // 用户发布暂无URL
          car_category: vehicleData.car_category || '',
          car_brand: vehicleData.car_brand,
          car_model: vehicleData.car_model,
          fuel_type: vehicleData.fuel_type || '',
          seats: this.formatSeatsField(vehicleData.seats),
          engine_volume: vehicleData.engine_volume || '',
          transmission: vehicleData.transmission || '',
          year: vehicleData.year,
          description: vehicleData.description || '',
          price: vehicleData.price,
          current_price: currentPrice,
          original_price: currentPrice, // 原价与现价相同
          contact_info: JSON.stringify({
            name: vehicleData.contact_name,
            phone: vehicleData.phone_number,
            email: vehicleData.contact_email || ''
          }),
          contact_name: vehicleData.contact_name,
          phone_number: vehicleData.phone_number,
          is_special_offer: vehicleData.is_special_offer ? 1 : 0,
          transport_purpose: vehicleData.transport_purpose || ''
        };

        // 创建车辆记录
        const vehicle = await Vehicle.create(vehicleCreateData, { transaction });

        // 处理图片上传
        const imageResults = [];
        if (files.length > 0) {
          for (let i = 0; i < files.length; i++) {
            const file = files[i];

            try {
              // 处理图片（压缩和生成缩略图）
              const processResult = await ImageProcessor.processSingleImage(
                file,
                path.dirname(file.path),
                {
                  generateThumbnail: true,
                  thumbnailSize: 300,
                  compression: true
                }
              );

              // 生成相对路径用于存储
              const relativePath = path.relative(path.join(__dirname, '../uploads'), processResult.path);
              const thumbnailRelativePath = processResult.thumbnailPath
                ? path.relative(path.join(__dirname, '../uploads'), processResult.thumbnailPath)
                : null;

              // 创建图片记录
              const imageRecord = await VehicleImage.create({
                vehicle_id: vehicleId,
                image_url: `/uploads/${relativePath}`,
                local_path: processResult.path,
                image_order: i,
                thumbnail_url: thumbnailRelativePath ? `/uploads/${thumbnailRelativePath}` : null
              }, { transaction });

              imageResults.push({
                id: imageRecord.id,
                image_url: imageRecord.image_url,
                thumbnail_url: imageRecord.thumbnail_url,
                image_order: i,
                width: processResult.width,
                height: processResult.height,
                size: processResult.size
              });
            } catch (error) {
              console.error('图片处理失败:', error);
              // 继续处理其他图片，不中断整个流程
            }
          }
        }

        // 提交事务
        await transaction.commit();

        // 返回成功响应
        res.json({
          code: 200,
          message: '车辆发布成功',
          data: {
            vehicle: {
              id: vehicle.id,
              vehicle_id: vehicle.vehicle_id,
              car_brand: vehicle.car_brand,
              car_model: vehicle.car_model,
              year: vehicle.year,
              price: vehicle.price,
              current_price: vehicle.current_price,
              publish_status: vehicle.publish_status,
              created_at: vehicle.created_at
            },
            images: imageResults,
            image_count: imageResults.length
          }
        });

      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      console.error('车辆发布失败:', error);
      res.status(500).json({
        code: 500,
        message: '车辆发布失败',
        error: error.message
      });
    }
  }

  /**
   * 保存车辆草稿
   */
  static async saveDraft(req, res) {
    try {
      const userId = req.user.id;
      const vehicleData = { ...req.body, publish_status: 2 }; // 设为草稿状态

      // 验证必填字段（草稿模式验证较宽松）
      if (!vehicleData.car_brand) {
        return res.status(400).json({
          code: 400,
          message: '车辆品牌不能为空'
        });
      }

      const transaction = await sequelize.transaction();

      try {
        const vehicleId = VehiclePublishController.generateVehicleId(userId);

        const vehicleCreateData = {
          vehicle_id: vehicleId,
          user_id: userId,
          vehicle_type: parseInt(vehicleData.vehicle_type) || 1,
          vehicle_status: 1,
          publish_status: 2, // 草稿
          page_number: 0,
          car_number: vehicleId,
          car_url: '',
          car_category: vehicleData.car_category || '',
          car_brand: vehicleData.car_brand,
          car_model: vehicleData.car_model || '',
          fuel_type: vehicleData.fuel_type || '',
          seats: this.formatSeatsField(vehicleData.seats),
          engine_volume: vehicleData.engine_volume || '',
          transmission: vehicleData.transmission || '',
          year: vehicleData.year || new Date().getFullYear().toString(),
          description: vehicleData.description || '',
          price: vehicleData.price || '0',
          current_price: vehicleData.current_price || 0,
          original_price: vehicleData.original_price || 0,
          contact_info: vehicleData.contact_info || '',
          contact_name: vehicleData.contact_name || '',
          phone_number: vehicleData.phone_number || '',
          is_special_offer: vehicleData.is_special_offer ? 1 : 0,
          transport_purpose: vehicleData.transport_purpose || ''
        };

        const vehicle = await Vehicle.create(vehicleCreateData, { transaction });
        await transaction.commit();

        res.json({
          code: 200,
          message: '草稿保存成功',
          data: {
            vehicle_id: vehicle.vehicle_id,
            publish_status: vehicle.publish_status,
            created_at: vehicle.created_at
          }
        });

      } catch (error) {
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      console.error('草稿保存失败:', error);
      res.status(500).json({
        code: 500,
        message: '草稿保存失败',
        error: error.message
      });
    }
  }

  /**
   * 获取用户的车辆列表
   */
  static async getMyVehicles(req, res) {
    try {
      const userId = req.user.id;
      const {
        page = 1,
        limit = 20,
        publish_status,
        vehicle_type,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = { user_id: userId };

      // 添加筛选条件
      if (publish_status) {
        whereClause.publish_status = parseInt(publish_status);
      }
      if (vehicle_type) {
        whereClause.vehicle_type = parseInt(vehicle_type);
      }

      // 查询车辆列表
      const { count, rows } = await Vehicle.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: VehicleImage,
            as: 'images',
            attributes: ['id', 'image_url', 'image_order', 'thumbnail_url'],
            required: false,
            limit: 1, // 只获取第一张图片作为封面
            order: [['image_order', 'ASC']]
          }
        ],
        order: [[sort_by, sort_order]],
        limit: parseInt(limit),
        offset: offset,
        distinct: true
      });

      res.json({
        code: 200,
        message: '获取成功',
        data: {
          vehicles: rows,
          pagination: {
            current_page: parseInt(page),
            per_page: parseInt(limit),
            total: count,
            total_pages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      console.error('获取用户车辆列表失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取车辆列表失败',
        error: error.message
      });
    }
  }

  /**
   * 更新车辆信息
   */
  static async updateVehicle(req, res) {
    try {
      const userId = req.user.id;
      const { vehicleId } = req.params;
      const updateData = req.body;

      // 查找车辆并验证权限
      const vehicle = await Vehicle.findOne({
        where: {
          vehicle_id: vehicleId,
          user_id: userId
        }
      });

      if (!vehicle) {
        return res.status(404).json({
          code: 404,
          message: '车辆不存在或无权限操作'
        });
      }

      // 定义允许更新的字段白名单
      const allowedFields = [
        'vehicle_type', 'car_category', 'car_brand', 'car_model', 
        'fuel_type', 'seats', 'engine_volume', 'transmission', 
        'year', 'description', 'price', 'current_price', 'original_price',
        'contact_info', 'contact_name', 'phone_number', 'is_special_offer',
        'transport_purpose', 'publish_status'
      ];

      // 过滤更新数据，只保留允许的字段
      const filteredUpdateData = {};
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          // 特殊处理座位数字段
          if (key === 'seats') {
            filteredUpdateData[key] = this.formatSeatsField(value);
          } else {
            filteredUpdateData[key] = value;
          }
        }
      }

      // 如果没有有效的更新字段
      if (Object.keys(filteredUpdateData).length === 0) {
        return res.status(400).json({
          code: 400,
          message: '没有有效的字段需要更新'
        });
      }

      // 更新车辆信息
      await vehicle.update(filteredUpdateData);

      res.json({
        code: 200,
        message: '车辆信息更新成功',
        data: vehicle
      });

    } catch (error) {
      console.error('更新车辆信息失败:', error);
      res.status(500).json({
        code: 500,
        message: '更新车辆信息失败'
      });
    }
  }

  /**
   * 删除车辆
   */
  static async deleteVehicle(req, res) {
    try {
      const userId = req.user.id;
      const { vehicleId } = req.params;

      // 查找车辆并验证权限
      const vehicle = await Vehicle.findOne({
        where: {
          vehicle_id: vehicleId,
          user_id: userId
        }
      });

      if (!vehicle) {
        return res.status(404).json({
          code: 404,
          message: '车辆不存在或无权限操作'
        });
      }

      // 删除车辆（级联删除相关图片记录）
      await vehicle.destroy();

      res.json({
        code: 200,
        message: '车辆删除成功'
      });

    } catch (error) {
      console.error('删除车辆失败:', error);
      res.status(500).json({
        code: 500,
        message: '删除车辆失败',
        error: error.message
      });
    }
  }
}

module.exports = VehiclePublishController;