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
      max: 20,           // 增加最大连接数
      min: 5,            // 增加最小连接数
      acquire: 60000,    // 获取连接超时1分钟
      idle: 30000,       // 空闲连接超时30秒
      evict: 60000       // 清理空闲连接间隔
    },
    dialectOptions: {
      connectTimeout: 60000,   // 连接超时1分钟
      charset: 'utf8mb4'       // 字符集
    },
    retry: {
      max: 5,            // 增加重试次数
      timeout: 3000      // 重试间隔
    },
    timezone: '+08:00'
  }
);

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    console.log('请检查：');
    console.log('1. MySQL服务是否启动');
    console.log('2. 数据库连接配置是否正确');
    console.log('3. 网络连接是否正常');
    // 不退出程序，让应用继续运行
  }
};

// 定期检查数据库连接健康状态
const healthCheck = async () => {
  try {
    await sequelize.authenticate();
    console.log('🟢 数据库连接健康检查通过');
  } catch (error) {
    console.error('🔴 数据库连接健康检查失败:', error);
  }
};

// 启动时测试连接
testConnection();

// 每5分钟进行一次健康检查
setInterval(healthCheck, 5 * 60 * 1000);

module.exports = sequelize;
