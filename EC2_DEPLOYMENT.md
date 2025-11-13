# EC2 Deployment Guide - Full Stack App

## Prerequisites
- AWS EC2 instance running (Ubuntu recommended)
- SSH access to your EC2 instance
- Your EC2 public IP address

## Step 1: Deploy Backend to EC2

### 1.1 Connect to EC2
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 1.2 Install Dependencies
```bash
sudo apt update
sudo apt install -y python3-pip python3-venv git
```

### 1.3 Clone Repository
```bash
git clone https://github.com/elimcfadden/data5570_mycode.git
cd data5570_mycode
git checkout master
```

### 1.4 Set Up Python Environment
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 1.5 Configure Django
```bash
# Edit settings.py to update ALLOWED_HOSTS
nano myproject/settings.py
# Add your EC2 IP or domain to ALLOWED_HOSTS
```

### 1.6 Run Migrations
```bash
python manage.py migrate
```

### 1.7 Start Django Server
```bash
# For testing (will stop when you disconnect)
python manage.py runserver 0.0.0.0:8000

# OR use screen/tmux to keep it running:
screen -S django
python manage.py runserver 0.0.0.0:8000
# Press Ctrl+A then D to detach
```

### 1.8 Set Up Cloudflare Tunnel (for HTTPS)
```bash
# Install cloudflared
curl -L https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-archive-keyring.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-archive-keyring.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update
sudo apt install -y cloudflared

# Start tunnel (in screen/tmux)
screen -S cloudflare
cloudflared tunnel --url http://localhost:8000
# Press Ctrl+A then D to detach
```

## Step 2: Update Frontend to Use EC2 Backend

### 2.1 Update API Configuration
Edit `config/api.js` in the expo-app branch:
```javascript
const API_BASE_URL = 'https://your-cloudflare-tunnel-url.trycloudflare.com/api';
// OR if using EC2 directly:
const API_BASE_URL = 'http://your-ec2-ip:8000/api';
```

### 2.2 Deploy Frontend to EAS
```bash
cd C:\Users\elimc\data5570_mycode
git checkout expo-app
npm install -g eas-cli
eas login
eas update
```

## Step 3: Security Group Configuration

Make sure your EC2 security group allows:
- Port 8000 (HTTP) - from your IP or 0.0.0.0/0 for testing
- Port 22 (SSH) - from your IP

## Step 4: Test

1. Backend API: `http://your-ec2-ip:8000/api/customers/`
2. Frontend: Your EAS URL or local Expo app

