const sequelize = require('../config/database');
const User = require('./User');
const Vehicle = require('./Vehicle');
const VehicleImage = require('./VehicleImage');
const DailyVisitor = require('./DailyVisitor');
const IPLocationCache = require('./IPLocationCache');

// 定义模型关联关系
Vehicle.hasMany(VehicleImage, {
  foreignKey: 'vehicle_id',
  sourceKey: 'vehicle_id',
  as: 'images'
});

VehicleImage.belongsTo(Vehicle, {
  foreignKey: 'vehicle_id',
  targetKey: 'vehicle_id',
  as: 'vehicle'
});

// 用户和车辆的关联关系
User.hasMany(Vehicle, {
  foreignKey: 'user_id',
  sourceKey: 'id',
  as: 'vehicles'
});

Vehicle.belongsTo(User, {
  foreignKey: 'user_id',
  targetKey: 'id',
  as: 'user'
});

// 同步数据库（仅连接测试，不修改表结构）
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
    
    // 不自动同步表结构，保持现有数据库结构
    // await sequelize.sync({ force: false, alter: false });
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Vehicle,
  VehicleImage,
  DailyVisitor,
  IPLocationCache,
  syncDatabase
};
