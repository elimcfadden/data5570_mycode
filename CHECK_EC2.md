# Quick EC2 Check Commands

Run these in your EC2 browser terminal:

## 1. Check what's running:
```bash
screen -ls
```

## 2. If django is NOT running, start it:
```bash
cd ~/data5570_mycode
source venv/bin/activate
screen -dmS django bash -c "cd ~/data5570_mycode && source venv/bin/activate && python manage.py runserver 0.0.0.0:8000"
```

## 3. If tunnel is NOT running, start it:
```bash
screen -dmS tunnel bash -c "cloudflared tunnel --url http://localhost:8000"
```

## 4. Check tunnel is working:
```bash
screen -r tunnel
```
(Look for the URL, then press Ctrl+A, then D to detach)

