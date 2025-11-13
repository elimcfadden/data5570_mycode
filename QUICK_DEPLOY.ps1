# Quick Deployment Script - Full Stack App
# This script will start both backend and frontend and create public URLs

Write-Host "=== Full Stack App Quick Deployment ===" -ForegroundColor Green
Write-Host ""

# Check Python
Write-Host "Checking Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found." -ForegroundColor Red
    Write-Host "  Installing Node.js is required for Expo." -ForegroundColor Yellow
    Write-Host "  Download from: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "  Or use: winget install OpenJS.NodeJS" -ForegroundColor Yellow
    exit 1
}

# Start Backend (Django)
Write-Host ""
Write-Host "=== Starting Django Backend ===" -ForegroundColor Cyan
Set-Location "$PSScriptRoot"
git checkout master 2>&1 | Out-Null

# Install dependencies if needed
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
python -m pip install -q django djangorestframework django-cors-headers 2>&1 | Out-Null

# Run migrations
Write-Host "Running database migrations..." -ForegroundColor Yellow
python manage.py migrate --noinput 2>&1 | Out-Null

# Start Django in background
Write-Host "Starting Django server on port 8000..." -ForegroundColor Yellow
$djangoJob = Start-Job -ScriptBlock {
    Set-Location $using:PSScriptRoot
    python manage.py runserver 0.0.0.0:8000
}

Start-Sleep -Seconds 3
Write-Host "✓ Django backend running" -ForegroundColor Green

# Start Frontend (Expo)
Write-Host ""
Write-Host "=== Starting Expo Frontend ===" -ForegroundColor Cyan
git checkout expo-app 2>&1 | Out-Null

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    npm install 2>&1 | Out-Null
}

# Update API config for localhost
$apiConfig = @"
// API Configuration
import Constants from 'expo-constants';

const isDev = __DEV__ || Constants.expoConfig?.extra?.dev === true;

// Using localhost for local deployment
const API_BASE_URL = 'http://localhost:8000/api';

export default API_BASE_URL;
"@
Set-Content -Path "config/api.js" -Value $apiConfig

# Start Expo web
Write-Host "Starting Expo web server on port 8081..." -ForegroundColor Yellow
$expoJob = Start-Job -ScriptBlock {
    Set-Location $using:PSScriptRoot
    npx expo start --web --port 8081
}

Start-Sleep -Seconds 5
Write-Host "✓ Expo frontend running" -ForegroundColor Green

# Create public tunnels
Write-Host ""
Write-Host "=== Creating Public URLs ===" -ForegroundColor Cyan

# Try to use localtunnel (no installation needed via npx)
Write-Host "Setting up public tunnel for backend (port 8000)..." -ForegroundColor Yellow
$backendTunnel = Start-Job -ScriptBlock {
    npx -y localtunnel --port 8000
}

Start-Sleep -Seconds 3

Write-Host "Setting up public tunnel for frontend (port 8081)..." -ForegroundColor Yellow
$frontendTunnel = Start-Job -ScriptBlock {
    npx -y localtunnel --port 8081
}

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "=== DEPLOYMENT COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Your app is running!" -ForegroundColor Green
Write-Host ""
Write-Host "Local URLs:" -ForegroundColor Yellow
Write-Host "  Backend API: http://localhost:8000/api/customers/" -ForegroundColor White
Write-Host "  Frontend: http://localhost:8081" -ForegroundColor White
Write-Host ""
Write-Host "Public URLs (check tunnel output above):" -ForegroundColor Yellow
Write-Host "  The tunnels will show public URLs like:" -ForegroundColor White
Write-Host "  Backend: https://xxxx.loca.lt" -ForegroundColor White
Write-Host "  Frontend: https://yyyy.loca.lt" -ForegroundColor White
Write-Host ""
Write-Host "To stop servers, press Ctrl+C or close this window" -ForegroundColor Yellow
Write-Host ""

# Keep script running
try {
    Wait-Job $djangoJob, $expoJob, $backendTunnel, $frontendTunnel | Out-Null
} catch {
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    Stop-Job $djangoJob, $expoJob, $backendTunnel, $frontendTunnel -ErrorAction SilentlyContinue
    Remove-Job $djangoJob, $expoJob, $backendTunnel, $frontendTunnel -ErrorAction SilentlyContinue
}

