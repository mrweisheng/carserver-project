const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Car = sequelize.define('Car', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  brand: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '品牌'
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '型号'
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '年份',
    validate: {
      min: 1900,
      max: new Date().getFullYear() + 1
    }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '价格',
    validate: {
      min: 0
    }
  },
  mileage: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '里程数',
    validate: {
      min: 0
    }
  },
  fuelType: {
    type: DataTypes.ENUM('汽油', '柴油', '电动', '混合动力'),
    allowNull: false,
    comment: '燃料类型'
  },
  transmission: {
    type: DataTypes.ENUM('手动', '自动'),
    allowNull: false,
    comment: '变速箱类型'
  },
  color: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '颜色'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '描述'
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '图片数组'
  },
  status: {
    type: DataTypes.ENUM('available', 'sold', 'reserved'),
    defaultValue: 'available',
    comment: '状态'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID',
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'cars',
  timestamps: true
});

module.exports = Car;
