#!/bin/bash
# Setup Persistent Backend Services on EC2
# This script creates systemd services for Django and Cloudflare tunnel
# Run this on your EC2 instance: bash SETUP_PERSISTENT_BACKEND.sh

set -e

echo "=== Setting Up Persistent Backend Services ==="
echo ""

# Get the project directory
PROJECT_DIR="$HOME/data5570_mycode"
VENV_DIR="$PROJECT_DIR/venv"

# Check if project exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Error: Project directory not found at $PROJECT_DIR"
    exit 1
fi

# Check if venv exists
if [ ! -d "$VENV_DIR" ]; then
    echo "❌ Error: Virtual environment not found at $VENV_DIR"
    exit 1
fi

echo "✅ Project directory found: $PROJECT_DIR"
echo "✅ Virtual environment found: $VENV_DIR"
echo ""

# Stop any existing screen sessions
echo "Stopping existing screen sessions..."
screen -S django -X quit 2>/dev/null || true
screen -S tunnel -X quit 2>/dev/null || true
echo "✅ Stopped existing screen sessions"
echo ""

# Create systemd service for Django
echo "=== Creating Django Systemd Service ==="
sudo tee /etc/systemd/system/django-app.service > /dev/null <<EOF
[Unit]
Description=Django Customer Management App
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$PROJECT_DIR
Environment="PATH=$VENV_DIR/bin"
ExecStart=$VENV_DIR/bin/python manage.py runserver 0.0.0.0:8000
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Created Django systemd service"
echo ""

# Create systemd service for Cloudflare Tunnel
echo "=== Creating Cloudflare Tunnel Systemd Service ==="
sudo tee /etc/systemd/system/cloudflare-tunnel.service > /dev/null <<EOF
[Unit]
Description=Cloudflare Tunnel for Django
After=network.target django-app.service
Requires=django-app.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/cloudflared tunnel --url http://localhost:8000
Restart=always
RestartSec=10
StandardOutput=append:/home/ubuntu/cloudflared.log
StandardError=append:/home/ubuntu/cloudflared.log

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Created Cloudflare tunnel systemd service"
echo ""

# Reload systemd daemon
echo "=== Reloading Systemd Daemon ==="
sudo systemctl daemon-reload
echo "✅ Systemd daemon reloaded"
echo ""

# Enable services to start on boot
echo "=== Enabling Services to Start on Boot ==="
sudo systemctl enable django-app.service
sudo systemctl enable cloudflare-tunnel.service
echo "✅ Services enabled to start on boot"
echo ""

# Start the services
echo "=== Starting Services ==="
sudo systemctl start django-app.service
sleep 3
sudo systemctl start cloudflare-tunnel.service
sleep 3
echo "✅ Services started"
echo ""

# Check status
echo "=== Checking Service Status ==="
echo ""
echo "Django Status:"
sudo systemctl status django-app.service --no-pager -l | head -n 10
echo ""
echo "Cloudflare Tunnel Status:"
sudo systemctl status cloudflare-tunnel.service --no-pager -l | head -n 10
echo ""

# Get Cloudflare tunnel URL
echo "=== Getting Cloudflare Tunnel URL ==="
sleep 5
if [ -f "$HOME/cloudflared.log" ]; then
    TUNNEL_URL=$(tail -n 20 "$HOME/cloudflared.log" | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | tail -n 1)
    if [ ! -z "$TUNNEL_URL" ]; then
        echo "✅ Cloudflare Tunnel URL: $TUNNEL_URL"
        echo ""
        echo "⚠️  IMPORTANT: Update config/api.js with this URL if it changed!"
    else
        echo "⚠️  Could not extract tunnel URL from log. Check manually:"
        echo "   tail -n 20 $HOME/cloudflared.log"
    fi
fi
echo ""

echo "=== Setup Complete! ==="
echo ""
echo "✅ Django service is running and will auto-start on reboot"
echo "✅ Cloudflare tunnel service is running and will auto-start on reboot"
echo ""
echo "To check status anytime, run:"
echo "  sudo systemctl status django-app.service"
echo "  sudo systemctl status cloudflare-tunnel.service"
echo ""
echo "To restart services, run:"
echo "  sudo systemctl restart django-app.service"
echo "  sudo systemctl restart cloudflare-tunnel.service"
echo ""
echo "To view logs, run:"
echo "  sudo journalctl -u django-app.service -f"
echo "  sudo journalctl -u cloudflare-tunnel.service -f"
echo ""

