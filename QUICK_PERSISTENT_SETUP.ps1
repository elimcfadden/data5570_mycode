# Quick Persistent Deployment Setup
# This script helps you deploy the frontend to EAS Hosting

Write-Host "`n=== PERSISTENT FRONTEND DEPLOYMENT ===" -ForegroundColor Green
Write-Host "`nThis will deploy your frontend to EAS Hosting so it stays live 24/7!" -ForegroundColor Yellow
Write-Host "`nStep 1: Installing EAS CLI..." -ForegroundColor Cyan

# Check if EAS CLI is installed
$easInstalled = Get-Command eas -ErrorAction SilentlyContinue
if (-not $easInstalled) {
    Write-Host "Installing EAS CLI globally..." -ForegroundColor Yellow
    npm install -g eas-cli
} else {
    Write-Host "✅ EAS CLI is already installed" -ForegroundColor Green
}

Write-Host "`nStep 2: Navigate to project directory..." -ForegroundColor Cyan
cd C:\Users\elimc\data5570_mycode
git checkout expo-app

Write-Host "`nStep 3: You need to login to Expo..." -ForegroundColor Yellow
Write-Host "Run this command:" -ForegroundColor White
Write-Host "  eas login" -ForegroundColor Cyan
Write-Host "`n(If you don't have an account, it will prompt you to create one - it's free!)" -ForegroundColor Yellow

Write-Host "`nStep 4: After logging in, configure EAS:" -ForegroundColor Yellow
Write-Host "  eas build:configure" -ForegroundColor Cyan

Write-Host "`nStep 5: Export and deploy:" -ForegroundColor Yellow
Write-Host "  npx expo export:web" -ForegroundColor Cyan
Write-Host "  eas update --branch production --platform web" -ForegroundColor Cyan

Write-Host "`nStep 6: EAS will give you a persistent URL like:" -ForegroundColor Yellow
Write-Host "  https://expo-assignment-abc123.web.app" -ForegroundColor Cyan
Write-Host "`nThis URL will stay live 24/7 even when your computer is off! ✅" -ForegroundColor Green

Write-Host "`n=== BACKEND SETUP (Run on EC2) ===" -ForegroundColor Green
Write-Host "`nTo make backend persistent, SSH into EC2 and run these commands:" -ForegroundColor Yellow
Write-Host "`n1. Create Django systemd service (see PERSISTENT_DEPLOYMENT.md)" -ForegroundColor White
Write-Host "2. Create Cloudflare tunnel systemd service (see PERSISTENT_DEPLOYMENT.md)" -ForegroundColor White

Write-Host "`nFull instructions are in: PERSISTENT_DEPLOYMENT.md" -ForegroundColor Cyan

