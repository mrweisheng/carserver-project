#!/usr/bin/env node

/**
 * 访客IP地理位置数据修复脚本
 * 专门为 daily_visitors 表的IP地址添加地理位置信息
 */

const { sequelize, DailyVisitor } = require('../models');
const { getRegionByIP } = require('../utils/ipUtils');
const { Op } = require('sequelize');

class VisitorIPLocationUpdater {
  constructor() {
    this.delayMs = 200; // 每次请求间延迟（毫秒）
  }

  /**
   * 延迟函数
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 更新访客表的地理位置信息
   */
  async updateVisitorsLocation() {
    console.log('👤 正在更新访客地理位置信息...');
    
    const visitors = await DailyVisitor.findAll({
      where: {
        ip_address: { [Op.not]: null },
        country: { [Op.or]: [null, '未知'] }
      }
    });
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const visitor of visitors) {
      try {
        if (visitor.ip_address && visitor.ip_address !== '127.0.0.1') {
          const locationInfo = await getRegionByIP(visitor.ip_address);
          
          await visitor.update({
            country: locationInfo.country,
            region: locationInfo.region,
            city: locationInfo.city,
            isp: locationInfo.isp,
            timezone: locationInfo.timezone,
            location_updated_at: new Date()
          });
          
          updatedCount++;
          console.log(`✅ 访客 ${visitor.ip_address} -> ${locationInfo.country} ${locationInfo.city}`);
          
          // 添加延迟避免API限制
          await this.delay(this.delayMs);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ 更新访客 ${visitor.ip_address} 失败:`, error.message);
      }
    }
    
    console.log(`📈 访客地理位置更新完成: ${updatedCount} 成功, ${errorCount} 失败`);
  }

  /**
   * 显示访客统计信息
   */
  async showVisitorStatistics() {
    console.log('\n📊 访客地理位置数据统计:');
    
    // 访客统计
    const visitorStats = await DailyVisitor.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_visitors'],
        [sequelize.fn('COUNT', sequelize.fn('IF', sequelize.literal('country IS NOT NULL AND country != "未知" AND country != "本地网络"'), 1, null)), 'visitors_with_location'],
        [sequelize.fn('COUNT', sequelize.fn('IF', sequelize.literal('country IS NULL OR country = "未知" OR country = "本地网络"'), 1, null)), 'visitors_without_location']
      ],
      raw: true
    });
    
    console.log(`👤 访客: ${visitorStats[0].total_visitors} 总数, ${visitorStats[0].visitors_with_location} 有地理位置, ${visitorStats[0].visitors_without_location} 无地理位置`);
  }

  /**
   * 显示访客地理位置分布
   */
  async showLocationDistribution() {
    console.log('\n🌍 访客地理位置分布:');
    
    try {
      const locationStats = await DailyVisitor.findAll({
        where: {
          country: { [Op.not]: null }
        },
        attributes: [
          'country',
          'region',
          'city',
          [sequelize.fn('COUNT', sequelize.col('id')), 'visitor_count']
        ],
        group: ['country', 'region', 'city'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 10,
        raw: true
      });
      
      if (locationStats.length > 0) {
        console.log('📈 前10个访客最多的地区:');
        locationStats.forEach((stat, index) => {
          console.log(`${index + 1}. ${stat.country} ${stat.region} ${stat.city} - ${stat.visitor_count} 访客`);
        });
      } else {
        console.log('📊 暂无地理位置数据');
      }
    } catch (error) {
      console.log(`❌ 无法获取地理位置分布: ${error.message}`);
    }
  }

  /**
   * 主执行函数
   */
  async run() {
    try {
      console.log('🚀 开始访客IP地理位置数据修复...\n');
      
      // 显示初始统计
      await this.showVisitorStatistics();
      
      console.log('\n' + '='.repeat(50));
      
      // 更新访客地理位置
      await this.updateVisitorsLocation();
      
      console.log('\n' + '='.repeat(50));
      
      // 显示最终统计
      await this.showVisitorStatistics();
      
      // 显示地理位置分布
      await this.showLocationDistribution();
      
      console.log('\n✅ 访客IP地理位置数据修复完成！');
      
    } catch (error) {
      console.error('❌ 修复过程中发生错误:', error);
    } finally {
      await sequelize.close();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const updater = new VisitorIPLocationUpdater();
  updater.run();
}

module.exports = VisitorIPLocationUpdater;
