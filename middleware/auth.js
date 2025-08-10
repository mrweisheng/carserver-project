const jwt = require('jsonwebtoken');
const { User } = require('../models');

// 验证JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: '访问令牌缺失',
        data: null
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(403).json({
        code: 403,
        message: '访问令牌无效或已过期',
        data: null
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token验证失败:', error);
    return res.status(403).json({
      code: 403,
      message: '访问令牌无效或已过期',
      data: null
    });
  }
};

// 可选认证（不强制要求登录）
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
      const user = await User.findByPk(decoded.userId);
      
      if (user) {
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    // 可选认证失败不影响继续执行
    next();
  }
};

// 密码强度验证中间件
const validatePasswordStrength = (req, res, next) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({
      code: 400,
      message: '密码不能为空',
      data: null
    });
  }

  // 密码强度检查
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`密码长度至少${minLength}个字符`);
  }
  if (!hasUpperCase) {
    errors.push('密码必须包含至少一个大写字母');
  }
  if (!hasLowerCase) {
    errors.push('密码必须包含至少一个小写字母');
  }
  if (!hasNumbers) {
    errors.push('密码必须包含至少一个数字');
  }
  if (!hasSpecialChar) {
    errors.push('密码必须包含至少一个特殊字符');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      code: 400,
      message: '密码强度不足',
      data: errors
    });
  }

  next();
};

module.exports = {
  authenticateToken,
  optionalAuth,
  validatePasswordStrength
};
