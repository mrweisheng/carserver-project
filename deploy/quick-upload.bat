@echo off
setlocal enabledelayedexpansion

echo ======================================
echo     CarServer Quick Upload Script
echo     For Development Deployment
echo ======================================
echo.

:: Set variables
set SERVER_IP=103.117.122.192
set SERVER_USER=root
set SERVER_PASSWORD=C7XjZ4oDN04d
set LOCAL_PROJECT_PATH=%~dp0..
set REMOTE_PATH=/var/www/carserver

:: Debug: Show variables
echo [DEBUG] Variables:
echo   SERVER_IP=%SERVER_IP%
echo   SERVER_USER=%SERVER_USER%
echo   LOCAL_PROJECT_PATH=%LOCAL_PROJECT_PATH%
echo   REMOTE_PATH=%REMOTE_PATH%
echo.

:: Check if local project path exists
if not exist "%LOCAL_PROJECT_PATH%" (
    echo [ERROR] Local project path does not exist: %LOCAL_PROJECT_PATH%
    pause
    exit /b 1
)

echo [INFO] Preparing to upload files to server...
echo.

:: Display upload information
echo [INFO] Quick upload - excluding node_modules, .git, logs
echo Local path: %LOCAL_PROJECT_PATH%
echo Server: %SERVER_IP%
echo Remote path: %REMOTE_PATH%
echo.

:: Confirm upload
set /p confirm="Upload source code to server? (Y/N): "
if /i not "%confirm%"=="Y" (
    echo [INFO] Upload cancelled
    pause
    exit /b 0
)

echo.

:: Test SSH connection first
echo [INFO] Testing SSH connection...
ssh -o "StrictHostKeyChecking=no" -o "ConnectTimeout=10" %SERVER_USER%@%SERVER_IP% "echo 'SSH connection successful'"
if %errorlevel% neq 0 (
    echo [ERROR] SSH connection failed, please check:
    echo   1. Server IP is correct: %SERVER_IP%
    echo   2. Network connection is working
    echo   3. OpenSSH client is installed
    pause
    exit /b 1
)

:: Clean remote directory first (except node_modules and .env)
echo [INFO] Cleaning remote directory...
ssh -o "StrictHostKeyChecking=no" %SERVER_USER%@%SERVER_IP% "find %REMOTE_PATH% -mindepth 1 -maxdepth 1 ! -name 'node_modules' ! -name '.env' -exec rm -rf {} +"
if %errorlevel% neq 0 (
    echo [ERROR] Failed to clean remote directory
    pause
    exit /b 1
)

:: Upload all files at once (excluding node_modules, .git, logs)
echo [INFO] Uploading source code files...
echo [INFO] Note: You may need to enter password multiple times
echo.

:: Use a single scp command to upload all source files
scp -r -o "StrictHostKeyChecking=no" "%LOCAL_PROJECT_PATH%\*.js" "%LOCAL_PROJECT_PATH%\*.json" "%LOCAL_PROJECT_PATH%\*.md" "%LOCAL_PROJECT_PATH%\*.sql" "%LOCAL_PROJECT_PATH%\*.sh" "%LOCAL_PROJECT_PATH%\config" "%LOCAL_PROJECT_PATH%\controllers" "%LOCAL_PROJECT_PATH%\middleware" "%LOCAL_PROJECT_PATH%\models" "%LOCAL_PROJECT_PATH%\routes" "%LOCAL_PROJECT_PATH%\utils" %SERVER_USER%@%SERVER_IP%:%REMOTE_PATH%/

if %errorlevel% neq 0 (
    echo [ERROR] File upload failed, possible reasons:
    echo   1. SCP command not available (need to install OpenSSH client)
    echo   2. Network connection issues
    echo   3. Server permission issues
    pause
    exit /b 1
)

:: Files already excluded during upload, no additional cleanup needed

echo [SUCCESS] Source code uploaded successfully!
echo.
echo [INFO] Next steps on the server:
echo   1. Install dependencies: npm install
echo   2. Restart the application: pm2 restart carserver
echo.
echo Press any key to exit...
pause >nul