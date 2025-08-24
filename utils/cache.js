/**
 * 内存缓存工具类
 * 支持TTL过期时间，自动清理过期缓存
 * 适用于高并发场景，完全基于内存，无外部依赖
 */

class MemoryCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 10000; // 最大缓存条目数
    this.maxMemoryMB = options.maxMemoryMB || 100; // 最大内存使用量（MB）
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
      evictions: 0 // 新增：被驱逐的缓存数量
    };
    
    // 启动自动清理任务（每5分钟清理一次过期缓存）
    this.startCleanupTask();
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttlSeconds - 过期时间（秒）
   * @returns {boolean} 是否设置成功
   */
  set(key, value, ttlSeconds = 600) {
    try {
      // 检查缓存大小限制
      if (this.cache.size >= this.maxSize) {
        this.evictOldest();
      }
      
      // 检查内存使用限制
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
      if (heapUsedMB > this.maxMemoryMB) {
        this.evictOldest();
      }
      
      const expireTime = Date.now() + (ttlSeconds * 1000);
      this.cache.set(key, {
        value: value,
        expireTime: expireTime,
        createdAt: Date.now(),
        accessCount: 0 // 新增：访问次数统计
      });
      
      this.stats.sets++;
      this.stats.size = this.cache.size;
      
      return true;
    } catch (error) {
      console.error('缓存设置失败:', error.message);
      return false;
    }
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {any|null} 缓存值或null
   */
  get(key) {
    try {
      const item = this.cache.get(key);
      
      if (!item) {
        this.stats.misses++;
        return null;
      }

      // 检查是否过期
      if (Date.now() > item.expireTime) {
        this.cache.delete(key);
        this.stats.misses++;
        this.stats.size = this.cache.size;
        return null;
      }

      // 更新访问统计
      item.accessCount++;
      item.lastAccessed = Date.now();
      
      this.stats.hits++;
      return item.value;
    } catch (error) {
      console.error('缓存获取失败:', error.message);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   * @returns {boolean} 是否删除成功
   */
  delete(key) {
    try {
      const result = this.cache.delete(key);
      if (result) {
        this.stats.deletes++;
        this.stats.size = this.cache.size;
      }
      return result;
    } catch (error) {
      console.error('缓存删除失败:', error.message);
      return false;
    }
  }

  /**
   * 批量删除缓存（支持通配符）
   * @param {string} pattern - 匹配模式
   * @returns {number} 删除的缓存数量
   */
  deletePattern(pattern) {
    try {
      let deletedCount = 0;
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
          deletedCount++;
        }
      }
      
      this.stats.deletes += deletedCount;
      this.stats.size = this.cache.size;
      
      return deletedCount;
    } catch (error) {
      console.error('批量删除缓存失败:', error.message);
      return 0;
    }
  }

  /**
   * 检查缓存是否存在
   * @param {string} key - 缓存键
   * @returns {boolean} 是否存在
   */
  exists(key) {
    try {
      const item = this.cache.get(key);
      if (!item) return false;
      
      // 检查是否过期
      if (Date.now() > item.expireTime) {
        this.cache.delete(key);
        this.stats.size = this.cache.size;
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('检查缓存失败:', error.message);
      return false;
    }
  }

  /**
   * 清空所有缓存
   */
  clear() {
    try {
      this.cache.clear();
      this.stats.size = 0;
      console.log('缓存已清空');
    } catch (error) {
      console.error('清空缓存失败:', error.message);
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      totalRequests: total,
      memoryUsage: this.getMemoryUsage()
    };
  }

  /**
   * 获取内存使用情况
   * @returns {Object} 内存使用信息
   */
  getMemoryUsage() {
    try {
      const usage = process.memoryUsage();
      return {
        rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
        external: Math.round(usage.external / 1024 / 1024) + 'MB'
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * 驱逐最旧的缓存项（LRU策略）
   */
  evictOldest() {
    try {
      let oldestKey = null;
      let oldestTime = Date.now();
      
      // 找到最旧的缓存项
      for (const [key, item] of this.cache.entries()) {
        if (item.lastAccessed < oldestTime) {
          oldestTime = item.lastAccessed;
          oldestKey = key;
        }
      }
      
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.stats.evictions++;
        this.stats.size = this.cache.size;
        console.log(`驱逐缓存项: ${oldestKey}`);
      }
    } catch (error) {
      console.error('驱逐缓存失败:', error.message);
    }
  }

  /**
   * 清理过期缓存
   */
  cleanup() {
    try {
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const [key, item] of this.cache.entries()) {
        if (now > item.expireTime) {
          this.cache.delete(key);
          cleanedCount++;
        }
      }
      
      this.stats.size = this.cache.size;
      
      if (cleanedCount > 0) {
        console.log(`清理了 ${cleanedCount} 个过期缓存`);
      }
    } catch (error) {
      console.error('清理过期缓存失败:', error.message);
    }
  }

  /**
   * 启动自动清理任务
   */
  startCleanupTask() {
    // 每5分钟清理一次过期缓存
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }
}

// 创建全局缓存实例
const memoryCache = new MemoryCache();

// 缓存工具函数
const cacheUtils = {
  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} ttlSeconds - 过期时间（秒）
   * @returns {boolean} 是否设置成功
   */
  set: (key, value, ttlSeconds = 600) => memoryCache.set(key, value, ttlSeconds),

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {any|null} 缓存值或null
   */
  get: (key) => memoryCache.get(key),

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   * @returns {boolean} 是否删除成功
   */
  delete: (key) => memoryCache.delete(key),

  /**
   * 批量删除缓存
   * @param {string} pattern - 匹配模式
   * @returns {number} 删除的缓存数量
   */
  deletePattern: (pattern) => memoryCache.deletePattern(pattern),

  /**
   * 检查缓存是否存在
   * @param {string} key - 缓存键
   * @returns {boolean} 是否存在
   */
  exists: (key) => memoryCache.exists(key),

  /**
   * 清空所有缓存
   */
  clear: () => memoryCache.clear(),

  /**
   * 获取缓存统计信息
   * @returns {Object} 统计信息
   */
  getStats: () => memoryCache.getStats(),

  /**
   * 生成缓存键
   * @param {string} prefix - 前缀
   * @param {Object} params - 参数对象
   * @returns {string} 缓存键
   */
  generateKey: (prefix, params = {}) => {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return sortedParams ? `${prefix}:${sortedParams}` : prefix;
  },

  /**
   * 清除车辆相关缓存（数据更新时调用）
   * @param {string} vehicleId - 车辆ID（可选）
   */
  clearVehicleCache: (vehicleId = null) => {
    try {
      if (vehicleId) {
        // 清除特定车辆的缓存
        memoryCache.deletePattern(`vehicles:detail:${vehicleId}`);
        memoryCache.deletePattern(`vehicles:list:*vehicle_id=${vehicleId}*`);
      } else {
        // 清除所有车辆相关缓存
        memoryCache.deletePattern('vehicles:list:*');
        memoryCache.deletePattern('vehicles:detail:*');
        memoryCache.deletePattern('vehicles:featured*');
        memoryCache.deletePattern('vehicles:latest*');
        memoryCache.deletePattern('vehicles:special*');
        memoryCache.deletePattern('vehicles:stats*');
      }
      console.log(`清除车辆缓存: ${vehicleId || '全部'}`);
    } catch (error) {
      console.error('清除车辆缓存失败:', error.message);
    }
  },

  /**
   * 清除品牌相关缓存
   */
  clearBrandCache: () => {
    try {
      memoryCache.deletePattern('vehicles:brands*');
      console.log('清除品牌缓存');
    } catch (error) {
      console.error('清除品牌缓存失败:', error.message);
    }
  }
};

module.exports = { memoryCache, cacheUtils };
