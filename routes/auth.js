const express = require('express');
const { body } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const {
  loginRateLimit,
  registerRateLimit,
  requireCaptcha
} = require('../middleware/antiCrawler');
const {
  register,
  login,
  getCurrentUser,
  logout
} = require('../controllers/authController');

const router = express.Router();

// 验证规则
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在3-50个字符之间')
    .matches(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/)
    .withMessage('用户名只能包含字母、数字、下划线和中文'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('密码长度至少6个字符'),
  body('real_name')
    .isLength({ min: 1, max: 50 })
    .withMessage('联络人姓名不能为空且长度不能超过50个字符'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('邮箱格式不正确')
    .normalizeEmail(),
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('性别必须是 male、female 或 other'),
  body('phone')
    .custom((value) => {
      // 支持中国大陆手机号（11位）和香港手机号（8位）
      const chinaMainlandPattern = /^1[3-9]\d{9}$/; // 中国大陆11位手机号
      const hongKongPattern = /^[2-9]\d{7}$/; // 香港8位手机号
      
      if (chinaMainlandPattern.test(value) || hongKongPattern.test(value)) {
        return true;
      }
      throw new Error('手机号格式不正确，请输入有效的中国大陆手机号（11位）或香港手机号（8位）');
    }),
  body('captcha')
    .isLength({ min: 4, max: 4 })
    .withMessage('验证码必须是4位数字'),
  body('captchaId')
    .notEmpty()
    .withMessage('验证码ID不能为空')
];

const loginValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在3-50个字符之间'),
  body('password')
    .notEmpty()
    .withMessage('密码不能为空'),
  body('captcha')
    .optional()
    .isLength({ min: 4, max: 4 })
    .withMessage('验证码必须是4位数字'),
  body('captchaId')
    .optional()
    .notEmpty()
    .withMessage('验证码ID不能为空')
];

// 用户注册（带反爬虫保护）
router.post('/register', 
  registerRateLimit,           // 注册频率限制
  registerValidation,          // 参数验证
  requireCaptcha,             // 验证码验证
  register
);

// 用户登录（带反爬虫保护）
router.post('/login', 
  loginRateLimit,             // 登录频率限制
  loginValidation,            // 参数验证
  login
);

// 获取当前用户信息
router.get('/me', authenticateToken, getCurrentUser);

// 用户登出
router.post('/logout', authenticateToken, logout);

module.exports = router;
