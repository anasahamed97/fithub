const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

/** Send OTP email using Resend */
async function sendOtpEmail(to, otp) {
  const subject = 'FitHub – Password Reset OTP';
  const html = `
    <p>Hello,</p>
    <p>Your OTP for resetting your password is:</p>
    <h2 style="color:#2c3e50;">${otp}</h2>
    <p>This code expires in 10 minutes.</p>
    <p>If you didn’t request this, you can safely ignore this email.</p>
  `;

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM || 'no-reply@fithub.com',
      to,
      subject,
      html,
    });
    console.log('✅ Resend email sent', result);
  } catch (err) {
    console.error('❌ Resend email error', err);
    throw err;
  }
  console.log('✅ OTP email sent via Resend to', to);
}

module.exports = { sendOtpEmail };
