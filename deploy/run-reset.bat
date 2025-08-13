@echo off
chcp 65001 >nul
echo ========================================
echo 服务器环境重置工具
echo ========================================
echo.
echo 此脚本将执行以下操作:
echo 1. 完全卸载旧版本 Node.js
echo 2. 完全卸载旧版本 MySQL
echo 3. 安装最新版本 Node.js (20.x LTS)
echo 4. 安装 MySQL 8.0
echo.
echo 目标服务器: 103.117.122.192
echo 用户名: root
echo.
set /p confirm="确认执行? (y/N): "
if /i not "%confirm%"=="y" (
    echo 操作已取消
    pause
    exit /b 0
)

echo.
echo 开始执行重置脚本...
echo.

REM 切换到脚本目录
cd /d "%~dp0"

REM 执行PowerShell脚本
powershell.exe -ExecutionPolicy Bypass -File "reset-server.ps1" -ServerIP "103.117.122.192" -Username "root"

echo.
echo 脚本执行完成！
echo.
echo 下一步操作:
echo 1. 连接到服务器: ssh root@103.117.122.192
echo 2. 配置MySQL安全设置: sudo mysql_secure_installation
echo 3. 创建数据库和用户
echo 4. 重新部署项目
echo.
pause