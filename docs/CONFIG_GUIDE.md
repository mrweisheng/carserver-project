# 配置指南

## 🎯 环境变量配置

本项目支持通过 `.env` 文件配置各种参数，特别是反爬虫相关的频率限制配置。

## 📁 配置文件

### .env 文件结构

```bash
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=car_info_db
DB_USER=root
DB_PASSWORD=your_password

# JWT配置
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

# 反爬虫配置 - 频率限制
# 基础频率限制（所有接口）
RATE_LIMIT_BASIC_WINDOW_MS=900000
RATE_LIMIT_BASIC_MAX_REQUESTS=100

# 严格频率限制（敏感接口）
RATE_LIMIT_STRICT_WINDOW_MS=300000
RATE_LIMIT_STRICT_MAX_REQUESTS=20

# 登录频率限制
RATE_LIMIT_LOGIN_WINDOW_MS=900000
RATE_LIMIT_LOGIN_MAX_REQUESTS=5

# 注册频率限制
RATE_LIMIT_REGISTER_WINDOW_MS=3600000
RATE_LIMIT_REGISTER_MAX_REQUESTS=3

# 爬虫检测配置
CRAWLER_DETECTION_ENABLED=true
CRAWLER_MAX_REQUESTS_PER_MINUTE=50
CRAWLER_MIN_REQUEST_INTERVAL_MS=100

# 验证码配置
CAPTCHA_ENABLED=true
CAPTCHA_EXPIRE_MINUTES=5
CAPTCHA_MAX_ATTEMPTS=3

# 动态延迟配置
DYNAMIC_DELAY_ENABLED=true
DYNAMIC_DELAY_MIN_MS=1000
DYNAMIC_DELAY_MAX_MS=3000
```

## 🔧 配置参数说明

### 频率限制配置

#### 基础频率限制
- **RATE_LIMIT_BASIC_WINDOW_MS**: 时间窗口（毫秒），默认15分钟
- **RATE_LIMIT_BASIC_MAX_REQUESTS**: 最大请求数，默认100次

```bash
# 示例：10分钟内最多50次请求
RATE_LIMIT_BASIC_WINDOW_MS=600000
RATE_LIMIT_BASIC_MAX_REQUESTS=50
```

#### 严格频率限制
- **RATE_LIMIT_STRICT_WINDOW_MS**: 时间窗口（毫秒），默认5分钟
- **RATE_LIMIT_STRICT_MAX_REQUESTS**: 最大请求数，默认20次

```bash
# 示例：3分钟内最多10次请求
RATE_LIMIT_STRICT_WINDOW_MS=180000
RATE_LIMIT_STRICT_MAX_REQUESTS=10
```

#### 登录频率限制
- **RATE_LIMIT_LOGIN_WINDOW_MS**: 时间窗口（毫秒），默认15分钟
- **RATE_LIMIT_LOGIN_MAX_REQUESTS**: 最大请求数，默认5次

```bash
# 示例：10分钟内最多3次登录尝试
RATE_LIMIT_LOGIN_WINDOW_MS=600000
RATE_LIMIT_LOGIN_MAX_REQUESTS=3
```

#### 注册频率限制
- **RATE_LIMIT_REGISTER_WINDOW_MS**: 时间窗口（毫秒），默认1小时
- **RATE_LIMIT_REGISTER_MAX_REQUESTS**: 最大请求数，默认3次

```bash
# 示例：2小时内最多2次注册尝试
RATE_LIMIT_REGISTER_WINDOW_MS=7200000
RATE_LIMIT_REGISTER_MAX_REQUESTS=2
```

### 爬虫检测配置

#### 爬虫检测开关
- **CRAWLER_DETECTION_ENABLED**: 是否启用爬虫检测，默认true

```bash
# 禁用爬虫检测
CRAWLER_DETECTION_ENABLED=false
```

#### 频率检测
- **CRAWLER_MAX_REQUESTS_PER_MINUTE**: 每分钟最大请求数，默认50次
- **CRAWLER_MIN_REQUEST_INTERVAL_MS**: 最小请求间隔（毫秒），默认100ms
- **CRAWLER_STRICT_IP_LIMIT**: 是否启用严格IP限制，默认false

```bash
# 示例：每分钟最多30次请求，最小间隔200ms
CRAWLER_MAX_REQUESTS_PER_MINUTE=30
CRAWLER_MIN_REQUEST_INTERVAL_MS=200

# 严格IP限制模式（按IP限制，不考虑User-Agent）
CRAWLER_STRICT_IP_LIMIT=true
```

