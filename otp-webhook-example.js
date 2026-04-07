// QuickMart OTP webhook sample (Node.js + Express)
// Deploy this on Render/Railway/VPS and set Admin > OTP mode = webhook
// Endpoint should be configured in admin panel as: https://your-domain.com/api/send-otp

const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || '';

app.post('/api/send-otp', async (req, res) => {
  try {
    const mobile = String(req.body.mobile || '').replace(/\D/g, '').slice(-10);
    const otp = String(req.body.otp || '').replace(/\D/g, '').slice(0, 6);

    if (mobile.length !== 10 || otp.length < 4) {
      return res.status(400).json({ ok: false, message: 'Invalid mobile/otp' });
    }

    if (!FAST2SMS_API_KEY) {
      // Fallback for local testing without provider
      console.log('[OTP DEMO]', { mobile, otp });
      return res.json({ ok: true, mode: 'demo', message: 'Provider key missing; logged OTP to console.' });
    }

    const msg = `Your QuickMart OTP is ${otp}. Valid for 5 minutes.`;

    const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'Authorization': FAST2SMS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        route: 'q',
        message: msg,
        language: 'english',
        flash: 0,
        numbers: mobile
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ ok: false, message: 'SMS provider failed', provider: text });
    }

    const data = await response.json();
    return res.json({ ok: true, provider: data });
  } catch (error) {
    return res.status(500).json({ ok: false, message: error.message || 'Unknown error' });
  }
});

app.listen(PORT, () => {
  console.log(`OTP webhook running on port ${PORT}`);
});
