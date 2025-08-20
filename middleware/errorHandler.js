/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  console.error('[错误处理]', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // 如果是数据库唯一约束冲突，返回适当的错误信息
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      code: 409,
      message: '数据冲突，请稍后重试',
      error: 'UNIQUE_CONSTRAINT_VIOLATION'
    });
  }

  // 如果是数据库连接错误
  if (err.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      code: 503,
      message: '数据库连接失败，请稍后重试',
      error: 'DATABASE_CONNECTION_ERROR'
    });
  }

  // 默认错误响应
  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : 'INTERNAL_SERVER_ERROR'
  });
};

module.exports = errorHandler;
