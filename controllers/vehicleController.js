const { Vehicle, VehicleImage, sequelize } = require('../models');
const { Op } = require('sequelize');
const { processPhoneNumber } = require('../utils/phoneMask');

class VehicleController {
  /**
   * 获取车辆列表（基础查询）
   */
  async getVehicles(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        vehicle_type,
        vehicle_status,
        car_brand,
        car_model,
        year,
        min_price,
        max_price,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      // 检查用户登录状态
      const isLoggedIn = req.user && req.user.id;
      
      // 调试日志
      console.log('车辆列表请求 - 用户信息:', {
        hasUser: !!req.user,
        userId: req.user?.id,
        username: req.user?.username,
        isLoggedIn: isLoggedIn,
        authHeader: req.headers.authorization ? 'Bearer token存在' : '无Authorization头'
      });

      // 构建查询条件
      const where = {};
      
      if (vehicle_type) {
        where.vehicle_type = vehicle_type;
      }
      
      if (vehicle_status) {
        where.vehicle_status = vehicle_status;
      }
      
      if (car_brand) {
        // 支持精确匹配和模糊匹配
        if (car_brand.startsWith('exact:')) {
          // 精确匹配：exact:丰田
          const exactBrand = car_brand.substring(6);
          where.car_brand = exactBrand;
        } else {
          // 默认模糊匹配：丰田
          where.car_brand = {
            [Op.like]: `%${car_brand}%`
          };
        }
      }
      
      if (req.query.car_model) {
        // 支持精确匹配和模糊匹配
        if (req.query.car_model.startsWith('exact:')) {
          // 精确匹配：exact:卡罗拉
          const exactModel = req.query.car_model.substring(6);
          where.car_model = exactModel;
        } else {
          // 默认模糊匹配：卡罗拉
          where.car_model = {
            [Op.like]: `%${req.query.car_model}%`
          };
        }
      }
      
      if (year) {
        // 支持多种年份查询模式
        if (year.includes('-')) {
          // 范围查询：2016-2018
          const [startYear, endYear] = year.split('-').map(y => y.trim());
          if (startYear && endYear && !isNaN(startYear) && !isNaN(endYear)) {
            where.year = {
              [Op.and]: [
                { [Op.gte]: startYear },
                { [Op.lte]: endYear }
              ]
            };
          }
        } else if (year.includes('>') || year.includes('<')) {
          // 比较查询：>2016, <2018, >=2016, <=2018
          const operator = year.match(/^([><]=?)(\d+)/);
          if (operator) {
            const [, op, yearValue] = operator;
            switch (op) {
              case '>':
                where.year = { [Op.gt]: yearValue };
                break;
              case '>=':
                where.year = { [Op.gte]: yearValue };
                break;
              case '<':
                where.year = { [Op.lt]: yearValue };
                break;
              case '<=':
                where.year = { [Op.lte]: yearValue };
                break;
            }
          }
        } else {
          // 默认模糊匹配：支持 2016, 2016年, 2016款 等格式
          where.year = {
            [Op.like]: `%${year}%`
          };
        }
      }

      // 价格区间查询
      if (min_price || max_price) {
        where.current_price = {};
        
        if (min_price && !isNaN(min_price)) {
          where.current_price[Op.gte] = parseFloat(min_price);
        }
        
        if (max_price && !isNaN(max_price)) {
          where.current_price[Op.lte] = parseFloat(max_price);
        }
      }

      // 构建排序条件
      const order = [];
      if (sort_by && ['created_at', 'updated_at', 'current_price', 'year'].includes(sort_by)) {
        order.push([sort_by, sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']);
      } else {
        order.push(['created_at', 'DESC']);
      }

      // 执行分页查询
      const offset = (parseInt(page) - 1) * parseInt(limit);
      const { count, rows: vehicles } = await Vehicle.findAndCountAll({
        where,
        order,
        limit: parseInt(limit),
        offset,
        attributes: [
          'id', 'vehicle_id', 'vehicle_type', 'vehicle_status', 'car_brand', 
          'car_model', 'year', 'fuel_type', 'seats', 'engine_volume', 
          'transmission', 'description', 'price', 'current_price', 'original_price',
          'contact_name', 'phone_number', 'created_at'
        ],
        include: [
          {
            model: VehicleImage,
            as: 'images',
            attributes: ['id', 'image_url', 'image_order'],
            required: false, // 左连接，即使没有图片也返回车辆
            order: [['image_order', 'ASC']] // 按图片顺序排序
          }
        ]
      });

      // 处理手机号脱敏
      const processedVehicles = vehicles.map(vehicle => {
        const vehicleData = vehicle.toJSON();
        if (vehicleData.phone_number) {
          vehicleData.phone_number = processPhoneNumber(vehicleData.phone_number, isLoggedIn);
        }
        return vehicleData;
      });

      // 计算分页信息
      const totalPages = Math.ceil(count / parseInt(limit));
      const hasNext = parseInt(page) < totalPages;
      const hasPrev = parseInt(page) > 1;

      res.json({
        code: 200,
        message: '查询成功',
        data: {
          vehicles: processedVehicles,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_count: count,
            limit: parseInt(limit),
            has_next: hasNext,
            has_prev: hasPrev
          }
        }
      });

    } catch (error) {
      console.error('获取车辆列表失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取车辆列表失败',
        data: null
      });
    }
  }

  /**
   * 获取车辆详情
   */
  async getVehicleDetail(req, res) {
    try {
      const { vehicleId } = req.params;

      if (!vehicleId) {
        return res.status(400).json({
          code: 400,
          message: '车辆ID不能为空',
          data: null
        });
      }

      // 检查用户登录状态
      const isLoggedIn = req.user && req.user.id;
      
      // 调试日志
      console.log('车辆详情请求 - 用户信息:', {
        hasUser: !!req.user,
        userId: req.user?.id,
        username: req.user?.username,
        isLoggedIn: isLoggedIn,
        authHeader: req.headers.authorization ? 'Bearer token存在' : '无Authorization头',
        vehicleId: vehicleId
      });

      // 查询车辆基本信息
      const vehicle = await Vehicle.findOne({
        where: { vehicle_id: vehicleId },
        attributes: [
          'id', 'vehicle_id', 'vehicle_type', 'vehicle_status', 'page_number',
          'car_number', 'car_url', 'car_category', 'car_brand', 'car_model',
          'fuel_type', 'seats', 'engine_volume', 'transmission', 'year',
          'description', 'price', 'current_price', 'original_price',
          'contact_info', 'update_date', 'extra_fields', 'contact_name',
          'phone_number', 'created_at', 'updated_at'
        ]
      });

      if (!vehicle) {
        return res.status(404).json({
          code: 404,
          message: '车辆不存在',
          data: null
        });
      }

      // 查询车辆图片
      const images = await VehicleImage.findAll({
        where: { vehicle_id: vehicleId },
        order: [['image_order', 'ASC']],
        attributes: ['id', 'image_url', 'image_order']
      });

      // 获取车辆类型和状态的中文描述
      const vehicleTypeMap = {
        1: '私家车',
        2: '客货车',
        3: '货车',
        4: '电单车',
        5: '经典车'
      };

      const vehicleStatusMap = {
        1: '未售',
        2: '已售'
      };

      // 构建响应数据
      const vehicleData = vehicle.toJSON();
      vehicleData.vehicle_type_text = vehicleTypeMap[vehicleData.vehicle_type] || '未知';
      vehicleData.vehicle_status_text = vehicleStatusMap[vehicleData.vehicle_status] || '未知';
      vehicleData.images = images;

      // 处理手机号脱敏
      if (vehicleData.phone_number) {
        vehicleData.phone_number = processPhoneNumber(vehicleData.phone_number, isLoggedIn);
      }

      res.json({
        code: 200,
        message: '查询成功',
        data: vehicleData
      });

    } catch (error) {
      console.error('获取车辆详情失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取车辆详情失败',
        data: null
      });
    }
  }

  /**
   * 获取车辆统计信息
   */
  async getVehicleStats(req, res) {
    try {
      // 统计各类型车辆数量
      const typeStats = await Vehicle.findAll({
        attributes: [
          'vehicle_type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['vehicle_type'],
        raw: true
      });

      // 统计各状态车辆数量
      const statusStats = await Vehicle.findAll({
        attributes: [
          'vehicle_status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['vehicle_status'],
        raw: true
      });

      // 统计品牌分布（前10名）
      const brandStats = await Vehicle.findAll({
        attributes: [
          'car_brand',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          car_brand: {
            [Op.not]: null
          }
        },
        group: ['car_brand'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 10,
        raw: true
      });

      // 统计总车辆数
      const totalCount = await Vehicle.count();

      res.json({
        code: 200,
        message: '查询成功',
        data: {
          total_count: totalCount,
          type_distribution: typeStats,
          status_distribution: statusStats,
          top_brands: brandStats
        }
      });

    } catch (error) {
      console.error('获取车辆统计失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取车辆统计失败',
        data: null
      });
    }
  }

  /**
   * 获取精选车辆
   */
  async getFeaturedVehicles(req, res) {
    try {
      // 检查用户登录状态
      const isLoggedIn = req.user && req.user.id;

      // 构建查询条件
      const where = {
        vehicle_type: 1, // 私家车
        year: {
          [Op.and]: [
            { [Op.gte]: '2017' },
            { [Op.lte]: '2025' }
          ]
        },
        current_price: {
          [Op.and]: [
            { [Op.gte]: 150000 }, // 最低15万
            { [Op.lte]: 270000 }  // 最高27万
          ]
        },
        original_price: {
          [Op.and]: [
            { [Op.not]: null }, // 原价不为空
            { [Op.gt]: sequelize.col('current_price') } // 原价大于现价
          ]
        }
      };

      // 执行随机查询
      const vehicles = await Vehicle.findAll({
        where,
        order: sequelize.random(), // 随机排序
        limit: 6,
        attributes: [
          'id', 'vehicle_id', 'vehicle_type', 'vehicle_status', 'car_brand', 
          'car_model', 'year', 'fuel_type', 'seats', 'engine_volume', 
          'transmission', 'description', 'price', 'current_price', 'original_price',
          'contact_name', 'phone_number', 'created_at'
        ],
        include: [
          {
            model: VehicleImage,
            as: 'images',
            attributes: ['id', 'image_url', 'image_order'],
            required: false, // 左连接，即使没有图片也返回车辆
            order: [['image_order', 'ASC']] // 按图片顺序排序
          }
        ]
      });

      // 处理手机号脱敏
      const processedVehicles = vehicles.map(vehicle => {
        const vehicleData = vehicle.toJSON();
        if (vehicleData.phone_number) {
          vehicleData.phone_number = processPhoneNumber(vehicleData.phone_number, isLoggedIn);
        }
        return vehicleData;
      });

      res.json({
        code: 200,
        message: '获取精选车辆成功',
        data: {
          vehicles: processedVehicles,
          total_count: processedVehicles.length
        }
      });

    } catch (error) {
      console.error('获取精选车辆失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取精选车辆失败',
        data: null
      });
    }
  }

  /**
   * 获取最新上架车辆
   */
  async getLatestVehicles(req, res) {
    try {
      // 检查用户登录状态
      const isLoggedIn = req.user && req.user.id;

      // 先查询最新一条记录的创建时间
      const latestVehicle = await Vehicle.findOne({
        order: [['created_at', 'DESC']],
        attributes: ['created_at']
      });

      if (!latestVehicle) {
        return res.json({
          code: 200,
          message: '暂无最新上架车辆',
          data: {
            vehicles: [],
            total_count: 0
          }
        });
      }

      // 计算一个月前的时间
      const latestTime = new Date(latestVehicle.created_at);
      const oneMonthAgo = new Date(latestTime.getTime() - 30 * 24 * 60 * 60 * 1000);

      // 构建查询条件
      const where = {
        year: {
          [Op.and]: [
            { [Op.gte]: '2017' },
            { [Op.lte]: '2025' }
          ]
        },
        current_price: {
          [Op.and]: [
            { [Op.gte]: 150000 }, // 最低15万
            { [Op.lte]: 270000 }  // 最高27万
          ]
        },
        original_price: {
          [Op.and]: [
            { [Op.not]: null }, // 原价不为空
            { [Op.gt]: sequelize.col('current_price') } // 原价大于现价
          ]
        },
        created_at: {
          [Op.gte]: oneMonthAgo // 一个月内上架的
        }
      };

      // 执行随机查询
      const vehicles = await Vehicle.findAll({
        where,
        order: sequelize.random(), // 随机排序
        limit: 6,
        attributes: [
          'id', 'vehicle_id', 'vehicle_type', 'vehicle_status', 'car_brand', 
          'car_model', 'year', 'fuel_type', 'seats', 'engine_volume', 
          'transmission', 'description', 'price', 'current_price', 'original_price',
          'contact_name', 'phone_number', 'created_at'
        ],
        include: [
          {
            model: VehicleImage,
            as: 'images',
            attributes: ['id', 'image_url', 'image_order'],
            required: false, // 左连接，即使没有图片也返回车辆
            order: [['image_order', 'ASC']] // 按图片顺序排序
          }
        ]
      });

      // 处理手机号脱敏
      const processedVehicles = vehicles.map(vehicle => {
        const vehicleData = vehicle.toJSON();
        if (vehicleData.phone_number) {
          vehicleData.phone_number = processPhoneNumber(vehicleData.phone_number, isLoggedIn);
        }
        return vehicleData;
      });

      res.json({
        code: 200,
        message: '获取最新上架车辆成功',
        data: {
          vehicles: processedVehicles,
          total_count: processedVehicles.length
        }
      });

    } catch (error) {
      console.error('获取最新上架车辆失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取最新上架车辆失败',
        data: null
      });
    }
  }

  /**
   * 获取所有汽车品牌列表
   */
  async getCarBrands(req, res) {
    try {
      const brands = await Vehicle.findAll({
        attributes: [
          'car_brand',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          car_brand: {
            [Op.not]: null,
            [Op.ne]: '' // 排除空字符串
          }
        },
        group: ['car_brand'],
        order: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'DESC'], // 按数量降序
          ['car_brand', 'ASC'] // 数量相同时按品牌名升序
        ],
        raw: true
      });

      // 格式化返回数据
      const brandList = brands.map(brand => ({
        brand: brand.car_brand,
        count: parseInt(brand.count),
        label: `${brand.car_brand} (${brand.count}辆)`
      }));

      res.json({
        code: 200,
        message: '获取品牌列表成功',
        data: {
          total_brands: brandList.length,
          brands: brandList
        }
      });

    } catch (error) {
      console.error('获取品牌列表失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取品牌列表失败',
        data: null
      });
    }
  }
}

module.exports = new VehicleController();
