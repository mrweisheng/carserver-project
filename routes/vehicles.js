const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { optionalAuth } = require('../middleware/auth');

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
 * @desc 获取特价车辆（7座，价格不超过40000，随机10个，日缓存）
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
 * @route GET /api/vehicles/:vehicleId
 * @desc 获取车辆详情
 * @access Public (支持可选身份验证)
 */
router.get('/:vehicleId', optionalAuth, vehicleController.getVehicleDetail);

module.exports = router;
