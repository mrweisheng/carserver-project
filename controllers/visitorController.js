const DailyVisitor = require('../models/DailyVisitor');
const { Op } = require('sequelize');

class VisitorController {
  /**
   * 记录访客访问
   * @param {string} ipAddress - 访客IP地址
   * @param {string} userAgent - 用户代理信息
   * @returns {Promise<Object>} 记录结果
   */
  static async recordVisit(ipAddress, userAgent = '') {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
      
      // 查找今天是否已有该IP的记录
      const existingRecord = await DailyVisitor.findOne({
        where: {
          ip_address: ipAddress,
          visit_date: today
        }
      });

      if (existingRecord) {
        // 如果已存在，更新请求次数和最后访问时间
        await existingRecord.update({
          request_count: existingRecord.request_count + 1,
          last_visit_time: new Date()
        });
        
        return {
          success: true,
          isNewVisitor: false,
          record: existingRecord,
          message: '访客记录已更新'
        };
      } else {
        // 如果是新访客，创建新记录
        const newRecord = await DailyVisitor.create({
          ip_address: ipAddress,
          visit_date: today,
          request_count: 1,
          first_visit_time: new Date(),
          last_visit_time: new Date(),
          user_agent: userAgent
        });
        
        return {
          success: true,
          isNewVisitor: true,
          record: newRecord,
          message: '新访客记录已创建'
        };
      }
    } catch (error) {
      console.error('记录访客访问失败:', error);
      return {
        success: false,
        error: error.message,
        message: '记录访客访问失败'
      };
    }
  }

  /**
   * 获取每日访客统计
   * @param {string} startDate - 开始日期 (YYYY-MM-DD)
   * @param {string} endDate - 结束日期 (YYYY-MM-DD)
   * @param {number} limit - 限制返回条数
   * @returns {Promise<Object>} 统计数据
   */
  static async getDailyStats(startDate = null, endDate = null, limit = 30) {
    try {
      const whereClause = {};
      
      if (startDate && endDate) {
        whereClause.visit_date = {
          [Op.between]: [startDate, endDate]
        };
      } else if (startDate) {
        whereClause.visit_date = {
          [Op.gte]: startDate
        };
      }

      const stats = await DailyVisitor.findAll({
        where: whereClause,
        attributes: [
          'visit_date',
          [DailyVisitor.sequelize.fn('COUNT', DailyVisitor.sequelize.col('id')), 'unique_visitors'],
          [DailyVisitor.sequelize.fn('SUM', DailyVisitor.sequelize.col('request_count')), 'total_requests'],
          [DailyVisitor.sequelize.fn('AVG', DailyVisitor.sequelize.col('request_count')), 'avg_requests_per_visitor'],
          [DailyVisitor.sequelize.fn('MIN', DailyVisitor.sequelize.col('first_visit_time')), 'first_visit_of_day'],
          [DailyVisitor.sequelize.fn('MAX', DailyVisitor.sequelize.col('last_visit_time')), 'last_visit_of_day']
        ],
        group: ['visit_date'],
        order: [['visit_date', 'DESC']],
        limit: limit,
        raw: true
      });

      return {
        success: true,
        data: stats,
        total: stats.length,
        message: '获取访客统计成功'
      };
    } catch (error) {
      console.error('获取访客统计失败:', error);
      return {
        success: false,
        error: error.message,
        message: '获取访客统计失败'
      };
    }
  }

  /**
   * 获取今日访客统计
   * @returns {Promise<Object>} 今日统计数据
   */
  static async getTodayStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const todayStats = await DailyVisitor.findAll({
        where: {
          visit_date: today
        },
        attributes: [
          'visit_date',
          [DailyVisitor.sequelize.fn('COUNT', DailyVisitor.sequelize.col('id')), 'unique_visitors'],
          [DailyVisitor.sequelize.fn('SUM', DailyVisitor.sequelize.col('request_count')), 'total_requests'],
          [DailyVisitor.sequelize.fn('AVG', DailyVisitor.sequelize.col('request_count')), 'avg_requests_per_visitor']
        ],
        group: ['visit_date'],
        raw: true
      });

      const result = todayStats[0] || {
        visit_date: today,
        unique_visitors: 0,
        total_requests: 0,
        avg_requests_per_visitor: 0
      };

      return {
        success: true,
        data: result,
        message: '获取今日访客统计成功'
      };
    } catch (error) {
      console.error('获取今日访客统计失败:', error);
      return {
        success: false,
        error: error.message,
        message: '获取今日访客统计失败'
      };
    }
  }

  /**
   * 获取访客详情列表
   * @param {string} date - 查询日期 (YYYY-MM-DD)
   * @param {number} page - 页码
   * @param {number} pageSize - 每页大小
   * @returns {Promise<Object>} 访客详情列表
   */
  static async getVisitorDetails(date = null, page = 1, pageSize = 20) {
    try {
      const whereClause = {};
      if (date) {
        whereClause.visit_date = date;
      }

      const offset = (page - 1) * pageSize;
      
      const { count, rows } = await DailyVisitor.findAndCountAll({
        where: whereClause,
        order: [['last_visit_time', 'DESC']],
        limit: pageSize,
        offset: offset
      });

      return {
        success: true,
        data: {
          visitors: rows,
          pagination: {
            page: page,
            pageSize: pageSize,
            total: count,
            totalPages: Math.ceil(count / pageSize)
          }
        },
        message: '获取访客详情成功'
      };
    } catch (error) {
      console.error('获取访客详情失败:', error);
      return {
        success: false,
        error: error.message,
        message: '获取访客详情失败'
      };
    }
  }
}

module.exports = VisitorController;
