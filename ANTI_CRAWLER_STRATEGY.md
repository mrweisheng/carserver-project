# 反爬虫策略文档

## 🎯 策略概述

本项目的反爬虫策略采用**多层次、智能化、平衡性**的设计理念，既保护网站数据安全，又确保正常用户的良好体验。

## 🛡️ 反爬虫措施

### 1. 频率限制 (Rate Limiting)

#### 基础频率限制
- **时间窗口**：15分钟
- **最大请求数**：100次
- **识别方式**：IP + User-Agent
- **适用场景**：所有接口

#### 严格频率限制
- **时间窗口**：5分钟
- **最大请求数**：20次
- **适用场景**：敏感接口（认证、注册等）

#### 登录频率限制
- **时间窗口**：15分钟
- **最大请求数**：5次
- **适用场景**：登录接口

#### 注册频率限制
- **时间窗口**：1小时
- **最大请求数**：3次
- **适用场景**：注册接口

### 2. 爬虫检测

#### User-Agent检测
检测常见的爬虫标识：
```javascript
const crawlerPatterns = [
  /bot/i, /spider/i, /crawler/i, /scraper/i,
  /curl/i, /wget/i, /python/i, /java/i,
  /phantomjs/i, /headless/i, /selenium/i, /puppeteer/i
];
```

#### 请求头检测
检测可疑的请求头：
- `x-forwarded-for`
- `x-real-ip`
- `x-client-ip`
- `x-forwarded`
- `x-cluster-client-ip`
- `forwarded-for`
- `forwarded`

#### 频率检测
- 1分钟内请求超过50次标记为可疑
- 请求间隔小于100ms标记为自动化工具

### 3. 验证码系统

#### 图形验证码
- **格式**：4位数字
- **有效期**：5分钟
- **尝试次数**：最多3次
- **适用场景**：注册、敏感操作

#### 验证码接口
```
GET /api/captcha
响应：
{
  "code": 200,
  "message": "验证码生成成功",
  "data": {
    "id": "验证码ID",
    "image": "base64编码的图片"
  }
}
```

### 4. 动态响应

#### 随机延迟
- **检测对象**：可疑爬虫
- **延迟时间**：1-3秒随机
- **目的**：增加爬虫成本

#### 响应随机化
- 添加随机时间戳
- 添加随机请求ID
- 增加解析难度

### 5. 内容保护

#### 响应头保护
```javascript
res.setHeader('X-Content-Type-Options', 'nosniff');
res.setHeader('X-Frame-Options', 'DENY');
res.setHeader('X-XSS-Protection', '1; mode=block');
```

#### CSP策略
```javascript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
  },
}
```

### 6. 设备指纹

#### 指纹检测
- 检测设备指纹头
- 记录设备特征
- 异常设备标记

### 7. 智能策略

#### 请求来源分析
- 检查Referer头
- 识别直接API访问
- 记录可疑行为

#### 行为分析
- 请求模式分析
- 时间间隔检测
- 异常行为标记

## 🎨 用户体验平衡

### 1. 渐进式限制

#### 轻度限制
- 正常用户：无感知
- 可疑用户：轻微延迟
- 爬虫：明显延迟

#### 中度限制
- 可疑用户：验证码
- 爬虫：拒绝访问

#### 严格限制
- 恶意爬虫：IP封禁
- 异常行为：账号限制

### 2. 白名单机制

#### 搜索引擎
- Google Bot
- Bing Bot
- Baidu Spider
- 其他主流搜索引擎

#### 合作伙伴
- 授权的第三方应用
- 合作伙伴API
- 内部测试工具

### 3. 用户友好

#### 错误提示
- 清晰的错误信息
- 友好的提示语言
- 解决建议

#### 恢复机制
- 自动解封
- 申诉渠道
- 人工审核

## 🔧 技术实现

### 1. 中间件架构

```javascript
// 反爬虫中间件顺序
app.use(contentProtection);           // 内容保护
app.use(deviceFingerprint);           // 设备指纹检测
app.use(detectCrawler);               // 爬虫检测
app.use(intelligentAntiCrawler);      // 智能反爬虫
app.use(dynamicDelay);                // 动态延迟
app.use(basicRateLimit);              // 基础频率限制
```

### 2. 数据存储

#### 内存存储（开发环境）
- 请求历史：Map对象
- 验证码：Map对象
- 频率限制：内存缓存

#### Redis存储（生产环境）
- 请求历史：Redis Hash
- 验证码：Redis String
- 频率限制：Redis Sorted Set

### 3. 监控告警

#### 日志记录
```javascript
console.log(`可疑请求检测: IP=${ip}, UA=${userAgent}, 频率=${recentRequests.length}/min`);
```

#### 告警机制
- 异常请求告警
- 频率超限告警
- 系统异常告警

## 📊 效果评估

### 1. 指标监控

#### 请求统计
- 总请求数
- 正常请求数
- 可疑请求数
- 被拒绝请求数

#### 性能指标
- 响应时间
- 成功率
- 错误率

### 2. 效果评估

#### 爬虫拦截率
- 目标：>90%
- 误判率：<1%

#### 用户体验
- 正常用户无感知
- 响应时间增加<100ms
- 成功率>99%

## 🚀 部署建议

### 1. 环境配置

#### 开发环境
- 宽松限制
- 详细日志
- 快速响应

#### 生产环境
- 严格限制
- 精简日志
- 性能优化

### 2. 监控告警

#### 实时监控
- 请求频率
- 异常行为
- 系统性能

#### 告警通知
- 邮件通知
- 短信通知
- 钉钉/企业微信

### 3. 应急预案

#### 紧急情况
- 快速调整限制
- 临时白名单
- 人工干预

#### 恢复流程
- 问题定位
- 策略调整
- 效果验证

## 📝 更新日志

### v1.0.0 (2025-01-09)
- ✅ 基础反爬虫框架
- ✅ 频率限制系统
- ✅ 验证码系统
- ✅ 爬虫检测
- ✅ 内容保护
- ✅ 智能策略
