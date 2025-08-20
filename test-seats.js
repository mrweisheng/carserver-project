const axios = require('axios');

async function testSeatsSearch() {
  console.log('🚗 测试座位搜索功能...');
  
  try {
    const response = await axios.get('http://localhost:3000/api/vehicles', {
      params: { seats: '5', limit: 3 }
    });
    
    console.log('✅ 座位搜索功能正常');
    console.log(`找到 ${response.data.data.total} 辆5座车`);
  } catch (error) {
    console.error('❌ 座位搜索功能异常:', error.message);
  }
}

testSeatsSearch();
