#!/bin/bash
set -e

echo "=== Installing Dependencies ==="
sudo apt update
sudo apt install -y python3-pip python3-venv git curl screen

echo "=== Cloning Repository ==="
if [ -d "data5570_mycode" ]; then
    cd data5570_mycode
    git pull
    git checkout master
else
    git clone https://github.com/elimcfadden/data5570_mycode.git
    cd data5570_mycode
    git checkout master
fi

echo "=== Setting Up Python Environment ==="
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

echo "=== Running Migrations ==="
python manage.py migrate

echo "=== Installing Cloudflared ==="
curl -L https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-archive-keyring.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-archive-keyring.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update
sudo apt install -y cloudflared

echo "=== Updating Django Settings ==="
# Ensure ALLOWED_HOSTS includes the EC2 IP
python3 << 'PYTHON'
import re
with open('myproject/settings.py', 'r') as f:
    content = f.read()

# Update ALLOWED_HOSTS to include EC2 IP and *
if "ALLOWED_HOSTS = ['3.16.214.212', 'localhost', '127.0.0.1', '*']" not in content:
    content = re.sub(
        r"ALLOWED_HOSTS = \[.*?\]",
        "ALLOWED_HOSTS = ['3.16.214.212', 'localhost', '127.0.0.1', '*']",
        content
    )
    with open('myproject/settings.py', 'w') as f:
        f.write(content)
    print("Updated ALLOWED_HOSTS")
else:
    print("ALLOWED_HOSTS already configured")
PYTHON

echo "=== Stopping Existing Services ==="
screen -S django -X quit 2>/dev/null || true
screen -S cloudflare -X quit 2>/dev/null || true
pkill -f "manage.py runserver" 2>/dev/null || true
pkill -f "cloudflared tunnel" 2>/dev/null || true

echo "=== Starting Django Server ==="
cd /home/ubuntu/data5570_mycode
source venv/bin/activate
screen -dmS django bash -c "cd /home/ubuntu/data5570_mycode && source venv/bin/activate && python manage.py runserver 0.0.0.0:8000"
sleep 3

echo "=== Starting Cloudflare Tunnel ==="
screen -dmS cloudflare bash -c "cloudflared tunnel --url http://localhost:8000"

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo ""
echo "To see your Cloudflare URL, run:"
echo "  screen -r cloudflare"
echo ""
echo "To check Django logs:"
echo "  screen -r django"
echo ""
echo "To detach from screen: Press Ctrl+A then D"

