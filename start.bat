@echo off
chcp 437 >nul
title Achievement Box - Starting...

:: Set working directory
cd /d "%~dp0"

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found, please install Node.js first
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

echo ==========================================
echo        🏆 Achievement Box - Starting...
echo ==========================================
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] First time startup, installing dependencies...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
    echo [INFO] Dependencies installed successfully!
    echo.
)

echo [INFO] Starting server...
echo [INFO] Please wait...
echo.

:: Start server
start "Achievement Box Server" /min cmd /c "node server.js"

:: Wait for server to start
timeout /t 3 /nobreak >nul

:: Open browser
echo [INFO] Opening browser...
start http://localhost:8000

echo.
echo ==========================================
echo        ✅ Achievement Box Started!
echo    Access: http://localhost:8000
echo ==========================================
echo.
echo [INFO] Close this window to stop the server

echo.
echo [INFO] Server is running in background...
echo [INFO] You can now close this window safely

echo.
echo Press any key to close this window...

:: Keep window open
pause

:: Stop Node.js server
taskkill /f /im node.exe >nul 2>&1
