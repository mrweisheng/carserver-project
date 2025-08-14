const axios = require('axios');

// 测试API接口
async function testAPI() {
  try {
    console.log('测试车辆详情API接口...');
    
    // 测试车辆s2527586的详情接口
    const response = await axios.get('http://localhost:3000/api/vehicles/s2527586', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MzQ5NTU4NzIsImV4cCI6MTczNTA0MjI3Mn0.q1234567890abcdefghijklmnopqrstuvwxyz'
      }
    });
    
    console.log('\n=== 车辆详情API响应 ===');
    console.log('状态码:', response.status);
    console.log('完整响应数据:', JSON.stringify(response.data, null, 2));
    console.log('车辆ID:', response.data.vehicle_id);
    console.log('联系人姓名:', response.data.contact_name);
    console.log('电话号码:', response.data.phone_number);
    console.log('联系信息:', response.data.contact_info);
    
    // 测试车辆列表接口
    console.log('\n\n测试车辆列表API接口...');
    const listResponse = await axios.get('http://localhost:3000/api/vehicles?page=1&limit=5&search=s252', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MzQ5NTU4NzIsImV4cCI6MTczNTA0MjI3Mn0.q1234567890abcdefghijklmnopqrstuvwxyz'
      }
    });
    
    console.log('\n=== 车辆列表API响应 ===');
    console.log('状态码:', listResponse.status);
    console.log('完整响应数据:', JSON.stringify(listResponse.data, null, 2));
    console.log('总数:', listResponse.data.total);
    
    if (listResponse.data.vehicles && listResponse.data.vehicles.length > 0) {
      listResponse.data.vehicles.forEach((vehicle, index) => {
        console.log(`\n车辆 ${index + 1}:`);
        console.log('  车辆ID:', vehicle.vehicle_id);
        console.log('  联系人姓名:', vehicle.contact_name);
        console.log('  电话号码:', vehicle.phone_number);
        if (vehicle.contact_info) {
          console.log('  联系信息:', vehicle.contact_info);
        }
      });
    }
    
  } catch (error) {
    console.error('API测试失败:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
  }
}

testAPI();