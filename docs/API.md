# 汽车信息服务器 API 文档

## 📋 基础信息
- **基础URL**: http://localhost:3000
- **认证方式**: JWT Bearer Token
- **响应格式**: JSON
- **字符编码**: UTF-8

## 🔐 用户认证 API

### 1. 获取验证码
- **接口**: `GET /api/captcha`
- **描述**: 获取图形验证码（用于注册和敏感操作）
- **请求参数**: 无
- **响应示例**:
```json
{
  "code": 200,
  "message": "验证码生成成功",
  "data": {
    "captchaId": "abc123",
    "image": "data:image/svg+xml;base64,..."
  }
}
```
- **说明**: 验证码为4位数字，有效期5分钟，最多尝试3次

### 2. 用户注册
- **接口**: `POST /api/auth/register`
- **描述**: 用户注册
- **请求参数**:
  - `username`: 字符串，必填，3-50个字符，只能包含字母、数字、下划线和中文
  - `password`: 字符串，必填，至少6个字符
  - `real_name`: 字符串，必填，1-50个字符，联络人姓名
  - `email`: 字符串，可选，邮箱格式，客户信息
  - `gender`: 字符串，必填，male/female/other
  - `phone`: 字符串，必填，手机号格式（支持中国大陆11位手机号和香港8位手机号）
  - `captcha`: 字符串，必填，4位数字验证码
  - `captchaId`: 字符串，必填，验证码ID
- **响应**: 用户信息和JWT令牌
- **错误码**: 400(参数错误/用户名已存在/邮箱已存在/验证码错误), 500(服务器错误)

### 3. 用户登录
- **接口**: `POST /api/auth/login`
- **描述**: 用户登录
- **请求参数**:
  - `username`: 字符串，必填，用户名
  - `password`: 字符串，必填，密码
  - `captcha`: 字符串，可选，4位数字验证码（当系统检测到可疑行为时）
  - `captchaId`: 字符串，可选，验证码ID
- **响应**: 用户信息和JWT令牌
- **错误码**: 400(参数错误), 401(用户名或密码错误), 403(账户被禁用), 500(服务器错误)

### 4. 获取当前用户信息
- **接口**: `GET /api/auth/me`
- **描述**: 获取当前登录用户信息
- **请求头**: `Authorization: Bearer <token>`
- **响应**: 用户信息
- **错误码**: 401(未授权), 404(用户不存在), 500(服务器错误)

### 5. 用户登出
- **接口**: `POST /api/auth/logout`
- **描述**: 用户登出
- **请求头**: `Authorization: Bearer <token>`
- **响应**: 成功消息
- **错误码**: 401(未授权), 500(服务器错误)

## 🚗 车辆信息 API

### 1. 获取车辆列表
- **接口**: `GET /api/vehicles`
- **描述**: 获取车辆列表，支持分页和基础筛选
- **请求参数**:
  - `page`: 页码，默认1
  - `limit`: 每页数量，默认20
  - `vehicle_type`: 车辆类型（1=私家车, 2=客货车, 3=货车, 4=电单车, 5=经典车）
  - `vehicle_status`: 车辆状态（1=未售, 2=已售）
  - `car_brand`: 品牌查询，支持两种模式：
    - 模糊匹配：`丰田` (匹配包含"丰田"的品牌)
    - 精确匹配：`exact:丰田` (精确匹配"丰田"品牌)
  - `car_model`: 车型查询，支持两种模式：
    - 模糊匹配：`卡罗拉` (匹配包含"卡罗拉"的车型)
    - 精确匹配：`exact:卡罗拉` (精确匹配"卡罗拉"车型)
  - `year`: 年份查询，支持多种模式：
    - 精确匹配：`2016` (匹配包含2016的年份)
    - 范围查询：`2016-2018` (查询2016到2018年之间的车辆)
    - 比较查询：`>2016`, `>=2016`, `<2018`, `<=2018` (查询大于/小于指定年份的车辆)
  - `min_price`: 最低价格（数字，基于current_price字段）
  - `max_price`: 最高价格（数字，基于current_price字段）
  - `seats`: 座位数量查询，支持多种模式：
    - 精确匹配：`5`, `7` (前端传入纯数字)
    - 范围查询：`5-7` (5座到7座)
    - 比较查询：`>5`, `<7`, `>=5`, `<=7`
  - `sort_by`: 排序字段（created_at, updated_at, current_price, year）
  - `sort_order`: 排序方向（ASC, DESC）
- **请求头**: `Authorization: Bearer <token>` (可选，用于获取完整手机号)
- **响应数据**:
  ```json
  {
    "code": 200,
    "message": "查询成功",
    "data": {
      "vehicles": [
        {
          "id": 1,
          "vehicle_type": 1,
          "vehicle_status": 1,
          "car_brand": "丰田",
          "car_model": "卡罗拉",
          "year": 2016,
          "current_price": 80000,
          "original_price": 120000,
          "mileage": 50000,
          "fuel_type": "汽油",
          "transmission": "自动",
          "color": "白色",
          "contact_name": "张先生",
          "contact_phone": "13******00", // 未登录用户显示脱敏
          "contact_phone": "13800138000", // 已登录用户显示完整
          "description": "车况良好，无事故",
          "created_at": "2024-01-01T00:00:00.000Z",
          "updated_at": "2024-01-01T00:00:00.000Z"
        }
      ],
      "pagination": {
        "current_page": 1,
        "total_pages": 10,
        "total_items": 200,
        "items_per_page": 20
      }
    }
  }
  ```

