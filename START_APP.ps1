# Start Full Stack App - Creates Public URLs
Write-Host "=== Starting Full Stack App ===" -ForegroundColor Green
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Start Django Backend
Write-Host "Starting Django backend..." -ForegroundColor Cyan
Set-Location "$scriptPath"
git checkout master 2>&1 | Out-Null
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath'; python manage.py runserver 0.0.0.0:8000" -WindowStyle Minimized
Start-Sleep -Seconds 3

# Start Expo Frontend  
Write-Host "Starting Expo frontend..." -ForegroundColor Cyan
git checkout expo-app 2>&1 | Out-Null

# Update API config
$apiConfig = @"
import Constants from 'expo-constants';
const isDev = __DEV__ || Constants.expoConfig?.extra?.dev === true;
const API_BASE_URL = 'http://localhost:8000/api';
export default API_BASE_URL;
"@
Set-Content -Path "config/api.js" -Value $apiConfig

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath'; npx expo start --web --port 8081" -WindowStyle Minimized
Start-Sleep -Seconds 5

# Create public tunnel for frontend
Write-Host "Creating public URL..." -ForegroundColor Cyan
Write-Host "Waiting for servers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "=== Your App is Running! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Local URLs:" -ForegroundColor Yellow
Write-Host "  Backend: http://localhost:8000/api/customers/" -ForegroundColor White
Write-Host "  Frontend: http://localhost:8081" -ForegroundColor White
Write-Host ""
Write-Host "Creating public URL..." -ForegroundColor Yellow
Write-Host ""

# Use localtunnel to create public URL
$tunnelOutput = npx -y localtunnel --port 8081 2>&1 | Tee-Object -Variable tunnelInfo
Write-Host $tunnelOutput

Write-Host ""
Write-Host "=== SUBMISSION LINK ===" -ForegroundColor Green
Write-Host "Use the URL shown above (starts with https://)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Servers are running in separate windows." -ForegroundColor Cyan
Write-Host "Close those windows to stop the servers." -ForegroundColor Cyan

