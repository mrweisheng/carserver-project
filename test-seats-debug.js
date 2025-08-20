const axios = require('axios');

async function testSeatsDebug() {
  console.log('🚗 调试座位搜索功能...\n');
  
  const testCases = [
    { name: '搜索5座车辆', params: { seats: '5', limit: 3 } },
    { name: '搜索7座车辆', params: { seats: '7', limit: 3 } },
    { name: '搜索5-7座车辆范围', params: { seats: '5-7', limit: 3 } },
    { name: '搜索大于5座的车辆', params: { seats: '>5', limit: 3 } }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n📋 ${testCase.name}`);
      console.log(`🔗 请求参数: ${JSON.stringify(testCase.params)}`);
      
      const response = await axios.get('http://localhost:3000/api/vehicles', {
        params: testCase.params
      });

      const { data } = response.data;
      console.log(`✅ 找到 ${data.total} 辆车，显示 ${data.vehicles.length} 辆`);
      
      if (data.vehicles.length > 0) {
        console.log('📊 车辆座位信息:');
        data.vehicles.forEach((vehicle, index) => {
          console.log(`   ${index + 1}. ID:${vehicle.id} - ${vehicle.car_brand} ${vehicle.car_model} - 座位:${vehicle.seats} - 价格:${vehicle.current_price}元`);
        });
      }
      
    } catch (error) {
      console.error(`❌ ${testCase.name} 测试失败:`, error.response?.data || error.message);
    }
  }

  console.log('\n🎉 座位搜索调试完成！');
}

testSeatsDebug();
