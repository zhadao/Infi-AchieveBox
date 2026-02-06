# Achievement Box Launcher
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

Write-Host "==========================================" -ForegroundColor Green
Write-Host "        🏆 Achievement Box Launcher" -ForegroundColor Green
Write-Host "=========================================="
Write-Host

# Set working directory
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location -Path $ScriptPath

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "[INFO] Node.js detected: $nodeVersion" -ForegroundColor Cyan
} catch {
    Write-Host "[ERROR] Node.js not found!" -ForegroundColor Red
    Write-Host "[ERROR] Please install Node.js first." -ForegroundColor Red
    Write-Host "[ERROR] Download: https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}

# Start server
Write-Host "[INFO] Starting server..." -ForegroundColor Cyan
Write-Host "[INFO] Please wait..." -ForegroundColor Cyan
Write-Host

# Start server in background
Start-Process -FilePath "node.exe" -ArgumentList "server.js" -WindowStyle Hidden -WorkingDirectory $ScriptPath

# Wait for server to start
Start-Sleep -Seconds 3

# Open browser
Write-Host "[INFO] Opening browser..." -ForegroundColor Cyan
Start-Process "http://localhost:8000"

Write-Host
Write-Host "==========================================" -ForegroundColor Green
Write-Host "        ✅ Achievement Box Started!" -ForegroundColor Green
Write-Host "    Access: http://localhost:8000" -ForegroundColor Green
Write-Host "=========================================="
Write-Host
Write-Host "[INFO] Server is running in background" -ForegroundColor Cyan
Write-Host "[INFO] To stop the server: taskkill /f /im node.exe" -ForegroundColor Cyan
Write-Host

Read-Host "Press Enter to close this window..."
