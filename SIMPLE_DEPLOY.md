# Simple Deployment - Just Run One Command!

## Easiest Method (If you have Node.js installed):

1. **Open PowerShell in this folder**
2. **Run:**
   ```powershell
   .\QUICK_DEPLOY.ps1
   ```

That's it! The script will:
- ✅ Start Django backend
- ✅ Start Expo frontend  
- ✅ Create public URLs automatically
- ✅ Give you links to submit

---

## If Node.js is NOT installed:

### Option 1: Install Node.js (Recommended - 2 minutes)
1. Download from: https://nodejs.org/ (get the LTS version)
2. Run the installer (just click Next, Next, Install)
3. Restart PowerShell
4. Run: `.\QUICK_DEPLOY.ps1`

### Option 2: Use Online Services (No installation needed)

#### For Backend:
1. Go to: https://www.pythonanywhere.com/ (free account)
2. Upload your Django code from `master` branch
3. Get your backend URL

#### For Frontend:
1. Go to: https://expo.dev
2. Sign up (free)
3. Run: `npx expo start`
4. Get your Expo URL

---

## Manual Quick Start (If script doesn't work):

### Terminal 1 - Backend:
```powershell
cd C:\Users\elimc\data5570_mycode
git checkout master
python -m pip install django djangorestframework django-cors-headers
python manage.py migrate
python manage.py runserver
```

### Terminal 2 - Frontend:
```powershell
cd C:\Users\elimc\data5570_mycode
git checkout expo-app
npm install
npx expo start --web
```

### Terminal 3 - Create Public URL:
```powershell
npx -y localtunnel --port 8081
```
(Copy the URL it gives you - that's your submission link!)

---

## Need Help?

The script will tell you what's missing and how to fix it!

