# Quick Start Script for Smart Watering System
# Run this from the project root directory

Write-Host "🌱 Starting Smart Watering System..." -ForegroundColor Green
Write-Host ""

# Check if MongoDB is running
Write-Host "Checking MongoDB..." -ForegroundColor Cyan
$mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
if ($null -eq $mongoProcess) {
    Write-Host "⚠️  MongoDB not running. Please start MongoDB first:" -ForegroundColor Yellow
    Write-Host "   Run: mongod" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "✅ MongoDB is running" -ForegroundColor Green
}

# Start Backend
Write-Host ""
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; Write-Host '🚀 Backend Server' -ForegroundColor Green; npm run dev"
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend Dashboard..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd web; Write-Host '🎨 Frontend Dashboard' -ForegroundColor Blue; npm run dev"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "✅ System Started!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API: http://localhost:5000/api" -ForegroundColor Cyan
Write-Host "Frontend Dashboard: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop" -ForegroundColor Yellow
