# Deployment Guide - Full Stack App

## Quick Deployment Steps

### Option 1: EAS Hosting (Recommended for Frontend)

The frontend can be deployed using EAS Hosting which gives you a web URL.

### Option 2: Expo Go (Quick Testing)

For quick testing/submission, you can use Expo Go app on your phone.

---

## Step-by-Step Deployment

### PART 1: Deploy Backend (Django) to AWS EC2

1. **SSH into your EC2 instance:**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. **Clone the repository:**
   ```bash
   git clone https://github.com/elimcfadden/data5570_mycode.git
   cd data5570_mycode
   git checkout master
   ```

3. **Install dependencies:**
   ```bash
   python3 -m pip install -r requirements.txt
   ```

4. **Run migrations:**
   ```bash
   python3 manage.py migrate
   ```

5. **Start Django server:**
   ```bash
   python3 manage.py runserver 0.0.0.0:8000
   ```

6. **Set up Cloudflare tunnel for HTTPS:**
   ```bash
   # Install cloudflared
   curl -L https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-archive-keyring.gpg >/dev/null
   echo "deb [signed-by=/usr/share/keyrings/cloudflare-archive-keyring.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
   sudo apt update
   sudo apt install -y cloudflared

   # Run tunnel (in a separate terminal or screen session)
   cloudflared tunnel --url http://localhost:8000
   ```
   
   This will give you a URL like: `https://random-words-1234.trycloudflare.com`

7. **Update API URL in frontend:**
   - Edit `config/api.js` in the expo-app branch
   - Change the production URL to your Cloudflare tunnel URL

---

### PART 2: Deploy Frontend (Expo) with EAS Hosting

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Navigate to expo-app branch:**
   ```bash
   cd C:\Users\elimc\data5570_mycode
   git checkout expo-app
   ```

4. **Update API configuration:**
   - Edit `config/api.js`
   - Set the production URL to your Cloudflare tunnel URL:
   ```javascript
   const API_BASE_URL = isDev
     ? 'http://localhost:8000/api'
     : 'https://your-cloudflare-tunnel-url.trycloudflare.com/api';
   ```

5. **Configure EAS:**
   ```bash
   eas build:configure
   ```

6. **Deploy to EAS Hosting:**
   ```bash
   eas update --branch production
   ```

   OR for web hosting:
   ```bash
   npx expo export:web
   npx serve dist
   ```

7. **Get your app link:**
   - EAS will provide you with a URL like: `https://your-app.expo.dev`
   - Or use Expo Go: `exp://your-ip:8081`

---

## Quick Alternative: Expo Go (For Testing/Submission)

If you just need a quick link for submission:

1. **Start Expo development server:**
   ```bash
   cd C:\Users\elimc\data5570_mycode
   git checkout expo-app
   npm install
   npx expo start
   ```

2. **Get the QR code/link:**
   - The terminal will show a QR code
   - Or use the URL shown (like `exp://192.168.1.x:8081`)

3. **For web preview:**
   ```bash
   npx expo start --web
   ```
   - This gives you a localhost URL
   - Or use ngrok/tunneling service to make it public

---

## Using ngrok for Quick Public URL

1. **Install ngrok:**
   - Download from https://ngrok.com/
   - Or: `choco install ngrok` (Windows)

2. **Start your Expo web server:**
   ```bash
   npx expo start --web
   ```

3. **Create tunnel:**
   ```bash
   ngrok http 8081
   ```

4. **Get public URL:**
   - ngrok will give you a URL like: `https://abc123.ngrok.io`
   - This is your submission link!

---

## Recommended: EAS Hosting (Easiest for Submission)

1. **Install and login:**
   ```bash
   npm install -g eas-cli
   eas login
   ```

2. **In your expo-app directory:**
   ```bash
   eas build:configure
   ```

3. **Deploy:**
   ```bash
   eas update
   ```

4. **Get your link:**
   - Check your Expo dashboard: https://expo.dev
   - Your app will have a public URL

---

## Important Notes

- Make sure your backend is running and accessible
- Update `config/api.js` with your backend URL
- For production, update CORS settings in Django to allow your frontend URL
- Keep both servers running (Django on EC2, Expo locally or on EAS)

---

## Submission Link Options

1. **EAS Hosting URL** (Best): `https://your-app.expo.dev`
2. **Expo Go Link**: `exp://...` (requires Expo Go app)
3. **Web Preview**: Use ngrok or similar for `https://...` URL
4. **GitHub Pages**: If you export as static web app

