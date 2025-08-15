const axios = require('axios');
const { performance } = require('perf_hooks');

// 测试配置
const BASE_URL = 'http://localhost:3000/api';
const TEST_ROUNDS = 5; // 每个接口测试5次

// 测试接口列表
const testEndpoints = [
  {
    name: 'Featured Vehicles',
    url: `${BASE_URL}/vehicles/featured`,
    description: '精选车辆接口（优化后）'
  },
  {
    name: 'Latest Vehicles', 
    url: `${BASE_URL}/vehicles/latest`,
    description: '最新车辆接口（优化后）'
  },
  {
    name: 'Vehicle List',
    url: `${BASE_URL}/vehicles?page=1&limit=20`,
    description: '车辆列表接口'
  },
  {
    name: 'Special Offers',
    url: `${BASE_URL}/vehicles/special-offers`,
    description: '特价车辆接口'
  }
];

// 执行单次请求测试
async function testSingleRequest(url, name) {
  const startTime = performance.now();
  
  try {
    const response = await axios.get(url, {
      timeout: 10000 // 10秒超时
    });
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    return {
      success: true,
      responseTime: responseTime.toFixed(2),
      statusCode: response.status,
      dataCount: response.data.data?.vehicles?.length || response.data.data?.total_count || 0
    };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    return {
      success: false,
      responseTime: responseTime.toFixed(2),
      error: error.message,
      statusCode: error.response?.status || 'TIMEOUT'
    };
  }
}

// 执行多轮测试
async function testEndpoint(endpoint) {
  console.log(`\n🧪 测试 ${endpoint.name} (${endpoint.description})`);
  console.log(`📍 URL: ${endpoint.url}`);
  console.log('─'.repeat(60));
  
  const results = [];
  
  for (let i = 1; i <= TEST_ROUNDS; i++) {
    process.stdout.write(`第${i}轮测试... `);
    
    const result = await testSingleRequest(endpoint.url, endpoint.name);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${result.responseTime}ms (${result.dataCount}条数据)`);
    } else {
      console.log(`❌ ${result.responseTime}ms (${result.error})`);
    }
    
    // 测试间隔
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 计算统计信息
  const successResults = results.filter(r => r.success);
  const responseTimes = successResults.map(r => parseFloat(r.responseTime));
  
  if (responseTimes.length > 0) {
    const avgTime = (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2);
    const minTime = Math.min(...responseTimes).toFixed(2);
    const maxTime = Math.max(...responseTimes).toFixed(2);
    const successRate = ((successResults.length / TEST_ROUNDS) * 100).toFixed(1);
    
    console.log('\n📊 统计结果:');
    console.log(`   成功率: ${successRate}% (${successResults.length}/${TEST_ROUNDS})`);
    console.log(`   平均响应时间: ${avgTime}ms`);
    console.log(`   最快响应时间: ${minTime}ms`);
    console.log(`   最慢响应时间: ${maxTime}ms`);
    
    return {
      endpoint: endpoint.name,
      successRate: parseFloat(successRate),
      avgTime: parseFloat(avgTime),
      minTime: parseFloat(minTime),
      maxTime: parseFloat(maxTime)
    };
  } else {
    console.log('\n❌ 所有测试都失败了');
    return {
      endpoint: endpoint.name,
      successRate: 0,
      avgTime: 0,
      minTime: 0,
      maxTime: 0
    };
  }
}

// 主测试函数
async function runPerformanceTest() {
  console.log('🚀 汽车信息服务器 - 接口性能测试');
  console.log('=' .repeat(60));
  console.log(`测试时间: ${new Date().toLocaleString()}`);
  console.log(`测试轮数: ${TEST_ROUNDS}轮/接口`);
  console.log(`服务器地址: ${BASE_URL}`);
  
  const allResults = [];
  
  // 逐个测试接口
  for (const endpoint of testEndpoints) {
    const result = await testEndpoint(endpoint);
    allResults.push(result);
  }
  
  // 输出总结报告
  console.log('\n\n📋 性能测试总结报告');
  console.log('=' .repeat(60));
  
  allResults.forEach(result => {
    const status = result.successRate === 100 ? '✅' : result.successRate >= 80 ? '⚠️' : '❌';
    console.log(`${status} ${result.endpoint}:`);
    console.log(`   成功率: ${result.successRate}%`);
    console.log(`   平均响应: ${result.avgTime}ms`);
    console.log(`   响应范围: ${result.minTime}ms - ${result.maxTime}ms`);
    console.log('');
  });
  
  // 性能评估
  const avgResponseTime = allResults.reduce((sum, r) => sum + r.avgTime, 0) / allResults.length;
  const overallSuccessRate = allResults.reduce((sum, r) => sum + r.successRate, 0) / allResults.length;
  
  console.log('🎯 整体性能评估:');
  console.log(`   平均成功率: ${overallSuccessRate.toFixed(1)}%`);
  console.log(`   平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
  
  if (avgResponseTime < 100) {
    console.log('   性能等级: 🟢 优秀 (< 100ms)');
  } else if (avgResponseTime < 300) {
    console.log('   性能等级: 🟡 良好 (100-300ms)');
  } else if (avgResponseTime < 1000) {
    console.log('   性能等级: 🟠 一般 (300-1000ms)');
  } else {
    console.log('   性能等级: 🔴 需要优化 (> 1000ms)');
  }
  
  console.log('\n✨ 性能测试完成!');
}

// 检查服务器是否运行
async function checkServerStatus() {
  try {
    const response = await axios.get(`${BASE_URL}/vehicles/stats`, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// 启动测试
async function main() {
  console.log('🔍 检查服务器状态...');
  
  const serverRunning = await checkServerStatus();
  
  if (!serverRunning) {
    console.log('❌ 服务器未运行或无法连接');
    console.log('请确保服务器已启动: npm start');
    process.exit(1);
  }
  
  console.log('✅ 服务器运行正常，开始性能测试...\n');
  
  await runPerformanceTest();
}

// 错误处理
process.on('unhandledRejection', (error) => {
  console.error('\n❌ 测试过程中发生错误:', error.message);
  process.exit(1);
});

// 启动
main().catch(console.error);