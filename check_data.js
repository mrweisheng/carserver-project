const { Vehicle } = require('./models');

async function checkSpecificVehicle() {
  try {
    console.log('正在检查车辆ID: s2527586 的数据...');
    
    // 查询特定车辆的完整信息
    const vehicle = await Vehicle.findOne({
      where: { vehicle_id: 's2527586' },
      attributes: ['vehicle_id', 'contact_name', 'phone_number', 'contact_info', 'car_brand', 'car_model', 'year']
    });
    
    if (vehicle) {
      console.log('找到车辆数据:');
      console.log('车辆ID:', vehicle.vehicle_id);
      console.log('联系人姓名:', vehicle.contact_name);
      console.log('电话号码:', vehicle.phone_number);
      console.log('联系信息:', vehicle.contact_info);
      console.log('品牌:', vehicle.car_brand);
      console.log('型号:', vehicle.car_model);
      console.log('年份:', vehicle.year);
      
      // 检查字段是否为null、undefined或空字符串
      console.log('\n字段检查:');
      console.log('contact_name === null:', vehicle.contact_name === null);
      console.log('contact_name === undefined:', vehicle.contact_name === undefined);
      console.log('contact_name === "":', vehicle.contact_name === '');
      console.log('phone_number === null:', vehicle.phone_number === null);
      console.log('phone_number === undefined:', vehicle.phone_number === undefined);
      console.log('phone_number === "":', vehicle.phone_number === '');
    } else {
      console.log('未找到车辆ID为 s2527586 的记录');
    }
    
    // 查询附近的车辆ID，看看是否有类似的
    const similarVehicles = await Vehicle.findAll({
      where: {
        vehicle_id: {
          [require('sequelize').Op.like]: 's252%'
        }
      },
      attributes: ['vehicle_id', 'contact_name', 'phone_number'],
      limit: 5
    });
    
    console.log('\n类似的车辆ID:');
    similarVehicles.forEach(v => {
      console.log(`车辆ID: ${v.vehicle_id}, 联系人: ${v.contact_name}, 电话: ${v.phone_number}`);
    });
    
  } catch (error) {
    console.error('查询失败:', error);
  } finally {
    process.exit(0);
  }
}

checkSpecificVehicle();