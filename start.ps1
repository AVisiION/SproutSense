# Quick Start Script for Smart Watering System (Development Mode)
# Run this from the project root directory

Write-Host "Starting Smart Watering System (Development Mode)..." -ForegroundColor Green
Write-Host ""

function Wait-ForTcpPort {
    param(
        [Parameter(Mandatory = $true)][int]$Port,
        [int]$TimeoutSeconds = 30,
        [string]$Label = "Service"
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $listening = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
            Where-Object { $_.LocalPort -eq $Port } |
            Select-Object -First 1

        if ($null -ne $listening) {
            Write-Host "$Label is listening on port $Port" -ForegroundColor Green
            return $true
        }

        Start-Sleep -Milliseconds 500
    }

    Write-Host "$Label did not become ready on port $Port within $TimeoutSeconds seconds" -ForegroundColor Yellow
    return $false
}

function Test-PortInUse {
    param(
        [Parameter(Mandatory = $true)][int]$Port
    )

    $listener = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $_.LocalPort -eq $Port } |
        Select-Object -First 1

    return ($null -ne $listener)
}

function Get-FreePort {
    param(
        [Parameter(Mandatory = $true)][int[]]$Candidates
    )

    foreach ($candidate in $Candidates) {
        if (-not (Test-PortInUse -Port $candidate)) {
            return $candidate
        }
    }

    return $null
}

function Test-ViteServer {
    param(
        [Parameter(Mandatory = $true)][int]$Port
    )

    try {
        $res = Invoke-WebRequest -Uri "http://localhost:$Port/@vite/client" -UseBasicParsing -TimeoutSec 5
        return ($res.StatusCode -eq 200 -and $res.Content -match '@vite/client')
    }
    catch {
        return $false
    }
}

function Test-HttpUrl {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [string]$Label = "Service"
    )

    try {
        $res = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
        Write-Host "$Label reachable: $Url (HTTP $($res.StatusCode))" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "$Label not reachable yet: $Url" -ForegroundColor Yellow
        return $false
    }
}

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
Wait-ForTcpPort -Port 5000 -TimeoutSeconds 40 -Label "Backend API" | Out-Null
Test-HttpUrl -Url "http://localhost:5000" -Label "Backend API" | Out-Null

# Start Frontend
$preferredFrontendPort = 3000
$frontendPort = Get-FreePort -Candidates @($preferredFrontendPort, 5173, 5174, 5175)

if ($null -eq $frontendPort) {
    Write-Host "No free frontend port found in the candidate list (3000, 5173-5175)." -ForegroundColor Red
    Write-Host "Please stop the occupying process and run start.ps1 again." -ForegroundColor Yellow
    exit 1
}

if ($frontendPort -ne $preferredFrontendPort) {
    Write-Host "Port 3000 is already in use. Starting frontend on port $frontendPort instead." -ForegroundColor Yellow
}

Write-Host "Starting Frontend Dashboard..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd apps/web; Write-Host 'Frontend Dashboard (DEV - Polling Watch)' -ForegroundColor Blue; `$env:CHOKIDAR_USEPOLLING='true'; `$env:CHOKIDAR_INTERVAL='300'; npm run dev -- --port $frontendPort"
Wait-ForTcpPort -Port $frontendPort -TimeoutSeconds 40 -Label "Frontend Dashboard" | Out-Null
Test-HttpUrl -Url "http://localhost:$frontendPort" -Label "Frontend Dashboard" | Out-Null

if (-not (Test-ViteServer -Port $frontendPort)) {
    Write-Host "Warning: frontend port $frontendPort is reachable but does not look like a Vite dev server." -ForegroundColor Yellow
    Write-Host "Open the terminal window started by start.ps1 and check for npm/vite errors." -ForegroundColor Yellow
}

Write-Host "Opening dashboard in browser..." -ForegroundColor Cyan
Start-Process "http://localhost:$frontendPort"

Write-Host ""
Write-Host "Development System Started!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API: http://localhost:5000/api" -ForegroundColor Cyan
Write-Host "Frontend Dashboard: http://localhost:$frontendPort" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Mode: ENABLED (auto-generates sensor data)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop" -ForegroundColor Yellow

