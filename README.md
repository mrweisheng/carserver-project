# 汽车信息服务器 (Car Information Server)

基于 Node.js + Express + MySQL + Sequelize 的现代化汽车信息查询服务，具备完整的用户认证体系和智能隐私保护功能。

## ✨ 主要功能

### 🔐 用户认证系统
- **用户注册/登录**：支持用户名登录，邮箱作为可选信息
- **JWT令牌认证**：安全的身份验证机制
- **图形验证码**：防止恶意注册和爬虫攻击
- **IP地理位置**：自动获取用户地区和网络位置

### 🚗 车辆信息查询
- **车辆列表查询**：支持分页、筛选、排序
- **车辆详情查询**：包含完整信息和图片列表
- **车辆统计信息**：类型分布、状态统计、热门品牌
- **智能筛选**：按类型、状态、品牌、年份、座位数量等条件筛选

### 🚀 车辆发布系统
- **车辆发布**：支持用户发布车辆信息
- **图片上传**：支持多图片上传（最多10张，每张最大5MB）
- **格式支持**：JPEG、JPG、PNG、WEBP格式
- **状态管理**：支持发布、草稿、下架状态

### 🛡️ 智能隐私保护
- **手机号脱敏**：未登录用户显示脱敏号码（13******89）
- **登录状态识别**：已登录用户显示完整联系方式
- **毫秒级处理**：脱敏操作不影响查询性能

### 🚫 反爬虫防护
- **多层级防护**：频率限制、爬虫检测、验证码系统
- **智能识别**：User-Agent分析、请求模式检测
- **动态响应**：随机延迟、响应随机化
- **可配置策略**：通过环境变量灵活调整防护级别

### 🌐 IP地理位置功能
- **自动IP清理**：处理IPv6映射的IPv4地址（`::ffff:192.168.1.1` → `192.168.1.1`）
- **地理位置获取**：自动获取访客的国家、省份、城市、网络服务商等信息
- **智能缓存**：缓存IP地理位置信息，避免重复查询API
- **免费API**：使用 ip-api.com 免费服务，每天45,000次请求限制
- **数据统计**：提供访客地理位置分布统计和分析

## 🏗️ 技术架构

### 后端技术栈
- **Node.js** - 运行环境
- **Express.js** - Web框架
- **MySQL** - 数据库
- **Sequelize** - ORM框架
- **JWT** - 身份认证
- **bcryptjs** - 密码加密

### 核心模块
- **用户管理**：注册、登录、会话管理
- **车辆查询**：列表、详情、统计
- **车辆发布**：发布、图片上传、状态管理
- **隐私保护**：智能脱敏、权限控制
- **安全防护**：反爬虫、频率限制、验证码

## 🚀 快速开始

### 环境要求
- Node.js >= 14.0.0
- MySQL >= 5.7
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd carserver
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp config.env.example .env
# 或参考 env-config.js 文件创建 .env 文件
# 编辑 .env 文件，配置数据库连接和JWT密钥
```

4. **启动服务**
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 📊 API接口

详细的API文档请查看 [docs/API.md](./docs/API.md)

### 用户认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/logout` - 用户登出
- `GET /api/captcha` - 获取验证码

### 车辆信息
- `GET /api/vehicles` - 获取车辆列表（支持座位数量搜索）
- `GET /api/vehicles/:id` - 获取车辆详情
- `GET /api/vehicles/stats` - 获取车辆统计

### 隐私保护特性
- **智能脱敏**：根据登录状态自动处理手机号显示
- **权限控制**：已登录用户获取完整信息，未登录用户获取脱敏信息
- **性能优化**：脱敏处理毫秒级完成，不影响查询性能

## 🔧 配置说明

### 环境变量
```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=car_info_db

# JWT配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# 反爬虫配置
CRAWLER_DETECTION_ENABLED=true
CRAWLER_MAX_REQUESTS_PER_MINUTE=50
CRAWLER_STRICT_IP_LIMIT=false
```

### 反爬虫策略配置
详细的配置说明请参考 [docs/CONFIG_GUIDE.md](./docs/CONFIG_GUIDE.md) 文件。

## 📁 项目结构

```
carserver/
├── docs/            # 📚 项目文档
│   ├── API.md       # API接口文档
│   ├── DEPLOYMENT_GUIDE.md  # 部署指南
│   ├── CONFIG_GUIDE.md      # 配置指南
│   ├── CONTRIBUTING.md      # 贡献指南
│   ├── CHANGELOG.md         # 更新日志
│   └── ANTI_CRAWLER_STRATEGY.md # 反爬虫策略
├── config/          # 配置文件
├── controllers/     # 控制器
├── middleware/      # 中间件
├── models/         # 数据模型
├── routes/         # 路由定义
├── utils/          # 工具函数
├── app.js          # 应用入口
├── package.json    # 项目配置
└── README.md       # 项目说明
```

## 🧪 测试

### API测试
推荐使用 Apifox 或 Postman 进行接口测试：

1. **获取验证码**
```bash
GET http://localhost:3000/api/captcha
```

2. **用户注册**
```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "password": "123456",
  "real_name": "测试用户",
  "email": "test@example.com",
  "gender": "male",
  "phone": "13800138000",
  "captcha": "1234",
  "captchaId": "captcha_id_from_step_1"
}
```

3. **车辆查询（未登录）**
```bash
GET http://localhost:3000/api/vehicles?page=1&limit=5
# 手机号显示为：13******00
```

4. **车辆查询（已登录）**
```bash
GET http://localhost:3000/api/vehicles?page=1&limit=5
Authorization: Bearer <your_jwt_token>
# 手机号显示完整：13800138000
```

## 🔒 安全特性

- **密码加密**：使用 bcryptjs 进行密码哈希
- **JWT认证**：安全的令牌机制
- **输入验证**：完整的参数验证和清理
- **SQL注入防护**：使用 Sequelize ORM
- **XSS防护**：响应头安全配置
- **CORS配置**：支持跨域请求

## 📈 性能优化

- **数据库索引**：关键字段建立索引
- **查询优化**：分页查询、字段选择
- **缓存策略**：验证码内存缓存
- **连接池**：数据库连接复用

## 🤝 贡献指南

详细的贡献指南请查看 [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)

### 快速开始
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📚 更多文档

- **[完整文档目录](./docs/README.md)** - 查看所有项目文档
- **[API文档](./docs/API.md)** - 详细的接口说明
- **[部署指南](./docs/DEPLOYMENT_GUIDE.md)** - 部署和配置说明
- **[贡献指南](./docs/CONTRIBUTING.md)** - 参与项目开发
- **[更新日志](./docs/CHANGELOG.md)** - 版本变更记录

## 🌐 服务器部署信息

### 生产环境配置
- **域名**: car.gaoshanguoji.top
- **API路径**: https://car.gaoshanguoji.top/server/api/
- **nginx配置**: /etc/nginx/sites-available/car.gaoshanguoji.top
- **SSL证书**: Let's Encrypt (自动续期)
- **静态文件**: /var/www/eazycar
- **上传目录**: /var/www/eazycar/uploads (需要配置)

### API访问示例
```bash
# 获取车辆列表
GET https://car.gaoshanguoji.top/server/api/vehicles

# 发布车辆
POST https://car.gaoshanguoji.top/server/api/vehicles/publish

# 访问上传图片
GET https://car.gaoshanguoji.top/uploads/vehicles/[filename]
```

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 项目 Issues
- 邮箱：[your-email@example.com]

---

**注意**：本项目仅用于学习和研究目的，请勿用于商业用途。
