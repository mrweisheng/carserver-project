const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  try {
    console.log('🔍 检查是否已存在管理员账号...');
    
    // 检查是否已存在管理员账号
    const existingAdmin = await User.findOne({
      where: {
        username: 'admin'
      }
    });
    
    if (existingAdmin) {
      console.log('✅ 管理员账号已存在:', existingAdmin.username);
      return existingAdmin;
    }
    
    console.log('🔍 创建默认管理员账号...');
    
    // 创建管理员账号
    const adminUser = await User.create({
      username: 'admin',
      password: 'admin123',
      real_name: '系统管理员',
      email: 'admin@example.com',
      gender: 'male',
      phone: '13800138001',
      region: '北京市',
      ip_address: '127.0.0.1',
      status: 1, // 正常状态
      role: 2 // 管理员角色
    });
    
    console.log('✅ 管理员账号创建成功:', {
      id: adminUser.id,
      username: adminUser.username,
      real_name: adminUser.real_name,
      role: adminUser.role,
      status: adminUser.status
    });
    
    return adminUser;
  } catch (error) {
    console.error('❌ 创建管理员账号失败:', error.message);
    return null;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('\n🎉 管理员账号创建完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { createAdminUser };
