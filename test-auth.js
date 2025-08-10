const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// 测试数据
const testUser = {
  username: 'testuser',
  password: '123456',
  real_name: '测试用户',
  email: 'test@example.com',
  gender: 'male',
  phone: '13800138000'
};

// 获取验证码
async function getCaptcha() {
  try {
    console.log('🔍 获取验证码...');
    const response = await axios.get(`${BASE_URL}/api/captcha`);
    console.log('✅ 验证码获取成功:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ 获取验证码失败:', error.response?.data || error.message);
    return null;
  }
}

// 用户注册
async function registerUser(captchaData) {
  try {
    console.log('\n🔍 测试用户注册...');
    const registerData = {
      ...testUser,
      captcha: captchaData?.code || '0000',
      captchaId: captchaData?.id || 'test'
    };
    
    const response = await axios.post(`${BASE_URL}/api/auth/register`, registerData);
    console.log('✅ 注册成功:', response.data);
    return response.data.data.token;
  } catch (error) {
    console.error('❌ 注册失败:', error.response?.data || error.message);
    return null;
  }
}

// 用户登录
async function loginUser(token = null) {
  try {
    console.log('\n🔍 测试用户登录...');
    const loginData = {
      username: testUser.username,
      password: testUser.password
    };
    
    // 如果注册失败，尝试获取验证码
    if (!token) {
      const captchaData = await getCaptcha();
      if (captchaData) {
        loginData.captcha = captchaData.code;
        loginData.captchaId = captchaData.id;
      }
    }
    
    const response = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    console.log('✅ 登录成功:', response.data);
    return response.data.data.token;
  } catch (error) {
    console.error('❌ 登录失败:', error.response?.data || error.message);
    return null;
  }
}

// 获取用户信息
async function getUserInfo(token) {
  try {
    console.log('\n🔍 获取用户信息...');
    const response = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ 获取用户信息成功:', response.data);
    return response.data.data;
  } catch (error) {
    console.error('❌ 获取用户信息失败:', error.response?.data || error.message);
    return null;
  }
}

// 用户登出
async function logoutUser(token) {
  try {
    console.log('\n🔍 测试用户登出...');
    const response = await axios.post(`${BASE_URL}/api/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ 登出成功:', response.data);
    return true;
  } catch (error) {
    console.error('❌ 登出失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试管理员登录（如果存在）
async function testAdminLogin() {
  try {
    console.log('\n🔍 测试管理员登录...');
    const adminData = {
      username: 'admin',
      password: 'admin123'
    };
    
    const response = await axios.post(`${BASE_URL}/api/auth/login`, adminData);
    console.log('✅ 管理员登录成功:', response.data);
    return response.data.data.token;
  } catch (error) {
    console.log('❌ 管理员登录失败（可能不存在）:', error.response?.data?.message || error.message);
    return null;
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试用户认证系统...\n');
  
  // 1. 获取验证码
  const captchaData = await getCaptcha();
  
  // 2. 测试注册
  const registerToken = await registerUser(captchaData);
  
  // 3. 测试登录
  const loginToken = await loginUser(registerToken);
  
  // 4. 获取用户信息
  if (loginToken) {
    await getUserInfo(loginToken);
    
    // 5. 测试登出
    await logoutUser(loginToken);
  }
  
  // 6. 测试管理员登录
  await testAdminLogin();
  
  console.log('\n🎉 测试完成！');
}

// 运行测试
runTests().catch(console.error);
