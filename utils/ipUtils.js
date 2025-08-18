const axios = require('axios');
const { Op } = require('sequelize');

/**
 * 清理IP地址，将IPv6映射的IPv4地址转换为纯IPv4格式
 * @param {string} ip - 原始IP地址
 * @returns {string} 清理后的IP地址
 */
const cleanIPAddress = (ip) => {
  if (!ip) return '127.0.0.1';
  
  // 处理IPv6映射的IPv4地址 (::ffff:192.168.1.1)
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7); // 移除 ::ffff: 前缀
  }
  
  // 处理IPv6本地地址 (::1)
  if (ip === '::1') {
    return '127.0.0.1';
  }
  
  return ip;
};

/**
 * 从缓存中获取IP地理位置信息
 * @param {string} ip - IP地址
 * @param {Object} models - Sequelize模型
 * @returns {Promise<Object|null>} 地理位置信息
 */
const getIPLocationFromCache = async (ip, models) => {
  try {
    if (!models || !models.IPLocationCache) {
      return null;
    }
    
    const cache = await models.IPLocationCache.findOne({
      where: { ip_address: ip }
    });
    
    if (cache) {
      return {
        country: cache.country,
        region: cache.region,
        city: cache.city,
        isp: cache.isp,
        timezone: cache.timezone,
        latitude: cache.latitude,
        longitude: cache.longitude
      };
    }
    
    return null;
  } catch (error) {
    console.error('从缓存获取IP地理位置失败:', error);
    return null;
  }
};

/**
 * 将IP地理位置信息保存到缓存
 * @param {string} ip - IP地址
 * @param {Object} locationData - 地理位置数据
 * @param {Object} models - Sequelize模型
 */
const saveIPLocationToCache = async (ip, locationData, models) => {
  try {
    if (!models || !models.IPLocationCache) {
      return;
    }
    
    await models.IPLocationCache.upsert({
      ip_address: ip,
      country: locationData.country,
      region: locationData.region,
      city: locationData.city,
      isp: locationData.isp,
      timezone: locationData.timezone,
      latitude: locationData.latitude,
      longitude: locationData.longitude
    });
  } catch (error) {
    console.error('保存IP地理位置到缓存失败:', error);
  }
};

/**
 * 根据IP地址获取地区信息（带缓存和容错）
 * @param {string} ip - IP地址
 * @param {Object} models - Sequelize模型（可选）
 * @returns {Promise<Object>} 地区信息
 */
const getRegionByIP = async (ip, models = null) => {
  try {
    // 清理IP地址
    const cleanIP = cleanIPAddress(ip);
    
    // 如果是本地IP，返回默认值
    if (cleanIP === '127.0.0.1' || cleanIP === 'localhost' || cleanIP.startsWith('192.168.') || cleanIP.startsWith('10.') || cleanIP.startsWith('172.')) {
      return {
        country: '本地网络',
        region: '本地网络',
        city: '本地网络',
        isp: '本地网络',
        timezone: 'Asia/Shanghai',
        latitude: null,
        longitude: null
      };
    }

    // 如果有模型，先尝试从缓存获取
    if (models) {
      try {
        const cachedLocation = await getIPLocationFromCache(cleanIP, models);
        if (cachedLocation) {
          return cachedLocation;
        }
      } catch (cacheError) {
        console.error('缓存查询失败，继续使用API:', cacheError.message);
      }
    }

    // 使用免费的IP地理位置API（带容错）
    try {
      const response = await axios.get(`http://ip-api.com/json/${cleanIP}?lang=zh-CN`, {
        timeout: 3000 // 3秒超时，更快失败
      });
      
      if (response.data && response.data.status === 'success') {
        const locationData = {
          country: response.data.country || '未知',
          region: response.data.regionName || '未知',
          city: response.data.city || '未知',
          isp: response.data.isp || '未知',
          timezone: response.data.timezone || 'Asia/Shanghai',
          latitude: response.data.lat || null,
          longitude: response.data.lon || null
        };
        
        // 如果有模型，异步保存到缓存（不阻塞主流程）
        if (models) {
          setImmediate(async () => {
            try {
              await saveIPLocationToCache(cleanIP, locationData, models);
            } catch (cacheError) {
              console.error('异步保存缓存失败:', cacheError.message);
            }
          });
        }
        
        return locationData;
      }
    } catch (apiError) {
      console.error('IP地理位置API请求失败:', apiError.message);
      
      // API失败时，返回默认值，不影响主流程
      return {
        country: '未知',
        region: '未知',
        city: '未知',
        isp: '未知',
        timezone: 'Asia/Shanghai',
        latitude: null,
        longitude: null
      };
    }
    
    // 如果API返回失败状态，返回默认值
    return {
      country: '未知',
      region: '未知',
      city: '未知',
      isp: '未知',
      timezone: 'Asia/Shanghai',
      latitude: null,
      longitude: null
    };
  } catch (error) {
    console.error('获取IP地区信息失败:', error.message);
    // 任何错误都返回默认值，确保不影响主流程
    return {
      country: '未知',
      region: '未知',
      city: '未知',
      isp: '未知',
      timezone: 'Asia/Shanghai',
      latitude: null,
      longitude: null
    };
  }
};

/**
 * 获取客户端真实IP地址
 * @param {Object} req - Express请求对象
 * @returns {string} IP地址
 */
const getClientIP = (req) => {
  const rawIP = req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.ip || 
         '127.0.0.1';
  
  return cleanIPAddress(rawIP);
};

/**
 * 批量更新IP地理位置信息（带容错）
 * @param {Array} ips - IP地址数组
 * @param {Object} models - Sequelize模型
 * @returns {Promise<Object>} 更新结果
 */
const batchUpdateIPLocations = async (ips, models) => {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  for (const ip of ips) {
    try {
      const locationData = await getRegionByIP(ip, models);
      await saveIPLocationToCache(ip, locationData, models);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({ ip, error: error.message });
    }
  }
  
  return results;
};

module.exports = {
  getRegionByIP,
  getClientIP,
  cleanIPAddress,
  getIPLocationFromCache,
  saveIPLocationToCache,
  batchUpdateIPLocations
};
