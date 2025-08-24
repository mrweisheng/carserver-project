const axios = require('axios');
const colors = require('colors');

// 配置
const BASE_URL = 'http://localhost:3000/api';
const TEST_CONFIG = {
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'API-Test-Script/1.0'
  }
};

// 测试结果统计
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// 工具函数
const log = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString();
  switch (type) {
    case 'success':
      console.log(`[${timestamp}] ✅ ${message}`.green);
      break;
    case 'error':
      console.log(`[${timestamp}] ❌ ${message}`.red);
      break;
    case 'warning':
      console.log(`[${timestamp}] ⚠️  ${message}`.yellow);
      break;
    case 'info':
      console.log(`[${timestamp}] ℹ️  ${message}`.blue);
      break;
    default:
      console.log(`[${timestamp}] ${message}`);
  }
};

const test = async (name, testFn) => {
  testResults.total++;
  try {
    log(`开始测试: ${name}`, 'info');
    const startTime = Date.now();
    await testFn();
    const duration = Date.now() - startTime;
    log(`✅ ${name} - 通过 (${duration}ms)`, 'success');
    testResults.passed++;
  } catch (error) {
    log(`❌ ${name} - 失败: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push({ name, error: error.message });
  }
};

// 测试函数
const testBasicEndpoints = async () => {
  // 测试车辆列表
  await test('获取车辆列表', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    if (!response.data.vehicles) throw new Error('缺少 vehicles 字段');
    if (!Array.isArray(response.data.vehicles)) throw new Error('vehicles 不是数组');
    log(`获取到 ${response.data.vehicles.length} 辆车`, 'info');
  });

  // 测试车辆统计
  await test('获取车辆统计', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles/stats`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    if (!response.data.total) throw new Error('缺少 total 字段');
    log(`总车辆数: ${response.data.total}`, 'info');
  });

  // 测试精选车辆
  await test('获取精选车辆', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles/featured`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    if (!response.data.vehicles) throw new Error('缺少 vehicles 字段');
    log(`精选车辆数: ${response.data.vehicles.length}`, 'info');
  });

  // 测试最新车辆
  await test('获取最新车辆', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles/latest`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    if (!response.data.vehicles) throw new Error('缺少 vehicles 字段');
    log(`最新车辆数: ${response.data.vehicles.length}`, 'info');
  });

  // 测试特价车辆
  await test('获取特价车辆', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles/special-offers`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    if (!response.data.vehicles) throw new Error('缺少 vehicles 字段');
    log(`特价车辆数: ${response.data.vehicles.length}`, 'info');
  });

  // 测试品牌列表
  await test('获取品牌列表', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles/brands`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    if (!response.data.brands) throw new Error('缺少 brands 字段');
    log(`品牌数量: ${response.data.brands.length}`, 'info');
  });
};

const testQueryParameters = async () => {
  // 测试分页参数
  await test('测试分页参数', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles?page=1&limit=5`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    if (response.data.vehicles.length > 5) throw new Error('分页限制未生效');
    log(`分页测试: 获取 ${response.data.vehicles.length} 辆车`, 'info');
  });

  // 测试搜索参数
  await test('测试搜索参数', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles?search=丰田`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    log(`搜索"丰田"结果: ${response.data.vehicles.length} 辆车`, 'info');
  });

  // 测试座位数筛选
  await test('测试座位数筛选', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles?seats=5`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    log(`5座车结果: ${response.data.vehicles.length} 辆车`, 'info');
  });

  // 测试价格筛选
  await test('测试价格筛选', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles?min_price=100000&max_price=300000`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    log(`价格筛选结果: ${response.data.vehicles.length} 辆车`, 'info');
  });
};

