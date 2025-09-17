const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const VehiclePublishController = require('../controllers/vehiclePublishController');
const { optionalAuth, authenticateToken } = require('../middleware/auth');
const {
  vehicleImageUpload,
  singleImageUpload,
  handleUploadError
} = require('../middleware/uploadMiddleware');

/**
 * @route GET /api/vehicles
 * @desc 获取车辆列表（基础查询）
 * @access Public (支持可选身份验证)
 */
router.get('/', optionalAuth, vehicleController.getVehicles);

/**
 * @route GET /api/vehicles/stats
 * @desc 获取车辆统计信息
 * @access Public
 */
router.get('/stats', vehicleController.getVehicleStats);

/**
 * @route GET /api/vehicles/featured
 * @desc 获取精选车辆
 * @access Public (支持可选身份验证)
 */
router.get('/featured', optionalAuth, vehicleController.getFeaturedVehicles);

/**
 * @route GET /api/vehicles/latest
 * @desc 获取最新上架车辆
 * @access Public (支持可选身份验证)
 */
router.get('/latest', optionalAuth, vehicleController.getLatestVehicles);

/**
 * @route GET /api/vehicles/special-offers
 * @desc 获取特价车辆（豪华品牌10辆 + 7座丰田/本田5辆，价格≤40000，每日更新）
 * @access Public (支持可选身份验证)
 */
router.get('/special-offers', optionalAuth, vehicleController.getSpecialOfferVehicles);

/**
 * @route GET /api/vehicles/brands
 * @desc 获取所有汽车品牌列表
 * @access Public
 */
router.get('/brands', vehicleController.getCarBrands);

/**
 * @route GET /api/vehicles/cache/stats
 * @desc 获取缓存统计信息
 * @access Private (需要管理员权限)
 */
router.get('/cache/stats', vehicleController.getCacheStats);

/**
 * @route POST /api/vehicles/cache/clear
 * @desc 清空所有缓存
 * @access Private (需要管理员权限)
 */
router.post('/cache/clear', vehicleController.clearCache);



// ============================================
// 车辆发布管理路由 (需要用户登录)
// ============================================

/**
 * @route POST /api/vehicles/publish
 * @desc 发布车辆（包含图片上传）
 * @access Private (需要用户登录)
 */
router.post('/publish',
  authenticateToken,
  vehicleImageUpload,
  handleUploadError,
  VehiclePublishController.validateVehicleData(),
  VehiclePublishController.publishVehicle
);

/**
 * @route POST /api/vehicles/draft
 * @desc 保存车辆草稿
 * @access Private (需要用户登录)
 */
router.post('/draft',
  authenticateToken,
  VehiclePublishController.saveDraft
);

/**
 * @route GET /api/vehicles/my-vehicles
 * @desc 获取我的车辆列表
 * @access Private (需要用户登录)
 */
router.get('/my-vehicles',
  authenticateToken,
  VehiclePublishController.getMyVehicles
);

/**
 * @route GET /api/vehicles/:vehicleId
 * @desc 获取车辆详情
 * @access Public (支持可选身份验证)
 */
router.get('/:vehicleId', optionalAuth, vehicleController.getVehicleDetail);

/**
 * @route PUT /api/vehicles/:vehicleId
 * @desc 更新车辆信息
 * @access Private (需要用户登录)
 */
router.put('/:vehicleId',
  authenticateToken,
  VehiclePublishController.updateVehicle
);

/**
 * @route DELETE /api/vehicles/:vehicleId
 * @desc 删除车辆
 * @access Private (需要用户登录)
 */
router.delete('/:vehicleId',
  authenticateToken,
  VehiclePublishController.deleteVehicle
);

/**
 * @route POST /api/vehicles/:vehicleId/images
 * @desc 为现有车辆添加图片
 * @access Private (需要用户登录)
 */
router.post('/:vehicleId/images',
  authenticateToken,
  vehicleImageUpload,
  handleUploadError,
  async (req, res) => {
    try {
      // TODO: 实现为现有车辆添加图片的功能
      res.json({
        code: 200,
        message: '功能开发中',
        data: null
      });
    } catch (error) {
      res.status(500).json({
        code: 500,
        message: '添加图片失败',
        error: error.message
      });
    }
  }
);

module.exports = router;
