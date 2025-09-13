const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VehicleImage = sequelize.define('VehicleImage', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '自增主键'
  },
  vehicle_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '车辆编号（关联vehicles表）'
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '图片URL'
  },
  local_path: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '本地图片路径'
  },
  image_order: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: '图片顺序（0,1,2,3...）'
  },
  thumbnail_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '缩略图URL'
  }
}, {
  tableName: 'vehicle_images',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  comment: '车辆图片表'
});

module.exports = VehicleImage;
