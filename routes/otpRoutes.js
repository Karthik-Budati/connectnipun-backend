// routes/otpRoutes.js
const express = require('express');
const router = express.Router();
const twilio = require('twilio');

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const otpStore = new Map();

function normalizeMobile(mobile) {
  if (typeof mobile !== 'string') {
    throw new Error('Mobile number must be a string');
  }
  return mobile.replace(/^\+91/, '').trim(); // Remove +91 if present
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/send', async (req, res) => {
  try {
    console.log('Received /api/otp/send request with body:', req.body);
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ error: 'Mobile number is required' });
    }
    if (typeof mobile !== 'string') {
      return res.status(400).json({ error: 'Mobile number must be a string' });
    }
    if (!/^\+?\d{10}$/.test(normalizeMobile(mobile))) {
      return res.status(400).json({ error: 'Valid mobile number is required (10 digits)' });
    }

    const normalizedMobile = normalizeMobile(mobile);
    const otp = generateOTP();
    otpStore.set(normalizedMobile, { otp, expires: Date.now() + 5 * 60 * 1000 });

    await client.messages.create({
      body: `Your Connect Nipun OTP is ${otp}`,
      from: TWILIO_PHONE_NUMBER,
      to: `+91${normalizedMobile}`,
    });

    console.log(`OTP ${otp} sent to ${normalizedMobile}`);
    res.status(200).json({ message: 'OTP sent ✅' });
  } catch (err) {
    console.error('Error in /api/otp/send:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to send OTP via Twilio ❌' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    console.log('Received /api/otp/verify request with body:', req.body);

    if (!req.body || typeof req.body !== 'object') {
      console.log('Invalid request body detected');
      return res.status(400).json({ error: 'Invalid request body' });
    }

    const { mobile, otp } = req.body;

    console.log('Validating inputs:', { mobile, otp });
    if (!mobile) {
      console.log('Missing mobile number');
      return res.status(400).json({ error: 'Mobile number is required' });
    }
    if (!otp) {
      console.log('Missing OTP');
      return res.status(400).json({ error: 'OTP is required' });
    }
    if (typeof mobile !== 'string') {
      console.log('Mobile is not a string:', typeof mobile);
      return res.status(400).json({ error: 'Mobile number must be a string' });
    }
    if (typeof otp !== 'string') {
      console.log('OTP is not a string:', typeof otp);
      return res.status(400).json({ error: 'OTP must be a string' });
    }
    if (!/^\+?\d{10}$/.test(normalizeMobile(mobile))) {
      console.log('Invalid mobile number format:', mobile);
      return res.status(400).json({ error: 'Valid mobile number is required (10 digits)' });
    }
    if (!/^\d{6}$/.test(otp)) {
      console.log('Invalid OTP format:', otp);
      return res.status(400).json({ error: 'OTP must be a 6-digit number' });
    }

    const normalizedMobile = normalizeMobile(mobile);
    console.log('Normalized mobile:', normalizedMobile);

    const record = otpStore.get(normalizedMobile);
    console.log('OTP record:', record);

    if (!record) {
      console.log('No OTP record found for:', normalizedMobile);
      return res.status(400).json({ error: 'OTP not found or expired' });
    }

    console.log(`Verifying OTP for ${normalizedMobile}: Input OTP=${otp}, Stored OTP=${record.otp}, Expires=${record.expires}, Current Time=${Date.now()}`);

    if (Date.now() > record.expires) {
      console.log('OTP expired for:', normalizedMobile);
      otpStore.delete(normalizedMobile);
      return res.status(400).json({ error: 'OTP expired' });
    }

    if (record.otp !== otp) {
      console.log('Incorrect OTP for:', normalizedMobile);
      return res.status(400).json({ error: 'Incorrect OTP' });
    }

    console.log('OTP verified, deleting record for:', normalizedMobile);
    otpStore.delete(normalizedMobile);

    console.log('Sending success response');
    res.status(200).json({ message: 'OTP verified ✅' });
  } catch (err) {
    console.error('Error in /api/otp/verify:', err.message, err.stack);
    res.status(500).json({ error: 'Server error while verifying OTP ❌' });
  }
});

module.exports = router;