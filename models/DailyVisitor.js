const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DailyVisitor = sequelize.define('DailyVisitor', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '记录ID（自增主键）'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: false,
    comment: '访客IP地址'
  },
  visit_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '访问日期（年月日）'
  },
  request_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '当日请求次数'
  },
  first_visit_time: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    comment: '首次访问时间'
  },
  last_visit_time: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    comment: '最后访问时间'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '用户代理信息'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    comment: '记录创建时间'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
    comment: '记录更新时间'
  }
}, {
  tableName: 'daily_visitors',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '每日访客统计表',
  indexes: [
    {
      unique: true,
      fields: ['ip_address', 'visit_date'],
      name: 'uk_ip_date'
    },
    {
      fields: ['visit_date'],
      name: 'idx_visit_date'
    },
    {
      fields: ['ip_address'],
      name: 'idx_ip_address'
    },
    {
      fields: ['request_count'],
      name: 'idx_request_count'
    }
  ]
});

module.exports = DailyVisitor;
