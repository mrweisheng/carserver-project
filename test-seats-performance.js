const axios = require('axios');

async function testSeatsPerformance() {
  console.log('🚗 座位搜索性能测试...\n');
  
  const testCases = [
    { name: '搜索5座车辆', params: { seats: '5', limit: 10 } },
    { name: '搜索7座车辆', params: { seats: '7', limit: 10 } },
    { name: '搜索5-7座车辆范围', params: { seats: '5-7', limit: 10 } },
    { name: '搜索大于5座的车辆', params: { seats: '>5', limit: 10 } },
    { name: '搜索7座丰田车辆', params: { seats: '7', car_brand: '豐田', limit: 10 } },
    { name: '搜索5座且价格小于50000', params: { seats: '5', max_price: 50000, limit: 10 } }
  ];

  const results = [];

  for (const testCase of testCases) {
    try {
      console.log(`📋 ${testCase.name}`);
      
      const startTime = Date.now();
      const response = await axios.get('http://localhost:3000/api/vehicles', {
        params: testCase.params
      });
      const endTime = Date.now();
      const duration = endTime - startTime;

      const { data } = response.data;
      console.log(`✅ 找到 ${data.total} 辆车，耗时 ${duration}ms`);
      
      results.push({
        test: testCase.name,
        params: testCase.params,
        total: data.total,
        duration: duration
      });
      
    } catch (error) {
      console.error(`❌ ${testCase.name} 测试失败:`, error.response?.data || error.message);
      results.push({
        test: testCase.name,
        params: testCase.params,
        total: 0,
        duration: -1,
        error: error.message
      });
    }
  }

  // 输出性能总结
  console.log('\n📊 性能测试总结:');
  console.log('='.repeat(60));
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.test}: 失败 - ${result.error}`);
    } else {
      console.log(`✅ ${result.test}: ${result.total}辆车, ${result.duration}ms`);
    }
  });
  
  const successfulTests = results.filter(r => !r.error);
  if (successfulTests.length > 0) {
    const avgDuration = successfulTests.reduce((sum, r) => sum + r.duration, 0) / successfulTests.length;
    console.log(`\n📈 平均查询时间: ${avgDuration.toFixed(2)}ms`);
  }

  console.log('\n🎉 性能测试完成！');
}

testSeatsPerformance();
