const rateLimit = require('express-rate-limit');
const { User } = require('../models');



// 1. 基础频率限制
const basicRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_BASIC_WINDOW_MS),
  max: parseInt(process.env.RATE_LIMIT_BASIC_MAX_REQUESTS),
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // 使用IP + User-Agent作为key，更精确的识别
    return req.ip + '|' + (req.headers['user-agent'] || 'unknown');
  }
});

// 2. 严格频率限制（针对敏感接口）
const strictRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_STRICT_WINDOW_MS),
  max: parseInt(process.env.RATE_LIMIT_STRICT_MAX_REQUESTS),
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 3. 登录频率限制
const loginRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS),
  max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX_REQUESTS),
  message: {
    code: 429,
    message: '登录尝试过于频繁，请15分钟后再试',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 4. 注册频率限制
const registerRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_REGISTER_WINDOW_MS),
  max: parseInt(process.env.RATE_LIMIT_REGISTER_MAX_REQUESTS),
  message: {
    code: 429,
    message: '注册尝试过于频繁，请1小时后再试',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false
});

// 5. 检测爬虫特征
const detectCrawler = (req, res, next) => {
  // 如果爬虫检测被禁用，直接跳过
  if (process.env.CRAWLER_DETECTION_ENABLED !== 'true') {
    return next();
  }

  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip;
  
  // 检测常见爬虫
  const crawlerPatterns = [
    /bot/i,
    /spider/i,
    /crawler/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /phantomjs/i,
    /headless/i,
    /selenium/i,
    /puppeteer/i
  ];
  
  // 检测可疑的User-Agent
  const isCrawler = crawlerPatterns.some(pattern => pattern.test(userAgent));
  
  // 检测可疑的请求头
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'x-forwarded',
    'x-cluster-client-ip',
    'forwarded-for',
    'forwarded'
  ];
  
  const hasSuspiciousHeaders = suspiciousHeaders.some(header => 
    req.headers[header] && req.headers[header] !== ip
  );
  
  // 检测请求频率（支持两种模式）
  // 模式1：按IP+User-Agent限制（默认）
  // 模式2：按IP限制（更严格）
  const useStrictIPLimit = process.env.CRAWLER_STRICT_IP_LIMIT === 'true';
  const requestKey = useStrictIPLimit ? ip : `${ip}-${userAgent}`;
  const now = Date.now();
  
  if (!req.app.locals.requestHistory) {
    req.app.locals.requestHistory = new Map();
  }
  
  const history = req.app.locals.requestHistory.get(requestKey) || [];
  const recentRequests = history.filter(time => now - time < 60000); // 1分钟内的请求
  
  // 如果1分钟内请求超过配置的限制，标记为可疑
  const maxRequestsPerMinute = parseInt(process.env.CRAWLER_MAX_REQUESTS_PER_MINUTE);
  const isHighFrequency = recentRequests.length > maxRequestsPerMinute;
  
  if (isCrawler || hasSuspiciousHeaders || isHighFrequency) {
    // 记录可疑请求
    const limitType = useStrictIPLimit ? 'IP' : 'IP+User-Agent';
    console.log(`可疑请求检测: IP=${ip}, UA=${userAgent}, 频率=${recentRequests.length}/min, 限制模式=${limitType}`);
    
    // 对于明显的爬虫，返回假数据或延迟响应
    if (isCrawler) {
      return res.status(403).json({
        code: 403,
        message: '访问被拒绝',
        data: null
      });
    }
  }
  
  // 更新请求历史
  recentRequests.push(now);
  req.app.locals.requestHistory.set(requestKey, recentRequests);
  
  next();
};

// 6. 验证码中间件（针对敏感操作）
const requireCaptcha = (req, res, next) => {
  if (process.env.CAPTCHA_ENABLED !== 'true') {
    return next();
  }

  const { captcha, captchaId } = req.body;
  
  if (!captcha || !captchaId) {
    return res.status(400).json({
      code: 400,
      message: '验证码不能为空',
      data: null
    });
  }
  
  // 这里应该验证验证码
  // 暂时简单实现，实际应该查询数据库验证
  if (captcha.length !== 4) {
    return res.status(400).json({
      code: 400,
      message: '验证码格式错误',
      data: null
    });
  }
  
  next();
};

// 7. 设备指纹检测
const deviceFingerprint = (req, res, next) => {
  const fingerprint = req.headers['x-device-fingerprint'];
  const ip = req.ip;
  const userAgent = req.headers['user-agent'] || '';
  
  // 简单的设备指纹验证
  if (fingerprint) {
    // 这里可以添加更复杂的设备指纹验证逻辑
    req.deviceFingerprint = fingerprint;
  }
  
  next();
};

// 8. 动态响应延迟（增加爬虫成本）
const dynamicDelay = (req, res, next) => {
  if (process.env.DYNAMIC_DELAY_ENABLED !== 'true') {
    return next();
  }

  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip;
  
  // 检测可疑请求，增加随机延迟
  const suspicious = /bot|spider|crawler/i.test(userAgent);
  
  if (suspicious) {
    const minMs = parseInt(process.env.DYNAMIC_DELAY_MIN_MS);
    const maxMs = parseInt(process.env.DYNAMIC_DELAY_MAX_MS);
    const delay = Math.random() * (maxMs - minMs) + minMs;
    setTimeout(next, delay);
  } else {
    next();
  }
};

// 9. 内容保护中间件
const contentProtection = (req, res, next) => {
  // 添加响应头，防止内容被轻易抓取
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // 对于API响应，添加一些随机性
  if (req.path.startsWith('/api/')) {
    // 在响应中添加随机时间戳，增加爬虫解析难度
    req.responseTimestamp = Date.now();
  }
  
  next();
};

// 10. 智能反爬虫策略
const intelligentAntiCrawler = (req, res, next) => {
  const ip = req.ip;
  const userAgent = req.headers['user-agent'] || '';
  const referer = req.headers['referer'] || '';
  
  // 检查请求来源
  const isInternalRequest = referer.includes(req.get('host'));
  const isDirectAccess = !referer;
  
  // 对于直接访问API的请求，增加限制
  if (isDirectAccess && req.path.startsWith('/api/')) {
    // 记录直接访问
    console.log(`直接API访问: ${req.method} ${req.path} from ${ip}`);
  }
  
  // 检查同一API的请求时间间隔（只限制重复请求同一接口）
  const now = Date.now();
  const apiKey = `${ip}-${req.method}-${req.path}`;
  const lastRequest = req.app.locals.lastRequest?.[apiKey] || 0;
  const timeDiff = now - lastRequest;
  
  // 如果同一API请求间隔太短（小于配置的最小间隔），可能是自动化工具
  const minRequestInterval = parseInt(process.env.CRAWLER_MIN_REQUEST_INTERVAL_MS);
  // 只有当间隔小于10毫秒时才限制（非常宽松）
  if (timeDiff < 10 && req.path.startsWith('/api/')) {
    return res.status(429).json({
      code: 429,
      message: '请求过于频繁',
      data: null
    });
  }
  
  // 更新最后请求时间（按API分别记录）
  if (!req.app.locals.lastRequest) {
    req.app.locals.lastRequest = {};
  }
  req.app.locals.lastRequest[apiKey] = now;
  
  next();
};

module.exports = {
  basicRateLimit,
  strictRateLimit,
  loginRateLimit,
  registerRateLimit,
  detectCrawler,
  requireCaptcha,
  deviceFingerprint,
  dynamicDelay,
  contentProtection,
  intelligentAntiCrawler
};
