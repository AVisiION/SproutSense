# Production Start Script for Smart Watering System
# Run this from the project root directory in production environment

Write-Host "Starting Smart Watering System (Production Mode)..." -ForegroundColor Green
Write-Host ""

# Check if .env file exists
if (-not (Test-Path "backend\.env")) {
    Write-Host "ERROR: backend\.env file not found!" -ForegroundColor Red
    Write-Host "   Please create it from .env.production.example" -ForegroundColor Yellow
    Write-Host "   Run: cp backend\.env.production.example backend\.env" -ForegroundColor Yellow
    Write-Host "   Then edit backend\.env with your production settings" -ForegroundColor Yellow
    exit 1
}

# Set production environment
$env:NODE_ENV = "production"

Write-Host "Running in PRODUCTION mode" -ForegroundColor Yellow
Write-Host "   - Test mode: DISABLED" -ForegroundColor Yellow
Write-Host "   - Security: ENHANCED" -ForegroundColor Yellow
Write-Host "   - Logging: COMBINED format" -ForegroundColor Yellow
Write-Host ""

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; `$env:NODE_ENV='production'; Write-Host 'Backend Server (PRODUCTION)' -ForegroundColor Green; npm start"
Start-Sleep -Seconds 3

# Note about frontend
Write-Host ""
Write-Host "Backend Started!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API: http://localhost:5000/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: In production, the frontend should be:" -ForegroundColor Yellow
Write-Host "   - Built with: npm run build" -ForegroundColor Yellow
Write-Host "   - Served from: web/dist folder" -ForegroundColor Yellow
Write-Host "   - Deployed to: Static hosting (Netlify, Vercel, etc.)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C in the backend window to stop" -ForegroundColor Yellow
