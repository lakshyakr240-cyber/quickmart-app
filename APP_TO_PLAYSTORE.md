# QuickMart ko Android app banane aur Play Store par upload karne ka practical guide

## 0) Backend pehle run karo (mandatory)

Project me production backend scaffold ready hai: `backend/`

```bash
cd backend
cp .env.example .env
npm install
npm run start
```

Backend URL: `http://localhost:8787`

Frontend me `quickmart-api-bridge.js` added hai, so `index/admin/vendor/delivery` panels backend se connect ho jate hain.
Mobile build ke liye backend URL override `quickmart-config.js` me set karein:

```js
window.QUICKMART_API_BASE = "https://api.quickmart.yourdomain.com";
```

## Option A (Recommended): Web App -> Android App using Capacitor

### 1) Hosting setup
- `index.html`, `admin.html`, `vendor.html`, `delivery.html`, `quickmart-data.js`, `quickmart-api-bridge.js`, `styles.css` ko HTTPS domain par host karein.
- Backend API ko bhi HTTPS par deploy karein.
- Example:
  - Frontend: `https://quickmart.yourdomain.com`
  - Backend: `https://api.quickmart.yourdomain.com`

### 2) Android wrapper project banao
- System me install karein:
  - Node.js LTS
  - Android Studio
  - JDK 17
- Commands:

```bash
npm init -y
npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init QuickMart com.quickmart.sasaram --web-dir=www
```

### 3) Web files copy karein
- Current web files `www/` folder me copy karein.
- Agar hosted URL load karna ho to Capacitor config me server URL set karein.

### 4) Android platform add

```bash
npx cap add android
npx cap sync android
npx cap open android
```

### 5) Android Studio me build
- App name/icon/splash set karein.
- Internet permission verify karein.
- Release build:
  - `Build > Generate Signed Bundle / APK`
  - Play Store ke liye `.aab` generate karein.

## Option B (No Android Studio Download): GitHub Cloud Build APK

Agar local Android Studio download possible nahi hai, project me ready workflow diya gaya hai:

- File: `.github/workflows/android-debug-apk.yml`
- Ye GitHub server par APK build karta hai.

Steps:
1. Project ko GitHub repo me push karein.
2. GitHub me `Actions` tab kholein.
3. `Build QuickMart Debug APK` workflow select karein.
4. `Run workflow` click karein.
5. Build complete hone par `Artifacts` se `quickmart-debug-apk` download karein.

Note:
- Ye debug APK testing ke liye hai.
- Play Store ke liye signed release AAB alag process se banega.

## Play Store upload steps

1. Google Play Console account banayein.
2. New app create karein.
3. Package name same rakhein: `com.quickmart.sasaram`.
4. Store listing fill karein (name, description, screenshots, icon, feature graphic).
5. Data Safety form fill karein.
6. Content rating complete karein.
7. AAB upload karein (internal/closed testing pehle).
8. Testing ke baad production release karein.

## Production checklist (important)

- OTP real provider configure karein (backend `.env`):
  - `OTP_PROVIDER=msg91` ya `OTP_PROVIDER=twilio_verify`
- Admin panel me OTP settings:
  - Mode = `Webhook`
  - URL = `https://api.quickmart.yourdomain.com/api/otp/send`
- Razorpay config (`backend/.env`):
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
- Privacy Policy URL mandatory.
- Terms + support email mandatory.
- Domain HTTPS mandatory.

## Suggested rollout
1. Internal testing (10-20 users)
2. Closed testing (city-level users)
3. Production launch (Sasaram)
