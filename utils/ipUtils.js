const axios = require('axios');

/**
 * 根据IP地址获取地区信息
 * @param {string} ip - IP地址
 * @returns {Promise<Object>} 地区信息
 */
const getRegionByIP = async (ip) => {
  try {
    // 如果是本地IP，返回默认值
    if (ip === '127.0.0.1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return {
        region: '未知地区',
        country: '未知',
        city: '未知'
      };
    }

    // 使用免费的IP地理位置API
    const response = await axios.get(`http://ip-api.com/json/${ip}?lang=zh-CN`);
    
    if (response.data && response.data.status === 'success') {
      const { country, regionName, city } = response.data;
      return {
        region: `${country} ${regionName} ${city}`.trim(),
        country: country || '未知',
        city: city || '未知'
      };
    }
    
    return {
      region: '未知地区',
      country: '未知',
      city: '未知'
    };
  } catch (error) {
    console.error('获取IP地区信息失败:', error);
    return {
      region: '未知地区',
      country: '未知',
      city: '未知'
    };
  }
};

/**
 * 获取客户端真实IP地址
 * @param {Object} req - Express请求对象
 * @returns {string} IP地址
 */
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.ip || 
         '127.0.0.1';
};

module.exports = {
  getRegionByIP,
  getClientIP
};
