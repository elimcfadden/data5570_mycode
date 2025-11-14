# Persistent Deployment Guide - Keep Your App Live for Weeks

## Current Problem

Your frontend is running **locally** with a temporary Cloudflare tunnel. This means:
- ❌ When your computer is off → Frontend is down
- ❌ When the tunnel stops → Frontend is unreachable
- ❌ Tunnel URLs change → Need to update configuration

## Solution: Deploy Frontend to EAS Hosting (Persistent)

EAS Hosting will keep your frontend live 24/7 for free, even when your computer is off.

---

## Part 1: Deploy Frontend to EAS Hosting

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```
(If you don't have an account, it will prompt you to create one - it's free!)

### Step 3: Navigate to your project

```bash
cd C:\Users\elimc\data5570_mycode
git checkout expo-app
```

### Step 4: Configure EAS

```bash
eas build:configure
```

This will create an `eas.json` file. For web hosting, you can accept defaults.

### Step 5: Update API Configuration for Production

**IMPORTANT:** Update `config/api.js` to use your EC2 backend URL (the persistent one):

```javascript
const API_BASE_URL = 'https://tsunami-base-produces-sorts.trycloudflare.com/api';
export default API_BASE_URL;
```

(Keep it pointing to your EC2 backend Cloudflare tunnel URL)

### Step 6: Deploy to EAS Hosting

```bash
npx expo export:web
eas update --branch production --platform web
```

OR use EAS Hosting:

```bash
npx expo export:web
eas hosting:upload
```

### Step 7: Get Your Persistent URL

After deployment, EAS will give you a URL like:
```
https://expo-assignment-abc123.web.app
```

**This URL will stay live 24/7!** ✅

---

## Part 2: Ensure Backend Stays Up on EC2

### Option A: Keep Cloudflare Tunnel Running (Current Setup)

Your backend tunnel on EC2 should stay up as long as:
1. EC2 instance is running ✅
2. Django is running in screen session ✅
3. Cloudflare tunnel is running in screen session ✅

**To check if everything is still running on EC2:**

```bash
ssh into your EC2 instance
screen -ls
```

You should see:
- `django` session (Django server)
- `tunnel` session (Cloudflare tunnel)

**If tunnel stops, restart it:**

```bash
screen -S tunnel -X quit 2>/dev/null
screen -dmS tunnel bash -c "cloudflared tunnel --url http://localhost:8000"
tail -n 5 ~/cloudflared.log
```

The last line will show the tunnel URL (should be the same: `https://tsunami-base-produces-sorts.trycloudflare.com`)

### Option B: Make Cloudflare Tunnel Persistent (Recommended)

The tunnel might timeout. To make it more persistent, you can create a systemd service.

**On your EC2 instance, create a service:**

```bash
sudo nano /etc/systemd/system/cloudflare-tunnel.service
```

Add this content:

```ini
[Unit]
Description=Cloudflare Tunnel for Django
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/data5570_mycode
ExecStart=/usr/bin/cloudflared tunnel --url http://localhost:8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudflare-tunnel.service
sudo systemctl start cloudflare-tunnel.service
sudo systemctl status cloudflare-tunnel.service
```

This will keep the tunnel running even if EC2 restarts!

---

## Part 3: Make Django Persistent on EC2

### Create a systemd service for Django:

```bash
sudo nano /etc/systemd/system/django-app.service
```

Add this content:

```ini
[Unit]
Description=Django Customer Management App
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/data5570_mycode
Environment="PATH=/home/ubuntu/data5570_mycode/venv/bin"
ExecStart=/home/ubuntu/data5570_mycode/venv/bin/python manage.py runserver 0.0.0.0:8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable django-app.service
sudo systemctl start django-app.service
sudo systemctl status django-app.service
```

This will keep Django running even if EC2 restarts!

---

## Summary: What You Need to Do

### ✅ To Keep Frontend Live:
1. Deploy to EAS Hosting (see Part 1 above)
2. Get your persistent EAS URL
3. Update `config/api.js` if needed to point to backend

### ✅ To Keep Backend Live:
1. Ensure EC2 instance stays running (AWS should handle this)
2. Make Django persistent with systemd (Part 3)
3. Make Cloudflare tunnel persistent with systemd (Part 2, Option B)

---

## Final Submission URLs

**Frontend:** `https://your-eas-url.web.app` (from EAS Hosting)
**Backend:** `https://tsunami-base-produces-sorts.trycloudflare.com/api` (from EC2)

Both will stay live for weeks! ✅

---

## Quick Check Commands (for EC2)

To verify everything is running:

```bash
# Check Django
sudo systemctl status django-app.service

# Check Cloudflare Tunnel
sudo systemctl status cloudflare-tunnel.service

# Check both
screen -ls
```

---

## Troubleshooting

**If frontend doesn't load:**
- Check if EAS deployment succeeded: `eas hosting:status`
- Verify API URL in `config/api.js` matches backend URL

**If backend doesn't respond:**
- SSH into EC2 and check: `sudo systemctl status django-app.service`
- Check tunnel: `sudo systemctl status cloudflare-tunnel.service`
- Restart if needed: `sudo systemctl restart django-app.service`