### 2. 获取车辆详情
- **接口**: `GET /api/vehicles/:id`
- **描述**: 获取指定车辆的详细信息
- **路径参数**:
  - `id`: 车辆ID（数字）
- **请求头**: `Authorization: Bearer <token>` (可选，用于获取完整手机号)
- **响应数据**:
  ```json
  {
    "code": 200,
    "message": "查询成功",
    "data": {
      "vehicle": {
        "id": 1,
        "vehicle_type": 1,
        "vehicle_status": 1,
        "car_brand": "丰田",
        "car_model": "卡罗拉",
        "year": 2016,
        "current_price": 80000,
        "original_price": 120000,
        "mileage": 50000,
        "fuel_type": "汽油",
        "transmission": "自动",
        "color": "白色",
        "contact_name": "张先生",
        "contact_phone": "13800138000",
        "description": "车况良好，无事故",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
        "images": [
          {
            "id": 1,
            "image_url": "https://example.com/image1.jpg",
            "description": "前脸照片",
            "created_at": "2024-01-01T00:00:00.000Z"
          }
        ]
      }
    }
  }
  ```

### 3. 获取车辆统计信息
- **接口**: `GET /api/vehicles/stats`
- **描述**: 获取车辆统计信息
- **请求参数**: 无
- **响应数据**:
  ```json
  {
    "code": 200,
    "message": "查询成功",
    "data": {
      "total_vehicles": 1000,
      "available_vehicles": 800,
      "sold_vehicles": 200,
      "type_distribution": {
        "私家车": 600,
        "客货车": 200,
        "货车": 150,
        "电单车": 30,
        "经典车": 20
      },
      "brand_distribution": {
        "丰田": 150,
        "本田": 120,
        "日产": 100,
        "其他": 630
      },
      "price_range": {
        "min": 10000,
        "max": 500000,
        "average": 150000
      }
    }
  }
  ```

### 4. 获取汽车品牌列表
- **接口**: `GET /api/vehicles/brands`
- **描述**: 获取所有汽车品牌列表，按车辆数量降序排列
- **请求参数**: 无
- **响应数据**:
  ```json
  {
    "code": 200,
    "message": "获取品牌列表成功",
    "data": {
      "total_brands": 25,
      "brands": [
        {
          "brand": "丰田",
          "count": 150,
          "label": "丰田 (150辆)"
        },
        {
          "brand": "本田",
          "count": 120,
          "label": "本田 (120辆)"
        },
        {
          "brand": "日产",
          "count": 100,
          "label": "日产 (100辆)"
        }
      ]
    }
  }
  ```

## 🔒 隐私保护特性

### 手机号脱敏机制
- **未登录用户**: 手机号显示为 `13******00` 格式
- **已登录用户**: 显示完整手机号 `13800138000`
- **处理逻辑**: 基于JWT令牌验证登录状态，毫秒级处理

### 权限控制
- **公开接口**: 车辆列表、车辆详情、统计信息（脱敏版本）
- **认证接口**: 用户注册、登录、登出、个人信息
- **访问控制**: 通过中间件验证JWT令牌

## 🚫 反爬虫防护

### 防护策略
- **频率限制**: 每分钟最大请求次数限制
- **爬虫检测**: User-Agent分析和请求模式识别
- **验证码系统**: 图形验证码防止自动化攻击
- **动态响应**: 随机延迟和响应随机化

### 配置参数
- `CRAWLER_DETECTION_ENABLED`: 是否启用爬虫检测
- `CRAWLER_MAX_REQUESTS_PER_MINUTE`: 每分钟最大请求数
- `CRAWLER_STRICT_IP_LIMIT`: 是否启用严格IP限制

## 📝 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权访问 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

## 🧪 测试示例

### 1. 获取验证码
```bash
curl -X GET http://localhost:3000/api/captcha
```

### 2. 用户注册
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "123456",
    "real_name": "测试用户",
    "email": "test@example.com",
    "gender": "male",
    "phone": "13800138000",
    "captcha": "1234",
    "captchaId": "captcha_id"
  }'
```

### 3. 用户登录
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "123456"
  }'
```

### 4. 获取车辆列表（未登录）
```bash
curl -X GET "http://localhost:3000/api/vehicles?page=1&limit=5"
```

### 5. 获取车辆列表（已登录）
```bash
curl -X GET "http://localhost:3000/api/vehicles?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. 座位搜索示例
```bash
# 搜索5座车辆
curl -X GET "http://localhost:3000/api/vehicles?seats=5&limit=5"

# 搜索7座车辆
curl -X GET "http://localhost:3000/api/vehicles?seats=7&limit=5"

# 搜索5-7座车辆范围
curl -X GET "http://localhost:3000/api/vehicles?seats=5-7&limit=5"

# 搜索大于5座的车辆
curl -X GET "http://localhost:3000/api/vehicles?seats=>5&limit=5"

# 搜索7座丰田车辆
curl -X GET "http://localhost:3000/api/vehicles?seats=7&car_brand=豐田&limit=5"

# 搜索5座且价格小于50000的车辆
curl -X GET "http://localhost:3000/api/vehicles?seats=5&max_price=50000&limit=5"
```

## 📞 技术支持

如有API使用问题，请联系开发团队或查看项目文档。
