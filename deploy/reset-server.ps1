# 服务器环境重置脚本 - PowerShell版本
# 用途: 通过SSH连接到Linux服务器，清理并重装Node.js和MySQL 8
# 使用方法: .\reset-server.ps1 -ServerIP "103.117.122.192" -Username "root"

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [string]$ScriptPath = "/tmp/reset-server.sh"
)

Write-Host "========================================" -ForegroundColor Green
Write-Host "开始服务器环境重置..." -ForegroundColor Green
Write-Host "服务器: $ServerIP" -ForegroundColor Yellow
Write-Host "用户: $Username" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green

try {
    # 1. 上传重置脚本到服务器
    Write-Host "[1/3] 上传重置脚本到服务器..." -ForegroundColor Cyan
    
    $localScriptPath = "$PSScriptRoot\reset-server.sh"
    if (-not (Test-Path $localScriptPath)) {
        throw "本地脚本文件不存在: $localScriptPath"
    }
    
    # 使用SCP上传脚本
    $scpCommand = "scp `"$localScriptPath`" ${Username}@${ServerIP}:$ScriptPath"
    Write-Host "执行: $scpCommand" -ForegroundColor Gray
    Invoke-Expression $scpCommand
    
    if ($LASTEXITCODE -ne 0) {
        throw "脚本上传失败"
    }
    
    Write-Host "✓ 脚本上传成功" -ForegroundColor Green
    
    # 2. 设置脚本执行权限
    Write-Host "[2/3] 设置脚本执行权限..." -ForegroundColor Cyan
    
    $chmodCommand = "ssh ${Username}@${ServerIP} 'chmod +x $ScriptPath'"
    Write-Host "执行: $chmodCommand" -ForegroundColor Gray
    Invoke-Expression $chmodCommand
    
    if ($LASTEXITCODE -ne 0) {
        throw "权限设置失败"
    }
    
    Write-Host "✓ 权限设置成功" -ForegroundColor Green
    
    # 3. 执行重置脚本
    Write-Host "[3/3] 执行服务器重置脚本..." -ForegroundColor Cyan
    Write-Host "注意: 此过程可能需要几分钟时间，请耐心等待..." -ForegroundColor Yellow
    
    $executeCommand = "ssh ${Username}@${ServerIP} 'sudo $ScriptPath'"
    Write-Host "执行: $executeCommand" -ForegroundColor Gray
    Invoke-Expression $executeCommand
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "脚本执行可能遇到问题，请检查输出信息"
    } else {
        Write-Host "✓ 脚本执行完成" -ForegroundColor Green
    }
    
    # 4. 清理临时文件
    Write-Host "清理服务器临时文件..." -ForegroundColor Cyan
    $cleanupCommand = "ssh ${Username}@${ServerIP} 'rm -f $ScriptPath'"
    Invoke-Expression $cleanupCommand
    
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "服务器重置完成！" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    
    Write-Host "下一步操作:" -ForegroundColor Yellow
    Write-Host "1. 连接到服务器: ssh ${Username}@${ServerIP}" -ForegroundColor White
    Write-Host "2. 配置MySQL: sudo mysql_secure_installation" -ForegroundColor White
    Write-Host "3. 创建数据库和用户" -ForegroundColor White
    Write-Host "4. 重新部署项目" -ForegroundColor White
    
} catch {
    Write-Error "错误: $($_.Exception.Message)"
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "脚本执行失败！" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    exit 1
}

Write-Host "\n按任意键继续..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")