const testVehicleDetail = async () => {
  // 先获取一个车辆ID
  let vehicleId = null;
  
  await test('获取车辆ID用于详情测试', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles?limit=1`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    if (response.data.vehicles.length === 0) throw new Error('没有车辆数据');
    vehicleId = response.data.vehicles[0].vehicle_id;
    log(`使用车辆ID: ${vehicleId}`, 'info');
  });

  if (vehicleId) {
    await test('获取车辆详情', async () => {
      const response = await axios.get(`${BASE_URL}/vehicles/${vehicleId}`, TEST_CONFIG);
      if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
      if (!response.data.vehicle) throw new Error('缺少 vehicle 字段');
      if (!response.data.vehicle.images) throw new Error('缺少 images 字段');
      log(`车辆详情: ${response.data.vehicle.car_brand} ${response.data.vehicle.car_model}`, 'info');
      log(`图片数量: ${response.data.vehicle.images.length}`, 'info');
    });
  }
};

const testCacheFunctionality = async () => {
  // 测试缓存统计（需要管理员权限，这里只是测试接口是否存在）
  await test('测试缓存统计接口', async () => {
    try {
      const response = await axios.get(`${BASE_URL}/vehicles/cache/stats`, TEST_CONFIG);
      // 如果没有权限，应该返回401或403
      if (response.status === 200) {
        log('缓存统计接口可访问', 'info');
      } else {
        log('缓存统计接口需要权限', 'warning');
      }
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        log('缓存统计接口需要认证（正常）', 'warning');
      } else {
        throw error;
      }
    }
  });

  // 测试缓存效果（连续请求同一接口，观察响应时间）
  await test('测试缓存效果', async () => {
    const startTime = Date.now();
    const response1 = await axios.get(`${BASE_URL}/vehicles?limit=10`, TEST_CONFIG);
    const time1 = Date.now() - startTime;
    
    const startTime2 = Date.now();
    const response2 = await axios.get(`${BASE_URL}/vehicles?limit=10`, TEST_CONFIG);
    const time2 = Date.now() - startTime2;
    
    log(`第一次请求: ${time1}ms`, 'info');
    log(`第二次请求: ${time2}ms`, 'info');
    
    if (time2 < time1 * 0.8) {
      log('缓存效果明显', 'success');
    } else {
      log('缓存效果不明显或未启用', 'warning');
    }
  });
};

const testConcurrency = async () => {
  await test('测试并发请求', async () => {
    const concurrentRequests = 10;
    const promises = [];
    
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        axios.get(`${BASE_URL}/vehicles?limit=5`, TEST_CONFIG)
          .catch(error => ({ error: error.message }))
      );
    }
    
    const startTime = Date.now();
    const results = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    const successCount = results.filter(r => !r.error).length;
    const errorCount = results.filter(r => r.error).length;
    
    log(`并发测试: ${concurrentRequests} 个请求`, 'info');
    log(`成功: ${successCount}, 失败: ${errorCount}`, 'info');
    log(`总耗时: ${totalTime}ms`, 'info');
    
    if (errorCount > concurrentRequests * 0.3) {
      throw new Error(`并发失败率过高: ${errorCount}/${concurrentRequests}`);
    }
  });
};

const testErrorHandling = async () => {
  // 测试无效的车辆ID
  await test('测试无效车辆ID', async () => {
    try {
      await axios.get(`${BASE_URL}/vehicles/invalid-id`, TEST_CONFIG);
      throw new Error('应该返回404错误');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        log('正确处理无效车辆ID', 'success');
      } else {
        throw new Error(`期望404错误，实际: ${error.response?.status || error.message}`);
      }
    }
  });

  // 测试无效的查询参数
  await test('测试无效查询参数', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles?page=invalid&limit=invalid`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    log('正确处理无效查询参数', 'success');
  });
};

// 主测试函数
const runAllTests = async () => {
  log('🚀 开始API测试...', 'info');
  log(`测试目标: ${BASE_URL}`, 'info');
  
  try {
    // 基础功能测试
    log('\n📋 基础功能测试', 'info');
    await testBasicEndpoints();
    
    // 查询参数测试
    log('\n🔍 查询参数测试', 'info');
    await testQueryParameters();
    
    // 车辆详情测试
    log('\n📄 车辆详情测试', 'info');
    await testVehicleDetail();
    
    // 缓存功能测试
    log('\n💾 缓存功能测试', 'info');
    await testCacheFunctionality();
    
    // 并发测试
    log('\n⚡ 并发测试', 'info');
    await testConcurrency();
    
    // 错误处理测试
    log('\n🛡️ 错误处理测试', 'info');
    await testErrorHandling();
    
  } catch (error) {
    log(`测试过程中发生错误: ${error.message}`, 'error');
  }
  
  // 输出测试结果
  log('\n📊 测试结果汇总', 'info');
  log(`总测试数: ${testResults.total}`, 'info');
  log(`通过: ${testResults.passed}`, 'success');
  log(`失败: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  
  if (testResults.errors.length > 0) {
    log('\n❌ 失败详情:', 'error');
    testResults.errors.forEach(({ name, error }) => {
      log(`  ${name}: ${error}`, 'error');
    });
  }
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  log(`\n🎯 成功率: ${successRate}%`, successRate >= 80 ? 'success' : 'error');
  
  if (testResults.failed === 0) {
    log('\n🎉 所有测试通过！API运行正常', 'success');
  } else {
    log('\n⚠️ 部分测试失败，请检查相关功能', 'warning');
  }
};

// 运行测试
if (require.main === module) {
  runAllTests().catch(error => {
    log(`测试脚本执行失败: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  test,
  log
};
