# 服务器部署指南

## 服务器信息
- 服务器IP: 103.117.122.192
- 项目仓库: https://github.com/mrweisheng/carserver-project
- 进程管理: PM2

## 部署步骤

### 1. 连接服务器
```bash
ssh root@103.117.122.192
# 或使用你的用户名
ssh username@103.117.122.192
```

### 2. 安装必要环境（如果未安装）
```bash
# 更新系统包
sudo apt update

# 安装Node.js (推荐使用NodeSource仓库)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version

# 安装PM2（如果未安装）
npm install -g pm2
```

### 3. 克隆项目代码
```bash
# 进入项目目录（建议在/var/www或/opt下）
cd /var/www

# 克隆项目
git clone https://github.com/mrweisheng/carserver-project.git

# 进入项目目录
cd carserver-project
```

### 4. 安装项目依赖
```bash
npm install
```

### 5. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
# 或使用 vim .env
```

**重要配置项：**
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=car_info_db

# JWT配置
JWT_SECRET=your_strong_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# 服务器配置
PORT=3000
NODE_ENV=production

# 反爬虫配置
CRAWLER_DETECTION_ENABLED=true
CRAWLER_MAX_REQUESTS_PER_MINUTE=50
CRAWLER_STRICT_IP_LIMIT=false
```

### 6. 数据库设置
```bash
# 登录MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE car_info_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户（可选，建议使用专用用户）
CREATE USER 'carserver'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON car_info_db.* TO 'carserver'@'localhost';
FLUSH PRIVILEGES;

# 退出MySQL
exit;

# 导入数据库结构
mysql -u root -p car_info_db < car_info_db.sql
```

### 7. 创建管理员用户
```bash
# 运行创建管理员脚本
node create-admin.js
```

### 8. 测试应用
```bash
# 先测试应用是否正常启动
node app.js

# 如果正常，按Ctrl+C停止
```

### 9. 使用PM2部署

#### 创建PM2配置文件
```bash
nano ecosystem.config.js
```

**ecosystem.config.js内容：**
```javascript
module.exports = {
  apps: [{
    name: 'carserver',
    script: 'app.js',
    cwd: '/var/www/carserver-project',
    instances: 'max', // 或指定数量，如 2
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
};
```

#### 创建日志目录
```bash
mkdir -p logs
```

#### 启动应用
```bash
# 使用PM2启动
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs carserver

# 保存PM2配置（开机自启）
pm2 save
pm2 startup
# 按照提示执行生成的命令
```

### 10. 配置Nginx反向代理（推荐）

#### 安装Nginx
```bash
sudo apt install nginx
```

#### 配置Nginx
```bash
sudo nano /etc/nginx/sites-available/carserver
```

**Nginx配置内容：**
```nginx
server {
    listen 80;
    server_name 103.117.122.192; # 或你的域名

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 启用站点
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/carserver /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx

# 设置开机自启
sudo systemctl enable nginx
```

### 11. 防火墙配置
```bash
# 允许HTTP和HTTPS
sudo ufw allow 80
sudo ufw allow 443

# 如果直接访问Node.js端口
sudo ufw allow 3000

# 启用防火墙
sudo ufw enable
```

### 12. SSL证书配置（可选但推荐）

#### 使用Let's Encrypt
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书（替换为你的域名）
sudo certbot --nginx -d yourdomain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 常用PM2命令

```bash
# 查看所有应用状态
pm2 status

# 重启应用
pm2 restart carserver

# 停止应用
pm2 stop carserver

# 删除应用
pm2 delete carserver

# 查看日志
pm2 logs carserver

# 实时监控
pm2 monit

# 重载应用（零停机）
pm2 reload carserver

# 查看详细信息
pm2 describe carserver
```

## 更新部署

```bash
# 进入项目目录
cd /var/www/carserver-project

# 拉取最新代码
git pull origin main

# 安装新依赖（如果有）
npm install

# 重启应用
pm2 restart carserver
```

## 监控和维护

### 查看系统资源
```bash
# 查看内存使用
free -h

# 查看磁盘使用
df -h

# 查看CPU使用
top

# 查看端口占用
netstat -tlnp | grep :3000
```

### 日志管理
```bash
# 查看应用日志
pm2 logs carserver --lines 100

# 清空日志
pm2 flush carserver

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 故障排除

### 常见问题

1. **端口被占用**
```bash
# 查找占用端口的进程
sudo lsof -i :3000
# 杀死进程
sudo kill -9 PID
```

2. **数据库连接失败**
- 检查MySQL服务状态：`sudo systemctl status mysql`
- 检查数据库配置：确认.env文件中的数据库信息
- 检查防火墙：确保MySQL端口3306可访问

3. **PM2应用无法启动**
```bash
# 查看详细错误信息
pm2 logs carserver --err

# 检查配置文件
node -c app.js
```

4. **内存不足**
```bash
# 增加swap空间
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 安全建议

1. **定期更新系统**
```bash
sudo apt update && sudo apt upgrade
```

2. **配置SSH密钥认证**
3. **禁用root登录**
4. **配置fail2ban防止暴力破解**
5. **定期备份数据库**

```bash
# 数据库备份脚本
mysqldump -u root -p car_info_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 访问应用

部署完成后，你可以通过以下方式访问应用：

- **直接访问**: http://103.117.122.192:3000
- **通过Nginx**: http://103.117.122.192
- **HTTPS（如果配置了SSL）**: https://yourdomain.com

## API测试

```bash
# 测试服务器是否正常
curl http://103.117.122.192:3000/api/vehicles

# 获取验证码
curl http://103.117.122.192:3000/api/captcha
```

---

**注意事项：**
- 确保服务器有足够的内存和磁盘空间
- 定期监控应用性能和日志
- 及时更新依赖包和系统补丁
- 做好数据备份工作