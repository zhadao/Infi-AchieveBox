@echo off
chcp 437 >nul
title Achievement Box - Build Release

echo ==========================================
echo     🏆 Achievement Box - Build Release
echo ==========================================
echo.

echo [INFO] Building executable...
call npm run build:win
if errorlevel 1 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo [INFO] Creating release package...
echo.

if not exist "release" mkdir release

echo [INFO] Copying files to release folder...

copy "dist\AchievementBox.exe" "release\" >nul
xcopy "asset" "release\asset\" /E /I /Y >nul
copy "index.html" "release\" >nul
copy "style.css" "release\" >nul
copy "script.js" "release\" >nul
copy "256x256.ico" "release\" >nul
copy "achieveBOX.png" "release\" >nul

echo.
echo ==========================================
echo     ✅ Build Complete!
echo ==========================================
echo.
echo [INFO] Release package created in: release\
echo [INFO] AchievementBox.exe is ready to distribute!
echo.

pause
