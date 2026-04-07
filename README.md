# QuickMart (Sasaram) - Hyperlocal Grocery Delivery

A lightweight, mobile-first web app inspired by Blinkit, built for a small city context.

## Entry Points

- Customer app: `index.html`
- Admin panel: `admin.html`
- Vendor panel: `vendor.html`
- Delivery panel: `delivery.html`

Customer UI opens directly on `index.html` with no role selection.

## Demo Credentials

- Admin: `admin@quickmart.in` / `admin123`
- Vendor: `9001001001` / `1111`
- Delivery Partner: `9111100011` / `3333`

## Implemented Rules

- Minimum order: `₹100`
- Delivery fee: `₹15` for `₹100-₹299`
- Free delivery: `₹300+`
- Dynamic message: `Add ₹X more for free delivery`

## Notes

- OTP verification is included in demo mode (generated OTP is shown in UI hint).
- Real OTP SMS can be enabled from Admin OTP Settings using webhook mode.
- Backend bridge is added (`quickmart-api-bridge.js`). If backend is running, all panels use server DB.
- Mobile app/domain use case: set `window.QUICKMART_API_BASE` in `quickmart-config.js` to your hosted backend URL.
- Backend folder: `backend/` (file DB + API + OTP webhook + Razorpay endpoints).
- If backend is down, app falls back to browser local mode automatically.
- Built using plain HTML/CSS/JS for speed and low resource usage.
- Product image upload in admin supports both URL and direct file upload.
- Login/OTP inputs auto-normalize Hindi/Urdu digits, +91, and spaces.
- Android + Play Store deployment guide: `APP_TO_PLAYSTORE.md`.
- Sample OTP webhook backend: `otp-webhook-example.js`.
