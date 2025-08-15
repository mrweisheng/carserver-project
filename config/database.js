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
      max: 10,
      min: 2,
      acquire: 120000,  // 增加到2分钟
      idle: 10000
    },
    dialectOptions: {
      connectTimeout: 120000,  // 连接超时2分钟
    },
    retry: {
      max: 3  // 最大重试3次
    },
    timezone: '+08:00'
  }
);

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
};

testConnection();

module.exports = sequelize;
