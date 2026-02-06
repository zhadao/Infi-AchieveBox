# Achievement Box - Build Release Script
Write-Host "==========================================" -ForegroundColor Green
Write-Host "     🏆 Achievement Box - Build Release" -ForegroundColor Green
Write-Host "=========================================="
Write-Host

Write-Host "[INFO] Building executable..." -ForegroundColor Cyan

npm run build:win
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Build failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit 1
}

Write-Host
Write-Host "[INFO] Creating release package..." -ForegroundColor Cyan
Write-Host

$releaseDir = "release"
if (-not (Test-Path $releaseDir)) {
    New-Item -ItemType Directory -Path $releaseDir | Out-Null
}

Write-Host "[INFO] Copying files to release folder..." -ForegroundColor Cyan

Copy-Item "dist\AchievementBox.exe" -Destination $releaseDir -Force
if (Test-Path "asset") {
    Copy-Item "asset" -Destination "$releaseDir\" -Recurse -Force
}
Copy-Item "index.html" -Destination $releaseDir -Force
Copy-Item "style.css" -Destination $releaseDir -Force
Copy-Item "script.js" -Destination $releaseDir -Force
Copy-Item "256x256.ico" -Destination $releaseDir -Force
Copy-Item "achieveBOX.png" -Destination $releaseDir -Force

Write-Host
Write-Host "==========================================" -ForegroundColor Green
Write-Host "     ✅ Build Complete!" -ForegroundColor Green
Write-Host "=========================================="
Write-Host
Write-Host "[INFO] Release package created in: release\" -ForegroundColor Cyan
Write-Host "[INFO] AchievementBox.exe is ready to distribute!" -ForegroundColor Cyan
Write-Host

Read-Host "Press Enter to exit..."
