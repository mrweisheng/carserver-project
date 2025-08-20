const VisitorController = require('../controllers/visitorController');
const { getClientIP } = require('../utils/ipUtils');

/**
 * 访客统计中间件
 * 自动记录每个请求的访客信息，不影响主业务流程
 */
const visitorStatsMiddleware = async (req, res, next) => {
  // 记录请求开始时间
  const startTime = Date.now();
  
  // 获取访客IP地址（使用清理后的IP）
  const ipAddress = getClientIP(req);
  
  // 获取用户代理信息
  const userAgent = req.get('User-Agent') || '';
  
  // 继续处理请求
  next();
  
  // 请求处理完成后，异步记录访客统计（不阻塞响应）
  setImmediate(async () => {
    try {
      // 排除一些不需要统计的请求
      const excludePaths = [
        '/api/visitors/stats',
        '/api/visitors/today', 
        '/api/visitors/details',
        '/api/visitors/record',
        '/favicon.ico',
        '/robots.txt',
        '/api/captcha' // 排除验证码请求
      ];
      
      // 检查是否是需要排除的路径
      const shouldExclude = excludePaths.some(path => req.path.includes(path));
      
      if (!shouldExclude) {
        const result = await VisitorController.recordVisit(ipAddress, userAgent);
        
        // 记录访问日志（可选）
        if (process.env.NODE_ENV === 'development') {
          console.log(`[访客统计] ${ipAddress} - ${req.method} ${req.path} - ${result.isNewVisitor ? '新访客' : '重复访问'}`);
        }
      }
    } catch (error) {
      // 访客统计失败不影响主业务流程，只记录错误日志
      console.error('[访客统计错误]', error.message);
    }
  });
};

/**
 * 可选的详细访客统计中间件
 * 记录更详细的访问信息，包括请求时间、响应时间等
 */
const detailedVisitorStatsMiddleware = async (req, res, next) => {
  const startTime = Date.now();
  
  // 获取访客信息（使用清理后的IP）
  const ipAddress = getClientIP(req);
  
  const userAgent = req.get('User-Agent') || '';
  const referer = req.get('Referer') || '';
  const acceptLanguage = req.get('Accept-Language') || '';
  
  // 继续处理请求
  next();
  
  // 请求处理完成后记录详细信息
  setImmediate(async () => {
    try {
      const responseTime = Date.now() - startTime;
      
      // 这里可以扩展记录更多信息，比如响应时间、状态码等
      const result = await VisitorController.recordVisit(ipAddress, userAgent);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[详细访客统计] ${ipAddress} - ${req.method} ${req.path} - ${responseTime}ms - ${result.isNewVisitor ? '新访客' : '重复访问'}`);
      }
    } catch (error) {
      console.error('[详细访客统计错误]', error.message);
    }
  });
};

/**
 * 条件访客统计中间件
 * 根据条件决定是否记录访客统计
 */
const conditionalVisitorStatsMiddleware = (options = {}) => {
  const {
    excludePaths = [],
    includePaths = [],
    excludeMethods = ['OPTIONS'],
    minResponseTime = 0, // 最小响应时间阈值
    enabled = true
  } = options;
  
  return async (req, res, next) => {
    if (!enabled) {
      return next();
    }
    
    const startTime = Date.now();
    
    // 检查是否排除该请求
    const shouldExclude = 
      excludeMethods.includes(req.method) ||
      excludePaths.some(path => req.path.includes(path)) ||
      (includePaths.length > 0 && !includePaths.some(path => req.path.includes(path)));
    
    if (shouldExclude) {
      return next();
    }
    
    // 获取访客IP地址（使用清理后的IP）
    const ipAddress = getClientIP(req);
    
    const userAgent = req.get('User-Agent') || '';
    
    next();
    
    setImmediate(async () => {
      try {
        const responseTime = Date.now() - startTime;
        
        // 如果响应时间小于阈值，不记录
        if (responseTime < minResponseTime) {
          return;
        }
        
        await VisitorController.recordVisit(ipAddress, userAgent);
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[条件访客统计] ${ipAddress} - ${req.method} ${req.path} - ${responseTime}ms`);
        }
      } catch (error) {
        console.error('[条件访客统计错误]', error.message);
      }
    });
  };
};

module.exports = {
  visitorStatsMiddleware,
  detailedVisitorStatsMiddleware,
  conditionalVisitorStatsMiddleware
};
