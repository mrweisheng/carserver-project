const axios = require('axios');

// 测试特价车辆API的固定性
async function testSpecialOffersConsistency() {
  const baseURL = 'http://localhost:3000';
  const endpoint = '/api/vehicles/special-offers';
  
  console.log('🚗 测试特价车辆API固定性...\n');
  
  try {
    // 第一次请求
    console.log('📡 第一次请求...');
    const response1 = await axios.get(`${baseURL}${endpoint}`);
    const vehicles1 = response1.data.data.vehicles;
    const ids1 = vehicles1.map(v => v.id).sort();
    
    console.log(`✅ 第一次请求成功，返回 ${vehicles1.length} 辆车`);
    console.log(`📅 缓存日期: ${response1.data.data.cache_date}`);
    console.log(`🆔 车辆ID: [${ids1.join(', ')}]`);
    console.log('');
    
    // 等待1秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 第二次请求
    console.log('📡 第二次请求...');
    const response2 = await axios.get(`${baseURL}${endpoint}`);
    const vehicles2 = response2.data.data.vehicles;
    const ids2 = vehicles2.map(v => v.id).sort();
    
    console.log(`✅ 第二次请求成功，返回 ${vehicles2.length} 辆车`);
    console.log(`📅 缓存日期: ${response2.data.data.cache_date}`);
    console.log(`🆔 车辆ID: [${ids2.join(', ')}]`);
    console.log('');
    
    // 比较结果
    const isConsistent = JSON.stringify(ids1) === JSON.stringify(ids2);
    
    if (isConsistent) {
      console.log('🎉 测试通过！两次请求返回相同的车辆ID，API固定性正常');
    } else {
      console.log('❌ 测试失败！两次请求返回不同的车辆ID，API固定性异常');
      console.log('第一次ID:', ids1);
      console.log('第二次ID:', ids2);
    }
    
    // 显示车辆详情
    console.log('\n📋 特价车辆详情:');
    vehicles1.forEach((vehicle, index) => {
      console.log(`${index + 1}. ${vehicle.car_brand} ${vehicle.car_model} (${vehicle.year}) - ${vehicle.current_price}元`);
    });
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testSpecialOffersConsistency();

