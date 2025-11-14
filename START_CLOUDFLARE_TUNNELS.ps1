# Cloudflare Tunnels - NO PASSWORD REQUIRED!

Write-Host "=== Starting Cloudflare Tunnels ===" -ForegroundColor Green
Write-Host "NO PASSWORD REQUIRED - Just visit the URLs!" -ForegroundColor Yellow
Write-Host ""

$cloudflaredPath = "$env:TEMP\cloudflared.exe"

# Download cloudflared if needed
if (-not (Test-Path $cloudflaredPath)) {
    Write-Host "Downloading cloudflared..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $cloudflaredPath
    Write-Host "Downloaded" -ForegroundColor Green
}

# Start backend tunnel
Write-Host "Starting backend tunnel (port 8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Backend Tunnel - Port 8000' -ForegroundColor Green; & '$cloudflaredPath' tunnel --url http://localhost:8000"

Start-Sleep -Seconds 2

# Start frontend tunnel
Write-Host "Starting frontend tunnel (port 8081)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'Frontend Tunnel - Port 8081' -ForegroundColor Green; & '$cloudflaredPath' tunnel --url http://localhost:8081"

Write-Host ""
Write-Host "Tunnels started!" -ForegroundColor Green
Write-Host ""
Write-Host "Check the two PowerShell windows that opened." -ForegroundColor Yellow
Write-Host "They will show URLs like: https://xxxx.trycloudflare.com" -ForegroundColor White
Write-Host ""
Write-Host "NO PASSWORD NEEDED - Just visit the frontend URL!" -ForegroundColor Green
