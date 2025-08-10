const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '自增主键'
  },
  vehicle_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '车辆编号（网站原始编号）'
  },
  vehicle_type: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '车辆类型：1=私家车, 2=客货车, 3=货车, 4=电单车, 5=经典车'
  },
  vehicle_status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '车辆状态：1=未售, 2=已售'
  },
  page_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '来源页面编号'
  },
  car_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '车辆编号'
  },
  car_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '车辆详情页URL'
  },
  car_category: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '车类'
  },
  car_brand: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '车厂'
  },
  car_model: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '型号'
  },
  fuel_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '燃料类型'
  },
  seats: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '座位数'
  },
  engine_volume: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '发动机容积'
  },
  transmission: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '传动方式'
  },
  year: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '年份'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '简评/描述'
  },
  price: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '售价'
  },
  current_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '现价（数字格式）'
  },
  original_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '原价（数字格式）'
  },
  contact_info: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '联络人资料'
  },
  update_date: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '更新日期'
  },
  extra_fields: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '扩展字段（JSON格式存储类型特有属性）'
  },
  contact_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '联系人姓名'
  },
  phone_number: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '联系电话'
  }
}, {
  tableName: 'vehicles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '车辆基础信息表'
});

module.exports = Vehicle;
