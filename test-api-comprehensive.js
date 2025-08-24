const axios = require('axios');

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
  const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`[${timestamp}] ${emoji} ${message}`);
};

const test = async (name, testFn) => {
  testResults.total++;
  try {
    log(`开始测试: ${name}`, 'info');
    const startTime = Date.now();
    await testFn();
    const duration = Date.now() - startTime;
    log(`${name} - 通过 (${duration}ms)`, 'success');
    testResults.passed++;
  } catch (error) {
    log(`${name} - 失败: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push({ name, error: error.message });
  }
};

// 测试基础API端点
const testBasicEndpoints = async () => {
  // 测试车辆列表
  await test('获取车辆列表', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    if (!response.data.data || !response.data.data.vehicles) throw new Error('缺少 vehicles 字段');
    log(`获取到 ${response.data.data.vehicles.length} 辆车`);
  });

  // 测试车辆统计
  await test('获取车辆统计', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles/stats`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    if (!response.data.data || !response.data.data.total) throw new Error('缺少 total 字段');
    log(`总车辆数: ${response.data.data.total}`);
  });

  // 测试精选车辆
  await test('获取精选车辆', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles/featured`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    if (!response.data.data || !response.data.data.vehicles) throw new Error('缺少 vehicles 字段');
    log(`精选车辆数: ${response.data.data.vehicles.length}`);
  });

  // 测试最新车辆
  await test('获取最新车辆', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles/latest`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    if (!response.data.data || !response.data.data.vehicles) throw new Error('缺少 vehicles 字段');
    log(`最新车辆数: ${response.data.data.vehicles.length}`);
  });

  // 测试特价车辆
  await test('获取特价车辆', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles/special-offers`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    if (!response.data.data || !response.data.data.vehicles) throw new Error('缺少 vehicles 字段');
    log(`特价车辆数: ${response.data.data.vehicles.length}`);
  });

  // 测试品牌列表
  await test('获取品牌列表', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles/brands`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    if (!response.data.data || !response.data.data.brands) throw new Error('缺少 brands 字段');
    log(`品牌数量: ${response.data.data.brands.length}`);
  });
};

// 测试查询参数
const testQueryParameters = async () => {
  // 测试分页参数
  await test('测试分页参数', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles?page=1&limit=5`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    if (response.data.data.vehicles.length > 5) throw new Error('分页限制未生效');
    log(`分页测试: 获取 ${response.data.data.vehicles.length} 辆车`);
  });

  // 测试搜索参数
  await test('测试搜索参数', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles?search=丰田`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    log(`搜索"丰田"结果: ${response.data.data.vehicles.length} 辆车`);
  });

  // 测试座位数筛选
  await test('测试座位数筛选', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles?seats=5`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    log(`5座车结果: ${response.data.data.vehicles.length} 辆车`);
  });

  // 测试价格筛选
  await test('测试价格筛选', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles?min_price=100000&max_price=300000`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    log(`价格筛选结果: ${response.data.data.vehicles.length} 辆车`);
  });
};

// 测试车辆详情
const testVehicleDetail = async () => {
  // 先获取一个车辆ID
  let vehicleId = null;
  
  await test('获取车辆ID用于详情测试', async () => {
    const response = await axios.get(`${BASE_URL}/vehicles?limit=1`, TEST_CONFIG);
    if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
    if (response.data.data.vehicles.length === 0) throw new Error('没有车辆数据');
    vehicleId = response.data.data.vehicles[0].vehicle_id;
    log(`使用车辆ID: ${vehicleId}`);
  });

  if (vehicleId) {
    await test('获取车辆详情', async () => {
      const response = await axios.get(`${BASE_URL}/vehicles/${vehicleId}`, TEST_CONFIG);
      if (response.status !== 200) throw new Error(`状态码: ${response.status}`);
      if (!response.data.data || !response.data.data.vehicle) throw new Error('缺少 vehicle 字段');
      if (!response.data.data.vehicle.images) throw new Error('缺少 images 字段');
      log(`车辆详情: ${response.data.data.vehicle.car_brand} ${response.data.data.vehicle.car_model}`);
      log(`图片数量: ${response.data.data.vehicle.images.length}`);
    });
  }
};

// 测试缓存功能
const testCacheFunctionality = async () => {
  // 测试缓存效果（连续请求同一接口，观察响应时间）
  await test('测试缓存效果', async () => {
    const startTime = Date.now();
    const response1 = await axios.get(`${BASE_URL}/vehicles?limit=10`, TEST_CONFIG);
    const time1 = Date.now() - startTime;
    
    const startTime2 = Date.now();
    const response2 = await axios.get(`${BASE_URL}/vehicles?limit=10`, TEST_CONFIG);
    const time2 = Date.now() - startTime2;
    
    log(`第一次请求: ${time1}ms`);
    log(`第二次请求: ${time2}ms`);
    
    if (time2 < time1 * 0.8) {
      log('缓存效果明显', 'success');
    } else {
      log('缓存效果不明显或未启用', 'warning');
    }
  });
};

// 测试并发请求
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
    
    log(`并发测试: ${concurrentRequests} 个请求`);
    log(`成功: ${successCount}, 失败: ${errorCount}`);
    log(`总耗时: ${totalTime}ms`);
    
    if (errorCount > concurrentRequests * 0.3) {
      throw new Error(`并发失败率过高: ${errorCount}/${concurrentRequests}`);
    }
  });
};

// 测试错误处理
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
    // 验证参数被自动修正
    if (response.data.data && response.data.data.pagination) {
      const pagination = response.data.data.pagination;
      if (pagination.current_page !== 1 || pagination.limit !== 20) {
        throw new Error('无效参数未被正确修正');
      }
    }
    log('正确处理无效查询参数', 'success');
  });
};

// 主测试函数
const runAllTests = async () => {
  log('🚀 开始全面API测试...', 'info');
  log(`测试目标: ${BASE_URL}`);
  
  try {
    // 基础功能测试
    log('\n📋 基础功能测试');
    await testBasicEndpoints();
    
    // 查询参数测试
    log('\n🔍 查询参数测试');
    await testQueryParameters();
    
    // 车辆详情测试
    log('\n📄 车辆详情测试');
    await testVehicleDetail();
    
    // 缓存功能测试
    log('\n💾 缓存功能测试');
    await testCacheFunctionality();
    
    // 并发测试
    log('\n⚡ 并发测试');
    await testConcurrency();
    
    // 错误处理测试
    log('\n🛡️ 错误处理测试');
    await testErrorHandling();
    
  } catch (error) {
    log(`测试过程中发生错误: ${error.message}`, 'error');
  }
  
  // 输出测试结果
  log('\n📊 测试结果汇总');
  log(`总测试数: ${testResults.total}`);
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
runAllTests().catch(error => {
  log(`测试脚本执行失败: ${error.message}`, 'error');
  process.exit(1);
});
