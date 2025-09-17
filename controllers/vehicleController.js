const { Vehicle, VehicleImage, sequelize } = require('../models');
const { Op } = require('sequelize');
const { processPhoneNumber } = require('../utils/phoneMask');
const { batchExtractContactInfo } = require('../utils/contactExtractor');
const { cacheUtils } = require('../utils/cache');

// 缓存对象 - 服务重启时自动清空
// 特价车辆缓存
let specialOfferCache = {
  date: null,
  data: null,
  serverStartTime: Date.now() // 记录真实的服务启动时间戳
};

// 精选车辆缓存（日级缓存）
let featuredVehiclesCache = {
  date: null,
  data: null,
  serverStartTime: Date.now()
};

// 最新车辆缓存（小时级缓存）
let latestVehiclesCache = {
  hour: null,
  data: null,
  serverStartTime: Date.now()
};

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
        seats,
        sort_by = 'created_at',
        sort_order = 'DESC'
      } = req.query;

      // 检查用户登录状态
      const isLoggedIn = req.user && req.user.id;

      // 验证和规范化分页参数
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

      // 生成缓存键（使用验证后的参数）
      const cacheKey = cacheUtils.generateKey('vehicles:list', {
        page: pageNum, limit: limitNum, vehicle_type, vehicle_status, car_brand, car_model,
        year, min_price, max_price, seats, sort_by, sort_order, isLoggedIn: isLoggedIn ? '1' : '0'
      });

      // 尝试从缓存获取数据
      const cachedData = cacheUtils.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      


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

      // 座位数量查询
      if (seats) {
        console.log('🔍 [座位搜索] 开始处理座位搜索参数:', seats);

        // 前端传入纯数字，如 "5" 或 "7"
        console.log('🔍 [座位搜索] 兼容匹配模式:', seats);

        // 兼容性处理：支持多种座位数格式（优先精确匹配）
        where.seats = {
          [Op.or]: [
            { [Op.eq]: `${seats}座位` },    // 标准格式：5座位 (新数据格式)
            { [Op.eq]: `${seats} 座位` },   // 带空格格式：5 座位 (存量数据格式)
            { [Op.eq]: seats },            // 纯数字格式：5 (可能的旧格式)
            { [Op.like]: `${seats}座` },     // 以数字+座开头：5座, 5座位等
            { [Op.like]: `${seats} 座` }     // 以数字+座开头：5 座, 5 座位等
          ]
        };

        console.log('🔍 [座位搜索] 兼容匹配条件已设置，优先精确匹配');
      }
      
      // 座位搜索条件检查
      if (seats) {
        console.log('🔍 [座位搜索] 座位搜索条件已设置，查询条件包含:', Object.keys(where));
      }

      // 构建排序条件
      const order = [];
      if (sort_by && ['created_at', 'updated_at', 'current_price', 'year'].includes(sort_by)) {
        order.push([sort_by, sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']);
      } else {
        // 性能优化：如果有座位搜索，优先按座位排序以充分利用索引
        if (seats) {
          order.push(['seats', 'ASC']);
          // 添加二级排序，确保结果稳定
          order.push(['id', 'ASC']);
        } else {
          order.push(['created_at', 'DESC']);
        }
      }

      // 执行分页查询
      const offset = (pageNum - 1) * limitNum;
      
      console.log('🔍 [座位搜索] 开始执行查询，分页参数:', { page: pageNum, limit: limitNum, offset });
      
      // 性能监控
      const startTime = Date.now();
      
      // 性能优化：座位搜索时使用更精简的字段列表
      const attributes = seats ? [
        'id', 'vehicle_id', 'vehicle_type', 'vehicle_status', 'car_brand', 
        'car_model', 'year', 'fuel_type', 'seats', 'current_price', 'original_price',
        'contact_name', 'phone_number', 'contact_info', 'is_special_offer', 'created_at'
      ] : [
        'id', 'vehicle_id', 'vehicle_type', 'vehicle_status', 'car_brand', 
        'car_model', 'year', 'fuel_type', 'seats', 'engine_volume', 
        'transmission', 'description', 'price', 'current_price', 'original_price',
        'contact_name', 'phone_number', 'contact_info', 'is_special_offer', 'created_at'
      ];

      // 统一包含图片信息，确保API行为一致性
      const includeOptions = [
        {
          model: VehicleImage,
          as: 'images',
          attributes: ['id', 'image_url', 'image_order'],
          required: false,
          order: [['image_order', 'ASC']]
        }
      ];

      const { count, rows: vehicles } = await Vehicle.findAndCountAll({
        where,
        order,
        limit: limitNum,
        offset,
        attributes,
        include: includeOptions
      });
      
      const queryTime = Date.now() - startTime;
      console.log('🔍 [座位搜索] 查询完成，找到车辆:', count, '辆，耗时:', queryTime, 'ms');

      // 统一数据处理逻辑，确保所有查询都包含完整的联系信息处理
      const processedVehicles = vehicles.map(vehicle => {
        const vehicleData = vehicle.toJSON();
        
        // 如果contact_name或phone_number为null，尝试从contact_info中提取
        if (!vehicleData.contact_name || !vehicleData.phone_number) {
          if (vehicleData.contact_info) {
            // 提取联系人姓名（通常在开头）
            if (!vehicleData.contact_name) {
              const nameMatch = vehicleData.contact_info.match(/^([^\s]+(?:\s+[^\s]+)*?)(?:\s|電|电|郵|邮|Tel|tel|電話|电话|手機|手机|WhatsApp|微信|:|：)/i);
              if (nameMatch) {
                vehicleData.contact_name = nameMatch[1].trim();
              }
            }
            
            // 提取电话号码（支持多种格式：8位数字、带区号等）
            if (!vehicleData.phone_number) {
              const phoneMatch = vehicleData.contact_info.match(/(?:電話|电话|Tel|tel|手機|手机|WhatsApp|微信|Phone|phone)[：:]?\s*([\d\s\-\+\(\)]{8,15})|\b(\d{8})\b/);
              if (phoneMatch) {
                vehicleData.phone_number = (phoneMatch[1] || phoneMatch[2]).replace(/[\s\-\(\)]/g, '');
              }
            }
          }
        }
        
        if (vehicleData.phone_number) {
          vehicleData.phone_number = processPhoneNumber(vehicleData.phone_number, isLoggedIn);
        }
        return vehicleData;
      });

      // 计算分页信息
      const totalPages = Math.ceil(count / limitNum);
      const hasNext = pageNum < totalPages;
      const hasPrev = pageNum > 1;

      const responseData = {
        code: 200,
        message: '查询成功',
        data: {
          vehicles: processedVehicles,
          pagination: {
            current_page: pageNum,
            total_pages: totalPages,
            total_count: count,
            limit: limitNum,
            has_next: hasNext,
            has_prev: hasPrev
          }
        }
      };

      // 设置缓存（10分钟过期）
      cacheUtils.set(cacheKey, responseData, 600);

      res.json(responseData);

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
   * 获取特价车辆（豪华品牌10辆 + 7座丰田/本田5辆，价格≤40000，每日更新）
   */
  async getSpecialOfferVehicles(req, res) {
    try {
      // 检查用户登录状态
      const isLoggedIn = req.user && req.user.id;
      
      // 获取当前日期（YYYY-MM-DD格式）
      const today = new Date().toISOString().split('T')[0];
      
      // 生成缓存键
      const cacheKey = cacheUtils.generateKey('vehicles:special', {
        date: today,
        isLoggedIn: isLoggedIn ? '1' : '0'
      });

      // 尝试从缓存获取数据
      const cachedData = cacheUtils.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      
      // 豪华品牌列表
      const luxuryBrands = [
        '平治 MERCEDES-BENZ', '寶馬 BMW', '保時捷 PORSCHE', '奧迪 AUDI', '特斯拉 TESLA',
        '凌志 LEXUS', '越野路華 LAND ROVER', '法拉利 FERRARI', '賓利 BENTLEY',
        '林寶堅尼 LAMBORGHINI', '瑪莎拉蒂 MASERATI', '勞斯萊斯 ROLLS ROYCE',
        '麥拿倫 MCLAREN', '積架 JAGUAR', '阿士頓馬田 ASTON MARTIN', '蓮花 LOTUS',
        'INFINITI'
      ];
      
      // 构建查询条件：豪华品牌，价格接近40000，2010年或以后
      const where = {
        car_brand: {
          [Op.in]: luxuryBrands // 限定豪华品牌
        },
        current_price: {
          [Op.and]: [
            { [Op.lte]: 40000 }, // 不超过40000
            { [Op.gt]: 0 } // 价格大于0
          ]
        },
        [Op.or]: [
          {
            year: {
              [Op.gte]: '2008' // 年份大于等于2008
            }
          },
          {
            year: {
              [Op.like]: '%2008%' // 包含2008的年份字符串
            }
          },
          {
            year: {
              [Op.like]: '%2009%' // 包含2009的年份字符串
            }
          },
          {
            year: {
              [Op.like]: '%2010%' // 包含2010的年份字符串
            }
          },
          {
            year: {
              [Op.like]: '%201[1-9]%' // 包含2011-2019的年份
            }
          },
          {
            year: {
              [Op.like]: '%202[0-9]%' // 包含2020-2029的年份
            }
          }
        ]
      };
      
      // 查询符合条件的车辆，按价格降序（接近40000的排前面），然后按年份降序
      const vehicles = await Vehicle.findAll({
        where,
        order: [
          ['current_price', 'DESC'], // 价格高的排前面（接近40000）
          ['year', 'DESC'] // 年份新的排前面
        ],
        attributes: [
          'id', 'vehicle_id', 'vehicle_type', 'vehicle_status', 'car_brand', 
          'car_model', 'year', 'fuel_type', 'seats', 'engine_volume', 
          'transmission', 'description', 'price', 'current_price', 'original_price',
          'contact_name', 'phone_number', 'contact_info', 'is_special_offer', 'created_at'
        ],
        include: [
          {
            model: VehicleImage,
            as: 'images',
            attributes: ['id', 'image_url', 'image_order'],
            required: false,
            order: [['image_order', 'ASC']]
          }
        ]
      });
      
      if (vehicles.length === 0) {
        return res.json({
          code: 200,
          message: '暂无符合条件的特价车辆',
          data: {
            vehicles: [],
            cache_date: today,
            total_count: 0
          }
        });
      }
      
      // 先清除所有车辆的特价标记
      await Vehicle.update(
        { is_special_offer: 0 },
        { where: {} }
      );
      
      // 使用日期作为随机种子，确保每天结果稳定但不同
       const dateBasedSeed = new Date(today + 'T00:00:00').getTime();
       
       // 简单的伪随机数生成器（基于日期种子）
       function seededRandom(seed) {
         const x = Math.sin(seed) * 10000;
         return x - Math.floor(x);
       }
       
       // 基于种子的数组洗牌函数
       function seededShuffle(array, seed) {
         const shuffled = [...array];
         for (let i = shuffled.length - 1; i > 0; i--) {
           const j = Math.floor(seededRandom(seed + i) * (i + 1));
           [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
         }
         return shuffled;
       }
       
       // 按品牌分组所有符合条件的车辆，确保品牌多样性
       const vehiclesByBrand = {};
       vehicles.forEach(vehicle => {
         const brand = vehicle.car_brand; // 使用数据库中的实际字段名
         if (!vehiclesByBrand[brand]) {
           vehiclesByBrand[brand] = [];
         }
         vehiclesByBrand[brand].push(vehicle);
       });
      
       // 从每个品牌中选择车辆，确保品牌分布均匀
       let selectedVehicles = [];
       const brands = Object.keys(vehiclesByBrand);
       
       // 使用日期种子打乱品牌顺序，确保每天品牌选择顺序不同
       const shuffledBrands = seededShuffle(brands, dateBasedSeed);
       
       // 第一轮：每个品牌选择1辆，确保品牌多样性
       shuffledBrands.forEach((brand, index) => {
         const brandVehicles = vehiclesByBrand[brand];
         if (brandVehicles.length > 0 && selectedVehicles.length < 10) {
           const shuffled = seededShuffle(brandVehicles, dateBasedSeed + index * 100);
           selectedVehicles.push(shuffled[0]);
         }
       });
       
       // 第二轮：从剩余车辆中补充到10辆
       if (selectedVehicles.length < 10) {
         const remaining = vehicles.filter(v => !selectedVehicles.find(s => s.id === v.id));
         const shuffled = seededShuffle(remaining, dateBasedSeed + 1000);
         const needed = 10 - selectedVehicles.length;
         selectedVehicles.push(...shuffled.slice(0, needed));
       }
       
       // 确保最终只有10辆车
       selectedVehicles = selectedVehicles.slice(0, 10);
       
       // 最终基于日期种子打乱顺序
       selectedVehicles = seededShuffle(selectedVehicles, dateBasedSeed + 2000);
       
       // 移除重复检测逻辑，确保每天结果固定
       // 注释：每天的特价车辆应该是固定的，不需要避免重复
      
      // 查询7座丰田/本田车辆（新增功能）
      const sevenSeaterBrands = ['豐田 TOYOTA', '本田 HONDA'];
      const sevenSeaterWhere = {
        car_brand: {
          [Op.in]: sevenSeaterBrands
        },
        seats: {
          [Op.or]: [
            { [Op.eq]: '7' },
            { [Op.eq]: '7座' },
            { [Op.like]: '%7座%' },
            { [Op.like]: '%7 座%' }
          ]
        },
        current_price: {
          [Op.and]: [
            { [Op.lte]: 40000 }, // 不超过40000
            { [Op.gt]: 0 } // 价格大于0
          ]
        },
        [Op.or]: [
          {
            year: {
              [Op.gte]: '2010' // 年份大于等于2010
            }
          },
          {
            year: {
              [Op.like]: '%2010%' // 包含2010的年份字符串
            }
          },
          {
            year: {
              [Op.like]: '%201[1-9]%' // 包含2011-2019的年份
            }
          },
          {
            year: {
              [Op.like]: '%202[0-9]%' // 包含2020-2029的年份
            }
          }
        ]
      };
      
      // 查询7座车辆，按价格降序（接近40000的排前面），然后按年份降序
      const sevenSeaterVehicles = await Vehicle.findAll({
        where: sevenSeaterWhere,
        order: [
          ['current_price', 'DESC'], // 价格高的排前面（接近40000）
          ['year', 'DESC'] // 年份新的排前面
        ],
        attributes: [
          'id', 'vehicle_id', 'vehicle_type', 'vehicle_status', 'car_brand', 
          'car_model', 'year', 'fuel_type', 'seats', 'engine_volume', 
          'transmission', 'description', 'price', 'current_price', 'original_price',
          'contact_name', 'phone_number', 'contact_info', 'is_special_offer', 'created_at'
        ],
        include: [
          {
            model: VehicleImage,
            as: 'images',
            attributes: ['id', 'image_url', 'image_order'],
            required: false,
            order: [['image_order', 'ASC']]
          }
        ]
      });
      
      // 从7座车辆中选择5辆（使用相同的日期种子逻辑）
      let selectedSevenSeaters = [];
      if (sevenSeaterVehicles.length > 0) {
        // 按品牌分组7座车辆
        const sevenSeatersByBrand = {};
        sevenSeaterVehicles.forEach(vehicle => {
          const brand = vehicle.car_brand;
          if (!sevenSeatersByBrand[brand]) {
            sevenSeatersByBrand[brand] = [];
          }
          sevenSeatersByBrand[brand].push(vehicle);
        });
        
        const sevenSeaterBrandList = Object.keys(sevenSeatersByBrand);
        const shuffledSevenSeaterBrands = seededShuffle(sevenSeaterBrandList, dateBasedSeed + 3000);
        
        // 第一轮：每个品牌选择车辆，确保品牌多样性
        shuffledSevenSeaterBrands.forEach((brand, index) => {
          const brandVehicles = sevenSeatersByBrand[brand];
          if (brandVehicles.length > 0 && selectedSevenSeaters.length < 5) {
            const shuffled = seededShuffle(brandVehicles, dateBasedSeed + 3000 + index * 100);
            // 从该品牌选择多辆车（如果需要）
            const needed = Math.min(5 - selectedSevenSeaters.length, Math.ceil(5 / sevenSeaterBrandList.length));
            selectedSevenSeaters.push(...shuffled.slice(0, needed));
          }
        });
        
        // 第二轮：从剩余7座车辆中补充到5辆
        if (selectedSevenSeaters.length < 5) {
          const remainingSevenSeaters = sevenSeaterVehicles.filter(v => !selectedSevenSeaters.find(s => s.id === v.id));
          const shuffled = seededShuffle(remainingSevenSeaters, dateBasedSeed + 4000);
          const needed = 5 - selectedSevenSeaters.length;
          selectedSevenSeaters.push(...shuffled.slice(0, needed));
        }
        
        // 确保最终只有5辆7座车
        selectedSevenSeaters = selectedSevenSeaters.slice(0, 5);
        
        // 最终基于日期种子打乱7座车辆顺序
        selectedSevenSeaters = seededShuffle(selectedSevenSeaters, dateBasedSeed + 5000);
      }
      
      // 合并所有选中的车辆（10辆特价车 + 5辆7座车）
      const allSelectedVehicles = [...selectedVehicles, ...selectedSevenSeaters];
      
      // 标记选中的车辆为特价车辆
      if (allSelectedVehicles.length > 0) {
        const selectedIds = allSelectedVehicles.map(v => v.id);
        await Vehicle.update(
          { is_special_offer: 1 },
          { where: { id: { [Op.in]: selectedIds } } }
        );
      }
      
      // 处理车辆数据（提取联系人信息）- 包含豪华车和7座车
      const processedVehicles = allSelectedVehicles.map(vehicle => {
        const vehicleData = vehicle.toJSON();
        
        // 映射字段名称以保持API一致性
        vehicleData.brand = vehicleData.car_brand;
        vehicleData.model = vehicleData.car_model;
        
        // 更新is_special_offer字段为1（因为这些车辆已被选为特价车辆）
        vehicleData.is_special_offer = 1;
        
        // 如果contact_name或phone_number为null，尝试从contact_info中提取
        if (!vehicleData.contact_name || !vehicleData.phone_number) {
          if (vehicleData.contact_info) {
            // 提取联系人姓名
            if (!vehicleData.contact_name) {
              const nameMatch = vehicleData.contact_info.match(/^([^\s]+(?:\s+[^\s]+)*?)(?:\s|電|电|郵|邮|Tel|tel|電話|电话|手機|手机|WhatsApp|微信|:|：)/i);
              if (nameMatch) {
                vehicleData.contact_name = nameMatch[1].trim();
              }
            }
            
            // 提取电话号码
            if (!vehicleData.phone_number) {
              const phoneMatch = vehicleData.contact_info.match(/(?:電話|电话|Tel|tel|手機|手机|WhatsApp|微信|Phone|phone)[：:]?\s*([\d\s\-\+\(\)]{8,15})|\b(\d{8})\b/);
              if (phoneMatch) {
                vehicleData.phone_number = (phoneMatch[1] || phoneMatch[2]).replace(/[\s\-\(\)]/g, '');
              }
            }
          }
        }
        
        return vehicleData;
      });
      
      // 更新缓存（存储原始数据，不包含脱敏处理）
      specialOfferCache = {
        date: today,
        data: processedVehicles,
        serverStartTime: specialOfferCache.serverStartTime
      };
      
      // 处理手机号脱敏后返回
      const finalVehicles = processedVehicles.map(vehicle => {
        const vehicleData = { ...vehicle };
        if (vehicleData.phone_number) {
          vehicleData.phone_number = processPhoneNumber(vehicleData.phone_number, isLoggedIn);
        }
        return vehicleData;
      });
      
      const responseData = {
        code: 200,
        message: '查询成功',
        data: {
          vehicles: finalVehicles,
          cache_date: today,
          total_count: finalVehicles.length,
          luxury_count: selectedVehicles.length,
          seven_seater_count: selectedSevenSeaters.length
        }
      };

      // 设置缓存（5分钟过期）
      cacheUtils.set(cacheKey, responseData, 300);

      res.json(responseData);
      
    } catch (error) {
      console.error('获取特价车辆失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取特价车辆失败',
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

      // 生成缓存键
      const cacheKey = cacheUtils.generateKey('vehicles:detail', {
        vehicleId,
        isLoggedIn: isLoggedIn ? '1' : '0'
      });

      // 尝试从缓存获取数据
      const cachedData = cacheUtils.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }
      


      // 查询车辆基本信息
      const vehicle = await Vehicle.findOne({
        where: { vehicle_id: vehicleId },
        attributes: [
          'id', 'vehicle_id', 'vehicle_type', 'vehicle_status', 'page_number',
          'car_number', 'car_url', 'car_category', 'car_brand', 'car_model',
          'fuel_type', 'seats', 'engine_volume', 'transmission', 'year',
          'description', 'price', 'current_price', 'original_price',
          'contact_info', 'update_date', 'extra_fields', 'contact_name',
          'phone_number', 'is_special_offer', 'created_at', 'updated_at'
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

      // 如果contact_name或phone_number为null，尝试从contact_info中提取
      if (!vehicleData.contact_name || !vehicleData.phone_number) {
        if (vehicleData.contact_info) {
          // 提取联系人姓名（通常在开头）
           if (!vehicleData.contact_name) {
             const nameMatch = vehicleData.contact_info.match(/^([^\s]+(?:\s+[^\s]+)*?)(?:\s|電|电|郵|邮|Tel|tel|電話|电话|手機|手机|WhatsApp|微信|:|：)/i);
             if (nameMatch) {
               vehicleData.contact_name = nameMatch[1].trim();
             }
           }
           
           // 提取电话号码（支持多种格式：8位数字、带区号等）
           if (!vehicleData.phone_number) {
             const phoneMatch = vehicleData.contact_info.match(/(?:電話|电话|Tel|tel|手機|手机|WhatsApp|微信|Phone|phone)[：:]?\s*([\d\s\-\+\(\)]{8,15})|\b(\d{8})\b/);
             if (phoneMatch) {
               vehicleData.phone_number = (phoneMatch[1] || phoneMatch[2]).replace(/[\s\-\(\)]/g, '');
             }
           }
        }
      }

      // 处理手机号脱敏
      if (vehicleData.phone_number) {
        vehicleData.phone_number = processPhoneNumber(vehicleData.phone_number, isLoggedIn);
      }

      const responseData = {
        code: 200,
        message: '查询成功',
        data: vehicleData
      };

      // 设置缓存（5分钟过期）
      cacheUtils.set(cacheKey, responseData, 300);

      res.json(responseData);

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
   * 获取精选车辆（日级缓存）
   */
  async getFeaturedVehicles(req, res) {
    try {
      // 检查用户登录状态
      const isLoggedIn = req.user && req.user.id;
      
      // 获取当前日期（YYYY-MM-DD格式）
      const today = new Date().toISOString().split('T')[0];
      
      // 生成缓存键
      const cacheKey = cacheUtils.generateKey('vehicles:featured', {
        date: today,
        isLoggedIn: isLoggedIn ? '1' : '0'
      });

      // 尝试从缓存获取数据
      const cachedData = cacheUtils.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }

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

      // 使用日期作为随机种子，确保每天结果稳定但不同
      const dateBasedSeed = new Date(today + 'T00:00:00').getTime();
      
      // 简单的伪随机数生成器（基于日期种子）
      function seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      }
      
      // 基于种子的数组洗牌函数
      function seededShuffle(array, seed) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(seededRandom(seed + i) * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      }

      // 查询更多车辆然后随机选择，避免COUNT查询
      const vehicles = await Vehicle.findAll({
        where,
        order: [['current_price', 'DESC'], ['year', 'DESC']], // 价格和年份排序
        limit: 50, // 查询50辆然后随机选择6辆
        attributes: [
          'id', 'vehicle_id', 'vehicle_type', 'vehicle_status', 'car_brand', 
          'car_model', 'year', 'fuel_type', 'seats', 'engine_volume', 
          'transmission', 'description', 'price', 'current_price', 'original_price',
          'contact_name', 'phone_number', 'contact_info', 'is_special_offer', 'created_at'
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

      // 如果没有符合条件的车辆，直接返回
      if (vehicles.length === 0) {
        return res.json({
          code: 200,
          message: '暂无符合条件的精选车辆',
          data: {
            vehicles: [],
            total_count: 0
          }
        });
      }

      // 使用种子随机选择6辆车
      const shuffledVehicles = seededShuffle(vehicles, dateBasedSeed);
      const selectedVehicles = shuffledVehicles.slice(0, 6);

      // 批量提取联系信息
      const extractedVehicles = batchExtractContactInfo(selectedVehicles);
      
      // 更新缓存（存储原始数据，不包含脱敏手机号）
      featuredVehiclesCache.date = today;
      featuredVehiclesCache.data = extractedVehicles;
      
      // 处理手机号脱敏
      const processedVehicles = extractedVehicles.map(vehicleData => {
        const result = { ...vehicleData };
        if (result.phone_number) {
          result.phone_number = processPhoneNumber(result.phone_number, isLoggedIn);
        }
        return result;
      });

      const responseData = {
        code: 200,
        message: '获取精选车辆成功',
        data: {
          vehicles: processedVehicles,
          total_count: processedVehicles.length
        }
      };

      // 设置缓存（10分钟过期）
      cacheUtils.set(cacheKey, responseData, 600);

      res.json(responseData);

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
   * 获取最新上架车辆（小时级缓存）
   */
  async getLatestVehicles(req, res) {
    try {
      // 检查用户登录状态
      const isLoggedIn = req.user && req.user.id;
      
      // 获取当前小时（YYYY-MM-DD-HH格式）
      const now = new Date();
      const currentHour = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}`;
      
      // 生成缓存键
      const cacheKey = cacheUtils.generateKey('vehicles:latest', {
        hour: currentHour,
        isLoggedIn: isLoggedIn ? '1' : '0'
      });

      // 尝试从缓存获取数据
      const cachedData = cacheUtils.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }

      // 直接计算30天前的时间，无需额外查询
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

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
          [Op.gte]: thirtyDaysAgo // 30天内上架的
        }
      };

      // 使用小时作为随机种子，确保每小时结果稳定但不同
      const hourBasedSeed = new Date(currentHour.replace(/-/g, '/') + ':00:00').getTime();
      
      // 简单的伪随机数生成器（基于小时种子）
      function seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      }
      
      // 基于种子的数组洗牌函数
      function seededShuffle(array, seed) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(seededRandom(seed + i) * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      }

      // 查询更多车辆然后随机选择，避免COUNT查询
      const vehicles = await Vehicle.findAll({
        where,
        order: [['created_at', 'DESC'], ['current_price', 'DESC']], // 按创建时间和价格排序
        limit: 50, // 查询50辆然后随机选择6辆
        attributes: [
          'id', 'vehicle_id', 'vehicle_type', 'vehicle_status', 'car_brand', 
          'car_model', 'year', 'fuel_type', 'seats', 'engine_volume', 
          'transmission', 'description', 'price', 'current_price', 'original_price',
          'contact_name', 'phone_number', 'contact_info', 'is_special_offer', 'created_at'
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

      // 如果没有符合条件的车辆，直接返回
      if (vehicles.length === 0) {
        return res.json({
          code: 200,
          message: '暂无最新上架车辆',
          data: {
            vehicles: [],
            total_count: 0
          }
        });
      }

      // 使用种子随机选择6辆车
      const shuffledVehicles = seededShuffle(vehicles, hourBasedSeed);
      const selectedVehicles = shuffledVehicles.slice(0, 6);

      // 批量提取联系信息
      const extractedVehicles = batchExtractContactInfo(selectedVehicles);
      
      // 更新缓存（存储原始数据，不包含脱敏手机号）
      latestVehiclesCache.hour = currentHour;
      latestVehiclesCache.data = extractedVehicles;
      
      // 处理手机号脱敏
      const processedVehicles = extractedVehicles.map(vehicleData => {
        const result = { ...vehicleData };
        if (result.phone_number) {
          result.phone_number = processPhoneNumber(result.phone_number, isLoggedIn);
        }
        return result;
      });

      const responseData = {
        code: 200,
        message: '获取最新上架车辆成功',
        data: {
          vehicles: processedVehicles,
          total_count: processedVehicles.length
        }
      };

      // 设置缓存（5分钟过期）
      cacheUtils.set(cacheKey, responseData, 300);

      res.json(responseData);

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

  /**
   * 获取缓存统计信息
   */
  async getCacheStats(req, res) {
    try {
      const stats = cacheUtils.getStats();
      res.json({
        code: 200,
        message: '获取缓存统计成功',
        data: stats
      });
    } catch (error) {
      console.error('获取缓存统计失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取缓存统计失败',
        data: null
      });
    }
  }

  /**
   * 清空所有缓存
   */
  async clearCache(req, res) {
    try {
      cacheUtils.clear();
      res.json({
        code: 200,
        message: '缓存已清空',
        data: null
      });
    } catch (error) {
      console.error('清空缓存失败:', error);
      res.status(500).json({
        code: 500,
        message: '清空缓存失败',
        data: null
      });
    }
  }


}

module.exports = new VehicleController();