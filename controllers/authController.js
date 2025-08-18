const { User } = require('../models');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { getRegionByIP, getClientIP } = require('../utils/ipUtils');
const { verifyCaptcha } = require('../utils/captcha');

// 用户注册
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: '参数错误',
        data: errors.array()
      });
    }

    const { 
      username, 
      password, 
      real_name, 
      email, 
      gender, 
      phone,
      captcha,
      captchaId
    } = req.body;

    // 验证验证码
    const captchaResult = verifyCaptcha(captchaId, captcha);
    if (!captchaResult.valid) {
      return res.status(400).json({
        code: 400,
        message: captchaResult.message,
        data: null
      });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          ...(email ? [{ email }] : [])
        ]
      }
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({
          code: 400,
          message: '用户名已存在',
          data: null
        });
      } else {
        return res.status(400).json({
          code: 400,
          message: '邮箱已存在',
          data: null
        });
      }
    }

    // 获取客户端IP和地区信息
    const clientIP = getClientIP(req);
    const regionInfo = await getRegionByIP(clientIP, { User });

    // 创建用户
    const user = await User.create({
      username,
      password,
      real_name,
      email,
      gender,
      phone,
      region: regionInfo.region,
      country: regionInfo.country,
      city: regionInfo.city,
      isp: regionInfo.isp,
      timezone: regionInfo.timezone,
      ip_address: clientIP,
      location_updated_at: new Date(),
      status: 1, // 正常状态
      role: 1 // 普通用户
    });

    // 生成JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key-here',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      code: 201,
      message: '注册成功',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      code: 500,
      message: '注册失败',
      data: null
    });
  }
};

// 用户登录
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        code: 400,
        message: '参数错误',
        data: errors.array()
      });
    }

    const { username, password, captcha, captchaId } = req.body;

    // 如果提供了验证码，则验证
    if (captcha && captchaId) {
      const captchaResult = verifyCaptcha(captchaId, captcha);
      if (!captchaResult.valid) {
        return res.status(400).json({
          code: 400,
          message: captchaResult.message,
          data: null
        });
      }
    }

    // 查找用户（使用用户名登录）
    const user = await User.findOne({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误',
        data: null
      });
    }

    // 验证密码
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        code: 401,
        message: '用户名或密码错误',
        data: null
      });
    }

    // 检查用户状态
    if (user.status !== 1) {
      return res.status(403).json({
        code: 403,
        message: '账户已被禁用或待验证',
        data: null
      });
    }

    // 更新最后登录时间和IP
    const clientIP = getClientIP(req);
    const regionInfo = await getRegionByIP(clientIP, { User });
    
    await user.update({
      last_login_at: new Date(),
      last_login_ip: clientIP,
      country: regionInfo.country,
      city: regionInfo.city,
      isp: regionInfo.isp,
      timezone: regionInfo.timezone,
      location_updated_at: new Date()
    });

    // 生成JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key-here',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      code: 500,
      message: '登录失败',
      data: null
    });
  }
};

// 获取当前用户信息
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在',
        data: null
      });
    }

    res.json({
      code: 200,
      message: '获取用户信息成功',
      data: user.toJSON()
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取用户信息失败',
      data: null
    });
  }
};

// 用户登出
const logout = async (req, res) => {
  try {
    // 这里可以添加token黑名单逻辑
    res.json({
      code: 200,
      message: '登出成功',
      data: null
    });
  } catch (error) {
    console.error('登出失败:', error);
    res.status(500).json({
      code: 500,
      message: '登出失败',
      data: null
    });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  logout
};
