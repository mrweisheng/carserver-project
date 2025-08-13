# CarServer 部署工具

## 快速上传脚本

用于日常开发部署的精简上传工具，只上传源代码，不包含依赖文件。

### 🚀 使用方法

```cmd
cd "d:\CODE PROJECT\carserver\deploy"
quick-upload.bat
```

### 上传内容

**包含的文件和目录：**
- `*.js` - 所有JavaScript文件
- `*.json` - 配置文件（package.json等）
- `*.sql` - 数据库文件
- `*.md` - 文档文件
- `.gitignore` - Git忽略文件
- `config/` - 配置目录
- `controllers/` - 控制器目录
- `middleware/` - 中间件目录
- `models/` - 模型目录
- `routes/` - 路由目录
- `utils/` - 工具目录

**排除的文件和目录：**
- `node_modules/` - 依赖包（服务器上重新安装）
- `.git/` - Git版本控制
- `logs/` - 日志文件
- `.env` - 环境变量文件（服务器已配置）

### 服务器操作

上传完成后，在服务器上执行：

```bash
# 方法1：分步执行
ssh root@103.117.122.192
cd /var/www/carserver
npm install
pm2 restart carserver

# 方法2：一键执行
ssh root@103.117.122.192 "cd /var/www/carserver && npm install && pm2 restart carserver"
```

### 服务器信息

- **服务器IP**: 103.117.122.192
- **用户名**: root
- **项目路径**: /var/www/carserver
- **应用端口**: 3000

### 注意事项

1. 确保本地已安装OpenSSH客户端
2. 首次使用可能需要输入服务器密码
3. 上传前会提示确认操作
4. 上传完成后需要在服务器上重新安装依赖并重启应用

### 故障排除

### SCP工具未找到
**问题**: 运行 `quick-upload.bat` 时提示 "scp不是内部或外部命令"

**解决方案**:
1. **安装OpenSSH客户端**（推荐）
   - 打开 设置 > 应用 > 可选功能
   - 点击 添加功能
   - 搜索并安装 "OpenSSH 客户端"
   - 重启命令提示符后重新运行脚本

2. **使用图形化工具**
   - 下载 WinSCP 或 FileZilla
   - 手动上传项目文件到服务器

**如果上传失败：**
- 检查网络连接
- 确认服务器IP和密码正确
- 检查服务器磁盘空间

**如果应用启动失败：**
- 检查PM2状态: `pm2 status`
- 查看应用日志: `pm2 logs carserver`
- 检查依赖安装: `npm list`