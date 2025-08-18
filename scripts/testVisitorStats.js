const axios = require('axios');

// 测试配置
const BASE_URL = 'http://localhost:3000';
let adminToken = '';

// 测试数据
const testIPs = [
  '192.168.1.100',
  '192.168.1.101', 
  '192.168.1.102',
  '10.0.0.1',
  '172.16.0.1'
];

const testUserAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Android 11; Mobile; rv:89.0) Gecko/89.0 Firefox/89.0'
];

// 登录管理员账户
async function loginAdmin() {
  try {
    console.log('🔐 登录管理员账户...');
    
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin', // 假设管理员用户名为admin
      password: 'admin123' // 假设管理员密码为admin123
    });
    
    if (response.data.code === 200) {
      adminToken = response.data.data.token;
      console.log('✅ 管理员登录成功');
      return true;
    } else {
      console.log('❌ 管理员登录失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ 管理员登录失败:', error.response?.data?.message || error.message);
    return false;
  }
}

// 模拟访客访问
async function simulateVisitorVisits() {
  console.log('\n🌐 模拟访客访问...');
  
  for (let i = 0; i < testIPs.length; i++) {
    const ip = testIPs[i];
    const userAgent = testUserAgents[i % testUserAgents.length];
    
    try {
      // 模拟多次访问同一IP
      const visitCount = Math.floor(Math.random() * 5) + 1;
      
      for (let j = 0; j < visitCount; j++) {
        const response = await axios.post(`${BASE_URL}/api/visitors/record`, {
          ipAddress: ip,
          userAgent: userAgent
        }, {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
        
        if (response.data.code === 200) {
          console.log(`✅ IP ${ip} 第${j + 1}次访问记录成功`);
        } else {
          console.log(`❌ IP ${ip} 第${j + 1}次访问记录失败:`, response.data.message);
        }
        
        // 添加延迟，模拟真实访问
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.log(`❌ IP ${ip} 访问记录失败:`, error.response?.data?.message || error.message);
    }
  }
}

// 获取今日访客统计
async function getTodayStats() {
  try {
    console.log('\n📊 获取今日访客统计...');
    
    const response = await axios.get(`${BASE_URL}/api/visitors/today`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (response.data.code === 200) {
      console.log('✅ 今日访客统计:');
      console.log(JSON.stringify(response.data.data, null, 2));
    } else {
      console.log('❌ 获取今日访客统计失败:', response.data.message);
    }
  } catch (error) {
    console.log('❌ 获取今日访客统计失败:', error.response?.data?.message || error.message);
  }
}

// 获取访客统计数据
async function getVisitorStats() {
  try {
    console.log('\n📈 获取访客统计数据...');
    
    const response = await axios.get(`${BASE_URL}/api/visitors/stats?limit=7`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (response.data.code === 200) {
      console.log('✅ 访客统计数据:');
      console.log(JSON.stringify(response.data.data, null, 2));
    } else {
      console.log('❌ 获取访客统计数据失败:', response.data.message);
    }
  } catch (error) {
    console.log('❌ 获取访客统计数据失败:', error.response?.data?.message || error.message);
  }
}

// 获取访客详情
async function getVisitorDetails() {
  try {
    console.log('\n👥 获取访客详情...');
    
    const today = new Date().toISOString().split('T')[0];
    const response = await axios.get(`${BASE_URL}/api/visitors/details?date=${today}&page=1&pageSize=10`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (response.data.code === 200) {
      console.log('✅ 访客详情:');
      console.log(`总访客数: ${response.data.data.pagination.total}`);
      console.log('访客列表:');
      response.data.data.visitors.forEach((visitor, index) => {
        console.log(`${index + 1}. IP: ${visitor.ip_address}, 请求次数: ${visitor.request_count}, 最后访问: ${visitor.last_visit_time}`);
      });
    } else {
      console.log('❌ 获取访客详情失败:', response.data.message);
    }
  } catch (error) {
    console.log('❌ 获取访客详情失败:', error.response?.data?.message || error.message);
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试访客统计功能...\n');
  
  // 1. 登录管理员
  const loginSuccess = await loginAdmin();
  if (!loginSuccess) {
    console.log('❌ 无法登录管理员账户，测试终止');
    return;
  }
  
  // 2. 模拟访客访问
  await simulateVisitorVisits();
  
  // 3. 获取今日统计
  await getTodayStats();
  
  // 4. 获取统计数据
  await getVisitorStats();
  
  // 5. 获取访客详情
  await getVisitorDetails();
  
  console.log('\n✅ 访客统计功能测试完成！');
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  loginAdmin,
  simulateVisitorVisits,
  getTodayStats,
  getVisitorStats,
  getVisitorDetails
};
