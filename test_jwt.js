const jwt = require('jsonwebtoken');
const { Vehicle } = require('./models');

// 用户提供的JWT token
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsInVzZXJuYW1lIjoibWluZ2dlIiwicm9sZSI6MSwiaWF0IjoxNzU1MTgxNzQ5LCJleHAiOjE3NTUyNjgxNDl9.qbjjtNbzawvVBqBa4LAA5pVpkgvt7xEY_AyNnjOvnYg';

async function testJWT() {
  try {
    // 验证JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('JWT解码结果:', decoded);
    
    // 检查token是否过期
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      console.log('Token已过期');
    } else {
      console.log('Token有效');
    }
    
    // 查找以q开头的车辆ID
    const qVehicles = await Vehicle.findAll({
      where: {
        vehicle_id: {
          [require('sequelize').Op.like]: 'q%'
        }
      },
      attributes: ['vehicle_id', 'contact_name', 'phone_number'],
      limit: 10
    });
    
    console.log('\n以q开头的车辆:');
    qVehicles.forEach(vehicle => {
      console.log(`车辆ID: ${vehicle.vehicle_id}, 联系人: ${vehicle.contact_name}, 电话: ${vehicle.phone_number}`);
    });
    
  } catch (error) {
    console.error('JWT验证失败:', error.message);
  } finally {
    process.exit(0);
  }
}

testJWT();