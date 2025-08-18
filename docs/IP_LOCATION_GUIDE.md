# IP地理位置功能使用指南

## 📋 功能概述

IP地理位置功能可以自动获取访客的IP地址对应的地理位置信息，包括国家、省份、城市、网络服务商等信息，为数据分析提供更丰富的维度。

## 🗄️ 数据库修改

### 1. 执行数据库表结构修改

```bash
# 在MySQL中执行以下SQL文件
mysql -u your_username -p your_database < database/add_ip_location_fields.sql
```

### 2. 新增的字段说明

#### users 表新增字段
- `country` - 国家
- `city` - 城市  
- `isp` - 网络服务商
- `timezone` - 时区
- `location_updated_at` - 地理位置更新时间

#### daily_visitors 表新增字段
- `country` - 国家
- `region` - 省份/州
- `city` - 城市
- `isp` - 网络服务商
- `timezone` - 时区
- `location_updated_at` - 地理位置更新时间

#### user_browsing_history 表新增字段
- `country` - 国家
- `region` - 省份/州
- `city` - 城市
- `isp` - 网络服务商
- `timezone` - 时区
- `location_updated_at` - 地理位置更新时间

#### user_sessions 表新增字段
- `country` - 国家
- `region` - 省份/州
- `city` - 城市
- `isp` - 网络服务商
- `timezone` - 时区
- `location_updated_at` - 地理位置更新时间

#### 新增 ip_location_cache 表
用于缓存IP地理位置信息，避免重复查询API，提高性能。

## 🔧 代码更新

### 1. 新增文件
- `models/IPLocationCache.js` - IP地理位置缓存模型
- `scripts/update_existing_ip_locations.js` - 数据修复脚本

### 2. 更新的文件
- `utils/ipUtils.js` - 增强IP地理位置获取功能
- `models/index.js` - 添加新模型
- `controllers/authController.js` - 用户注册/登录时记录地理位置
- `controllers/visitorController.js` - 访客统计时记录地理位置
- `middleware/visitorStats.js` - 使用清理后的IP地址

## 🚀 使用方法

### 1. 安装依赖
```bash
npm install axios
```

### 2. 执行数据修复脚本
```bash
# 为现有数据添加地理位置信息
node scripts/update_existing_ip_locations.js
```

### 3. 功能特性

#### 自动IP清理
- 自动处理IPv6映射的IPv4地址（`::ffff:192.168.1.1` → `192.168.1.1`）
- 处理IPv6本地地址（`::1` → `127.0.0.1`）

#### 地理位置缓存
- 自动缓存IP地理位置信息
- 避免重复查询API
- 提高响应速度

#### 免费API使用
- 使用 ip-api.com 免费API
- 每天45,000次请求限制
- 支持中文返回

#### 错误处理
- 网络超时处理（5秒）
- 本地IP地址处理
- 失败时返回默认值

## 📊 数据查询示例

### 1. 查看访客地理位置分布
```sql
SELECT 
    country,
    region,
    city,
    COUNT(*) as visitor_count
FROM daily_visitors 
WHERE country IS NOT NULL
GROUP BY country, region, city
ORDER BY visitor_count DESC;
```

### 2. 查看用户地理位置分布
```sql
SELECT 
    country,
    city,
    COUNT(*) as user_count
FROM users 
WHERE country IS NOT NULL
GROUP BY country, city
ORDER BY user_count DESC;
```

### 3. 查看IP地理位置缓存
```sql
SELECT 
    ip_address,
    country,
    region,
    city,
    isp,
    created_at
FROM ip_location_cache
ORDER BY created_at DESC
LIMIT 10;
```

## 🔍 监控和维护

### 1. 查看API使用情况
```bash
# 查看缓存表大小
mysql -e "SELECT COUNT(*) as cache_count FROM ip_location_cache;"

# 查看未获取地理位置的IP数量
mysql -e "SELECT COUNT(*) as missing_location FROM daily_visitors WHERE country IS NULL;"
```

### 2. 定期清理缓存
```sql
-- 删除30天前的缓存记录
DELETE FROM ip_location_cache 
WHERE updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

### 3. 监控API限制
- ip-api.com 免费版每天限制45,000次请求
- 建议在低峰期执行批量更新
- 使用缓存减少API调用

## ⚠️ 注意事项

1. **API限制**: 免费API有请求频率限制，建议合理使用
2. **数据准确性**: IP地理位置数据仅供参考，可能存在误差
3. **隐私保护**: 确保符合当地隐私法规要求
4. **网络依赖**: 需要网络连接才能获取地理位置信息
5. **性能影响**: 首次查询会有延迟，后续查询使用缓存

## 🛠️ 故障排除

### 1. API请求失败
- 检查网络连接
- 确认API服务状态
- 检查请求频率是否超限

### 2. 数据不准确
- IP地址可能使用代理或VPN
- 移动网络IP定位可能不准确
- 某些IP段可能无法定位

### 3. 性能问题
- 检查缓存表大小
- 定期清理过期缓存
- 优化查询索引

## 📞 技术支持

如有问题，请查看：
- 项目文档
- API文档
- 错误日志

---

**版本**: 1.0.0  
**更新时间**: 2024-01-01  
**维护者**: 开发团队