#### 限制模式说明

**模式1：IP+User-Agent限制（默认）**
- 识别键：`${ip}-${userAgent}`
- 特点：同一IP的不同User-Agent分别计数
- 适用：允许同一IP使用不同浏览器/工具
- 配置：`CRAWLER_STRICT_IP_LIMIT=false`

**模式2：严格IP限制**
- 识别键：`${ip}`
- 特点：同一IP的所有请求统一计数
- 适用：更严格的限制，防止IP滥用
- 配置：`CRAWLER_STRICT_IP_LIMIT=true`

### 验证码配置

#### 验证码开关
- **CAPTCHA_ENABLED**: 是否启用验证码，默认true

```bash
# 禁用验证码
CAPTCHA_ENABLED=false
```

#### 验证码参数
- **CAPTCHA_EXPIRE_MINUTES**: 验证码有效期（分钟），默认5分钟
- **CAPTCHA_MAX_ATTEMPTS**: 最大尝试次数，默认3次

```bash
# 示例：验证码10分钟有效，最多5次尝试
CAPTCHA_EXPIRE_MINUTES=10
CAPTCHA_MAX_ATTEMPTS=5
```

### 动态延迟配置

#### 延迟开关
- **DYNAMIC_DELAY_ENABLED**: 是否启用动态延迟，默认true

```bash
# 禁用动态延迟
DYNAMIC_DELAY_ENABLED=false
```

#### 延迟参数
- **DYNAMIC_DELAY_MIN_MS**: 最小延迟时间（毫秒），默认1000ms
- **DYNAMIC_DELAY_MAX_MS**: 最大延迟时间（毫秒），默认3000ms

```bash
# 示例：延迟2-5秒
DYNAMIC_DELAY_MIN_MS=2000
DYNAMIC_DELAY_MAX_MS=5000
```

## 🎨 配置示例

### 开发环境配置

```bash
# 开发环境 - 宽松限制
NODE_ENV=development

# 频率限制 - 宽松
RATE_LIMIT_BASIC_WINDOW_MS=300000    # 5分钟
RATE_LIMIT_BASIC_MAX_REQUESTS=200    # 200次请求
RATE_LIMIT_STRICT_WINDOW_MS=60000    # 1分钟
RATE_LIMIT_STRICT_MAX_REQUESTS=50    # 50次请求
RATE_LIMIT_LOGIN_WINDOW_MS=300000    # 5分钟
RATE_LIMIT_LOGIN_MAX_REQUESTS=10     # 10次登录
RATE_LIMIT_REGISTER_WINDOW_MS=1800000 # 30分钟
RATE_LIMIT_REGISTER_MAX_REQUESTS=5   # 5次注册

# 爬虫检测 - 宽松
CRAWLER_DETECTION_ENABLED=true
CRAWLER_MAX_REQUESTS_PER_MINUTE=100  # 每分钟100次
CRAWLER_MIN_REQUEST_INTERVAL_MS=50   # 最小间隔50ms

# 验证码 - 可选
CAPTCHA_ENABLED=false                # 开发时禁用验证码

# 动态延迟 - 轻微
DYNAMIC_DELAY_ENABLED=true
DYNAMIC_DELAY_MIN_MS=500             # 最小延迟500ms
DYNAMIC_DELAY_MAX_MS=1500            # 最大延迟1.5秒
```

### 生产环境配置

```bash
# 生产环境 - 严格限制
NODE_ENV=production

# 频率限制 - 严格
RATE_LIMIT_BASIC_WINDOW_MS=900000    # 15分钟
RATE_LIMIT_BASIC_MAX_REQUESTS=100    # 100次请求
RATE_LIMIT_STRICT_WINDOW_MS=300000   # 5分钟
RATE_LIMIT_STRICT_MAX_REQUESTS=20    # 20次请求
RATE_LIMIT_LOGIN_WINDOW_MS=900000    # 15分钟
RATE_LIMIT_LOGIN_MAX_REQUESTS=5      # 5次登录
RATE_LIMIT_REGISTER_WINDOW_MS=3600000 # 1小时
RATE_LIMIT_REGISTER_MAX_REQUESTS=3   # 3次注册

# 爬虫检测 - 严格
CRAWLER_DETECTION_ENABLED=true
CRAWLER_MAX_REQUESTS_PER_MINUTE=30   # 每分钟30次
CRAWLER_MIN_REQUEST_INTERVAL_MS=200  # 最小间隔200ms

# 验证码 - 启用
CAPTCHA_ENABLED=true
CAPTCHA_EXPIRE_MINUTES=5             # 5分钟有效期
CAPTCHA_MAX_ATTEMPTS=3               # 3次尝试

# 动态延迟 - 明显
DYNAMIC_DELAY_ENABLED=true
DYNAMIC_DELAY_MIN_MS=1000            # 最小延迟1秒
DYNAMIC_DELAY_MAX_MS=3000            # 最大延迟3秒
```

