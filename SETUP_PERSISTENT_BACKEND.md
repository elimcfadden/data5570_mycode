# Setup Persistent Backend Services on EC2

This guide will configure your EC2 instance so that Django and the Cloudflare tunnel automatically start on boot and stay running 24/7.

## What This Does

1. **Creates systemd services** for Django and Cloudflare tunnel
2. **Enables auto-start** on EC2 reboot
3. **Auto-restarts** services if they crash
4. **Makes everything persistent** - no manual intervention needed

## How to Run

### Step 1: Upload the Script to EC2

Option A: Copy the script content and paste it into EC2 terminal

Option B: Clone the repo on EC2 (if you've pushed to GitHub):
```bash
cd ~
git clone https://github.com/elimcfadden/data5570_mycode.git
cd data5570_mycode
git checkout master
```

### Step 2: Run the Setup Script

```bash
cd ~/data5570_mycode
bash SETUP_PERSISTENT_BACKEND.sh
```

The script will:
- Stop existing screen sessions
- Create systemd services for Django and Cloudflare tunnel
- Enable services to start on boot
- Start the services
- Show you the status

### Step 3: Verify Everything Works

```bash
# Check Django status
sudo systemctl status django-app.service

# Check Cloudflare tunnel status
sudo systemctl status cloudflare-tunnel.service

# Check the tunnel URL
tail -n 20 ~/cloudflared.log | grep https://
```

## What Happens Next

✅ **Django will start automatically** when EC2 boots
✅ **Cloudflare tunnel will start automatically** when EC2 boots
✅ **Both services will auto-restart** if they crash
✅ **Everything persists** even if EC2 restarts

## Important Notes

1. **If the Cloudflare tunnel URL changes**, update `config/api.js` in your frontend project
2. **Keep your EC2 instance running** in AWS Console
3. **Monitor AWS costs** - ensure you're within free tier or expect billing

## Troubleshooting

### Check if services are running:
```bash
sudo systemctl status django-app.service
sudo systemctl status cloudflare-tunnel.service
```

### Restart services:
```bash
sudo systemctl restart django-app.service
sudo systemctl restart cloudflare-tunnel.service
```

### View logs:
```bash
# Django logs
sudo journalctl -u django-app.service -f

# Cloudflare tunnel logs
sudo journalctl -u cloudflare-tunnel.service -f
# Or
tail -f ~/cloudflared.log
```

### If something goes wrong:
```bash
# Disable auto-start (temporary)
sudo systemctl disable django-app.service
sudo systemctl disable cloudflare-tunnel.service

# Stop services
sudo systemctl stop django-app.service
sudo systemctl stop cloudflare-tunnel.service

# Re-enable and restart
sudo systemctl enable django-app.service
sudo systemctl enable cloudflare-tunnel.service
sudo systemctl start django-app.service
sudo systemctl start cloudflare-tunnel.service
```

