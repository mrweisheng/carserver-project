#!/bin/bash

# 服务器环境重置脚本 - 清理并重装Node.js和MySQL 8
# 作者: AI Assistant
# 用途: 完全清理并重新安装Node.js和MySQL环境

set -e  # 遇到错误立即退出

echo "========================================"
echo "开始服务器环境重置..."
echo "========================================"

# 1. 停止所有相关服务
echo "[1/6] 停止所有相关服务..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sudo systemctl stop mysql 2>/dev/null || true
sudo systemctl stop mysqld 2>/dev/null || true
sudo pkill -f node 2>/dev/null || true

echo "✓ 服务停止完成"

# 2. 完全卸载Node.js
echo "[2/6] 卸载旧版本Node.js..."
sudo apt-get remove --purge nodejs npm -y 2>/dev/null || true
sudo apt-get autoremove -y

# 删除Node.js相关目录
sudo rm -rf /usr/local/bin/npm 2>/dev/null || true
sudo rm -rf /usr/local/share/man/man1/node* 2>/dev/null || true
sudo rm -rf /usr/local/lib/dtrace/node.d 2>/dev/null || true
sudo rm -rf ~/.npm 2>/dev/null || true
sudo rm -rf ~/.node-gyp 2>/dev/null || true
sudo rm -rf /opt/local/bin/node 2>/dev/null || true
sudo rm -rf /opt/local/include/node 2>/dev/null || true
sudo rm -rf /opt/local/lib/node_modules 2>/dev/null || true
sudo rm -rf /usr/local/lib/node* 2>/dev/null || true
sudo rm -rf /usr/local/include/node* 2>/dev/null || true
sudo rm -rf /usr/local/bin/node* 2>/dev/null || true
sudo rm -rf /usr/lib/node_modules 2>/dev/null || true
sudo rm -rf /var/lib/npm 2>/dev/null || true

echo "✓ Node.js卸载完成"

# 3. 完全卸载MySQL
echo "[3/6] 卸载旧版本MySQL..."
sudo apt-get remove --purge mysql-server mysql-client mysql-common mysql-server-core-* mysql-client-core-* -y 2>/dev/null || true
sudo apt-get purge mysql-server mysql-client mysql-common mysql-server-core-* mysql-client-core-* -y 2>/dev/null || true
sudo apt-get autoremove -y
sudo apt-get autoclean

# 删除MySQL数据和配置
sudo rm -rf /var/lib/mysql 2>/dev/null || true
sudo rm -rf /var/log/mysql 2>/dev/null || true
sudo rm -rf /etc/mysql 2>/dev/null || true
sudo rm -rf /usr/lib/mysql 2>/dev/null || true
sudo rm -rf /usr/share/mysql 2>/dev/null || true

# 删除MySQL用户和组
sudo deluser mysql 2>/dev/null || true
sudo delgroup mysql 2>/dev/null || true

echo "✓ MySQL卸载完成"

# 4. 更新系统包
echo "[4/6] 更新系统包..."
sudo apt-get clean
sudo apt-get update
sudo apt-get upgrade -y

echo "✓ 系统更新完成"

# 5. 安装最新版本Node.js (20.x LTS)
echo "[5/6] 安装Node.js 20.x LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 配置npm全局包目录
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'

# 添加到PATH
if ! grep -q "~/.npm-global/bin" ~/.bashrc; then
    echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
fi
source ~/.bashrc

# 安装PM2
npm install -g pm2

echo "✓ Node.js安装完成"
echo "  Node.js版本: $(node --version)"
echo "  NPM版本: $(npm --version)"
echo "  PM2版本: $(pm2 --version)"

# 6. 安装MySQL 8.0
echo "[6/6] 安装MySQL 8.0..."

# 下载MySQL APT配置包
wget https://dev.mysql.com/get/mysql-apt-config_0.8.25-1_all.deb -O /tmp/mysql-apt-config.deb

# 预配置MySQL APT仓库（选择MySQL 8.0）
echo "mysql-apt-config mysql-apt-config/select-server select mysql-8.0" | sudo debconf-set-selections
echo "mysql-apt-config mysql-apt-config/select-product select Ok" | sudo debconf-set-selections

# 安装MySQL APT配置
sudo DEBIAN_FRONTEND=noninteractive dpkg -i /tmp/mysql-apt-config.deb

# 更新包列表
sudo apt-get update

# 安装MySQL 8.0服务器（不设置root密码，稍后手动配置）
echo "mysql-server mysql-server/root_password password" | sudo debconf-set-selections
echo "mysql-server mysql-server/root_password_again password" | sudo debconf-set-selections
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server mysql-client

# 启动MySQL服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 清理临时文件
rm -f /tmp/mysql-apt-config.deb

echo "✓ MySQL 8.0安装完成"
echo "  MySQL版本: $(mysql --version)"

echo "========================================"
echo "环境重置完成！"
echo "========================================"
echo "下一步操作:"
echo "1. 运行 'sudo mysql_secure_installation' 配置MySQL安全设置"
echo "2. 创建数据库和用户"
echo "3. 重新部署项目"
echo "========================================"

# 显示安装信息
echo "安装信息:"
echo "- Node.js: $(node --version)"
echo "- NPM: $(npm --version)"
echo "- PM2: $(pm2 --version)"
echo "- MySQL: $(mysql --version)"
echo "- 系统: $(lsb_release -d | cut -f2)"

echo "脚本执行完成！"