### 测试环境配置

```bash
# 测试环境 - 中等限制
NODE_ENV=test

# 频率限制 - 中等
RATE_LIMIT_BASIC_WINDOW_MS=600000    # 10分钟
RATE_LIMIT_BASIC_MAX_REQUESTS=150    # 150次请求
RATE_LIMIT_STRICT_WINDOW_MS=180000   # 3分钟
RATE_LIMIT_STRICT_MAX_REQUESTS=30    # 30次请求
RATE_LIMIT_LOGIN_WINDOW_MS=600000    # 10分钟
RATE_LIMIT_LOGIN_MAX_REQUESTS=8      # 8次登录
RATE_LIMIT_REGISTER_WINDOW_MS=2700000 # 45分钟
RATE_LIMIT_REGISTER_MAX_REQUESTS=4   # 4次注册

# 爬虫检测 - 中等
CRAWLER_DETECTION_ENABLED=true
CRAWLER_MAX_REQUESTS_PER_MINUTE=60   # 每分钟60次
CRAWLER_MIN_REQUEST_INTERVAL_MS=100  # 最小间隔100ms

# 验证码 - 启用
CAPTCHA_ENABLED=true
CAPTCHA_EXPIRE_MINUTES=10            # 10分钟有效期
CAPTCHA_MAX_ATTEMPTS=5               # 5次尝试

# 动态延迟 - 中等
DYNAMIC_DELAY_ENABLED=true
DYNAMIC_DELAY_MIN_MS=800             # 最小延迟800ms
DYNAMIC_DELAY_MAX_MS=2000            # 最大延迟2秒
```

## 🚀 配置最佳实践

### 1. 环境区分

- **开发环境**：宽松限制，快速响应
- **测试环境**：中等限制，平衡性能
- **生产环境**：严格限制，安全优先

### 2. 渐进式调整

1. **初始配置**：使用默认值
2. **监控分析**：观察请求模式和异常
3. **逐步调整**：根据实际情况微调参数
4. **效果评估**：评估用户体验和安全性

### 3. 监控指标

- **请求频率**：正常用户 vs 异常用户
- **响应时间**：确保用户体验
- **错误率**：避免误判正常用户
- **安全性**：爬虫拦截效果

### 4. 应急预案

- **快速调整**：紧急情况下快速修改配置
- **白名单机制**：为特定IP或用户组设置例外
- **降级策略**：系统负载高时临时放宽限制

## 📝 配置更新

### 热更新支持

部分配置支持热更新，无需重启服务：

```javascript
// 在代码中重新加载配置
const { config } = require('./middleware/antiCrawler');
const newConfig = getConfig(); // 重新读取环境变量
```

### 配置验证

建议在启动时验证配置：

```javascript
// 配置验证示例
const validateConfig = () => {
  const config = getConfig();
  
  // 验证频率限制配置
  if (config.basic.max < 1) {
    throw new Error('基础频率限制必须大于0');
  }
  
  if (config.strict.windowMs < 60000) {
    throw new Error('严格频率限制时间窗口不能小于1分钟');
  }
  
  // 验证延迟配置
  if (config.delay.minMs >= config.delay.maxMs) {
    throw new Error('最小延迟时间必须小于最大延迟时间');
  }
  
  console.log('配置验证通过');
};
```

## 🔍 故障排查

### 常见问题

1. **配置不生效**
   - 检查 `.env` 文件格式
   - 确认环境变量名称正确
   - 重启服务

2. **限制过于严格**
   - 调整频率限制参数
   - 检查是否有误判
   - 查看日志分析

3. **性能问题**
   - 优化配置参数
   - 检查内存使用
   - 考虑使用Redis

### 日志分析

```bash
# 查看可疑请求日志
grep "可疑请求检测" app.log

# 查看频率限制日志
grep "请求过于频繁" app.log

# 查看验证码日志
grep "验证码" app.log
```
