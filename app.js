const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 确保日志目录存在
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 导入数据库模型
const { syncDatabase } = require('./models');

// 导入反爬虫中间件
const {
  basicRateLimit,
  strictRateLimit,
  loginRateLimit,
  registerRateLimit,
  detectCrawler,
  deviceFingerprint,
  dynamicDelay,
  contentProtection,
  intelligentAntiCrawler
} = require('./middleware/antiCrawler');

const app = express();
const PORT = process.env.PORT || 3000;

// 配置信任代理（解决express-rate-limit的X-Forwarded-For警告）
app.set('trust proxy', 1);

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS配置 - 允许所有跨域请求
app.use(cors({
  origin: true, // 允许所有域名
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Device-Fingerprint']
}));

// 基础中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 反爬虫中间件（按优先级顺序）
app.use(contentProtection);           // 内容保护
app.use(deviceFingerprint);           // 设备指纹检测
app.use(detectCrawler);               // 爬虫检测
app.use(intelligentAntiCrawler);      // 智能反爬虫
app.use(dynamicDelay);                // 动态延迟

// 全局频率限制
app.use(basicRateLimit);

// 路由
const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');

// 使用路由
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);

// 根路由
app.get('/', (req, res) => {
  res.json({
    message: 'Car Server API',
    version: '1.0.0',
    status: 'running',
    timestamp: req.responseTimestamp || Date.now(),
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout'
      }
    }
  });
});

// 测试路由（带反爬虫保护）
app.get('/api/test', strictRateLimit, (req, res) => {
  res.json({
    code: 200,
    message: '测试接口成功',
    data: {
      timestamp: new Date().toISOString(),
      server: 'Car Server',
      requestId: Math.random().toString(36).substr(2, 9)
    }
  });
});

// 验证码接口
app.get('/api/captcha', strictRateLimit, (req, res) => {
  const { generateImageCaptcha } = require('./utils/captcha');
  const captcha = generateImageCaptcha();
  
  res.json({
    code: 200,
    message: '验证码生成成功',
    data: {
      id: captcha.id,
      image: captcha.image
    }
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
    data: null
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('错误:', err.stack);
  
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null
  });
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('反爬虫保护已启用');
  
  // 同步数据库
  try {
    await syncDatabase();
  } catch (error) {
    console.error('数据库同步失败:', error);
  }
});

module.exports = app;
