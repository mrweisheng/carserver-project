const express = require('express');
const router = express.Router();
const VisitorController = require('../controllers/visitorController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @route GET /api/visitors/stats
 * @desc 获取访客统计数据
 * @access Private (需要管理员权限)
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;
    
    // 检查用户权限（只有管理员可以查看统计数据）
    if (req.user.role < 2) {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员可以查看访客统计'
      });
    }

    const result = await VisitorController.getDailyStats(startDate, endDate, parseInt(limit));
    
    if (result.success) {
      res.json({
        code: 200,
        message: result.message,
        data: result.data,
        total: result.total
      });
    } else {
      res.status(500).json({
        code: 500,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('获取访客统计失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取访客统计失败',
      error: error.message
    });
  }
});

/**
 * @route GET /api/visitors/today
 * @desc 获取今日访客统计
 * @access Private (需要管理员权限)
 */
router.get('/today', authenticateToken, async (req, res) => {
  try {
    // 检查用户权限
    if (req.user.role < 2) {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员可以查看访客统计'
      });
    }

    const result = await VisitorController.getTodayStats();
    
    if (result.success) {
      res.json({
        code: 200,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(500).json({
        code: 500,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('获取今日访客统计失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取今日访客统计失败',
      error: error.message
    });
  }
});

/**
 * @route GET /api/visitors/details
 * @desc 获取访客详情列表
 * @access Private (需要管理员权限)
 */
router.get('/details', authenticateToken, async (req, res) => {
  try {
    const { date, page = 1, pageSize = 20 } = req.query;
    
    // 检查用户权限
    if (req.user.role < 2) {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员可以查看访客详情'
      });
    }

    const result = await VisitorController.getVisitorDetails(
      date, 
      parseInt(page), 
      parseInt(pageSize)
    );
    
    if (result.success) {
      res.json({
        code: 200,
        message: result.message,
        data: result.data
      });
    } else {
      res.status(500).json({
        code: 500,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('获取访客详情失败:', error);
    res.status(500).json({
      code: 500,
      message: '获取访客详情失败',
      error: error.message
    });
  }
});

/**
 * @route POST /api/visitors/record
 * @desc 手动记录访客访问（用于测试）
 * @access Private (需要管理员权限)
 */
router.post('/record', authenticateToken, async (req, res) => {
  try {
    const { ipAddress, userAgent } = req.body;
    
    // 检查用户权限
    if (req.user.role < 2) {
      return res.status(403).json({
        code: 403,
        message: '权限不足，只有管理员可以手动记录访客'
      });
    }

    if (!ipAddress) {
      return res.status(400).json({
        code: 400,
        message: 'IP地址不能为空'
      });
    }

    const result = await VisitorController.recordVisit(ipAddress, userAgent || '');
    
    if (result.success) {
      res.json({
        code: 200,
        message: result.message,
        data: {
          isNewVisitor: result.isNewVisitor,
          record: result.record
        }
      });
    } else {
      res.status(500).json({
        code: 500,
        message: result.message,
        error: result.error
      });
    }
  } catch (error) {
    console.error('手动记录访客失败:', error);
    res.status(500).json({
      code: 500,
      message: '手动记录访客失败',
      error: error.message
    });
  }
});

module.exports = router;
