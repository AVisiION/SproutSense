# Quick Start Script for Smart Watering System (Development Mode)
# Run this from the project root directory

Write-Host "Starting Smart Watering System (Development Mode)..." -ForegroundColor Green
Write-Host ""

# Check database mode (.env Atlas URI vs local mongod)
Write-Host "Checking database mode..." -ForegroundColor Cyan
$backendEnvPath = Join-Path $PSScriptRoot "apps\api\.env"
$usesAtlas = $false

if (Test-Path $backendEnvPath) {
    $mongoLine = Get-Content $backendEnvPath | Where-Object { $_ -match '^\s*MONGODB_URI\s*=' } | Select-Object -First 1
    if ($mongoLine -match 'mongodb\+srv://') {
        $usesAtlas = $true
    }
}

if ($usesAtlas) {
    Write-Host "MongoDB Atlas URI detected. Local mongod is not required." -ForegroundColor Green
} else {
    $mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
    if ($null -eq $mongoProcess) {
        Write-Host "WARNING: Local MongoDB process (mongod) is not running." -ForegroundColor Yellow
        Write-Host "If you are using Atlas, this warning can be ignored." -ForegroundColor Yellow
        Write-Host "To use local MongoDB, run: mongod" -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host "Local MongoDB is running" -ForegroundColor Green
    }
}

# Start Backend
Write-Host ""
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/api; Write-Host 'Backend Server (DEV - Legacy Watch)' -ForegroundColor Green; npm run dev -- -L"
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend Dashboard..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/web; Write-Host 'Frontend Dashboard (DEV - Polling Watch)' -ForegroundColor Blue; `$env:CHOKIDAR_USEPOLLING='true'; `$env:CHOKIDAR_INTERVAL='300'; npm run dev"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Development System Started!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API: http://localhost:5000/api" -ForegroundColor Cyan
Write-Host "Frontend Dashboard: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Mode: ENABLED (auto-generates sensor data)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop" -ForegroundColor Yellow
