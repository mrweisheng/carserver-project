const { Sequelize } = require('sequelize');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// 使用项目的数据库配置
const sequelize = new Sequelize(
  process.env.DB_NAME || 'car_info_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '1qaz!QAZ2wsx@WSX',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 2,
      acquire: 120000,
      idle: 10000
    },
    dialectOptions: {
      connectTimeout: 120000,
    },
    retry: {
      max: 3
    },
    timezone: '+08:00'
  }
);

async function createIndexes() {
  try {
    console.log('连接数据库...');
    await sequelize.authenticate();
    
    // 读取SQL文件
    const sqlFilePath = path.join(__dirname, '..', 'database', 'optimize_indexes.sql');
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    
    // 分割SQL语句（按分号分割，过滤空语句和注释）
    const sqlStatements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    console.log(`准备执行 ${sqlStatements.length} 条SQL语句...`);
    
    // 逐条执行SQL语句
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      if (statement) {
        try {
          console.log(`执行第 ${i + 1} 条语句...`);
          console.log(`SQL: ${statement.substring(0, 100)}...`);
          
          await sequelize.query(statement);
          console.log(`✓ 第 ${i + 1} 条语句执行成功`);
        } catch (error) {
          if (error.code === 'ER_DUP_KEYNAME') {
            console.log(`⚠ 第 ${i + 1} 条语句: 索引已存在，跳过`);
          } else {
            console.error(`✗ 第 ${i + 1} 条语句执行失败:`, error.message);
          }
        }
      }
    }
    
    // 查看当前索引状态
    console.log('\n查看当前vehicles表的索引状态...');
    const [indexes] = await sequelize.query('SHOW INDEX FROM vehicles');
    console.log('当前索引:');
    indexes.forEach(index => {
      console.log(`- ${index.Key_name}: ${index.Column_name} (${index.Index_type})`);
    });
    
    console.log('\n索引优化完成！');
    
  } catch (error) {
    console.error('执行失败:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('数据库连接已关闭');
  }
}

// 执行脚本
createIndexes().catch(console.error);