# EC2 Deployment Script
# This script helps deploy your app to EC2

param(
    [string]$EC2IP = "",
    [string]$SSHKey = "",
    [string]$EC2User = "ubuntu"
)

Write-Host "=== EC2 Deployment Script ===" -ForegroundColor Green
Write-Host ""

if ([string]::IsNullOrEmpty($EC2IP)) {
    Write-Host "EC2 Instance IP: " -NoNewline -ForegroundColor Yellow
    $EC2IP = Read-Host
}

if ([string]::IsNullOrEmpty($SSHKey)) {
    Write-Host "SSH Key Path (leave empty if using default): " -NoNewline -ForegroundColor Yellow
    $SSHKey = Read-Host
}

Write-Host ""
Write-Host "Deploying to: $EC2IP" -ForegroundColor Cyan
Write-Host ""

# Create deployment script for EC2
$deployScript = @"
#!/bin/bash
set -e

echo '=== Installing Dependencies ==='
sudo apt update
sudo apt install -y python3-pip python3-venv git curl

echo '=== Cloning Repository ==='
if [ -d "data5570_mycode" ]; then
    cd data5570_mycode
    git pull
    git checkout master
else
    git clone https://github.com/elimcfadden/data5570_mycode.git
    cd data5570_mycode
    git checkout master
fi

echo '=== Setting Up Python Environment ==='
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

echo '=== Running Migrations ==='
python manage.py migrate

echo '=== Installing Cloudflared ==='
curl -L https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-archive-keyring.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-archive-keyring.gpg] https://pkg.cloudflare.com/cloudflared \$(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update
sudo apt install -y cloudflared

echo '=== Updating Django Settings ==='
# Update ALLOWED_HOSTS
sed -i "s/ALLOWED_HOSTS = \[.*\]/ALLOWED_HOSTS = ['*', 'localhost', '127.0.0.1']/" myproject/settings.py

echo '=== Creating Startup Script ==='
cat > start_app.sh << 'EOF'
#!/bin/bash
cd /home/ubuntu/data5570_mycode
source venv/bin/activate
python manage.py runserver 0.0.0.0:8000 &
cloudflared tunnel --url http://localhost:8000
EOF

chmod +x start_app.sh

echo '=== Starting Application ==='
screen -dmS django bash -c 'cd /home/ubuntu/data5570_mycode && source venv/bin/activate && python manage.py runserver 0.0.0.0:8000'
sleep 3
screen -dmS cloudflare bash -c 'cloudflared tunnel --url http://localhost:8000'

echo ''
echo '=== DEPLOYMENT COMPLETE ==='
echo 'Check the cloudflare screen for your public URL:'
echo '  screen -r cloudflare'
echo ''
echo 'To check Django is running:'
echo '  screen -r django'
"@

# Save deployment script
$deployScript | Out-File -FilePath "$env:TEMP\deploy_ec2.sh" -Encoding ASCII

Write-Host "Created deployment script at: $env:TEMP\deploy_ec2.sh" -ForegroundColor Green
Write-Host ""
Write-Host "To deploy, run this command:" -ForegroundColor Yellow
if ([string]::IsNullOrEmpty($SSHKey)) {
    Write-Host "  scp $env:TEMP\deploy_ec2.sh $EC2User@${EC2IP}:~/deploy.sh" -ForegroundColor Cyan
    Write-Host "  ssh $EC2User@${EC2IP} 'bash ~/deploy.sh'" -ForegroundColor Cyan
} else {
    Write-Host "  scp -i `"$SSHKey`" $env:TEMP\deploy_ec2.sh $EC2User@${EC2IP}:~/deploy.sh" -ForegroundColor Cyan
    Write-Host "  ssh -i `"$SSHKey`" $EC2User@${EC2IP} 'bash ~/deploy.sh'" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Or I can run it for you if you provide the details above." -ForegroundColor White

