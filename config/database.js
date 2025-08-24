const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'car_info_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '1qaz!QAZ2wsx@WSX',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 50,           // 高并发：最大连接数提升到50
      min: 5,            // 保持最小连接数，减少连接创建开销
      acquire: 30000,    // 获取连接超时30秒
      idle: 30000,       // 空闲连接超时30秒
      evict: 60000       // 清理空闲连接间隔60秒
    },
    dialectOptions: {
      charset: 'utf8mb4'
    },
    timezone: '+08:00'
  }
);

// 简单的连接测试
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
  }
};

// 启动时测试连接
testConnection();

module.exports = sequelize;
