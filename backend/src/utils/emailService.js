const nodemailer = require('nodemailer');

const sendOTPEmail = async (email, otp) => {
  console.log(`\n========================================`);
  console.log(`🔑 [OTP NOTIFICATION FOR PASSWORD RESET]`);
  console.log(`✉️  Recipient: ${email}`);
  console.log(`🔢  6-Digit OTP: >>> ${otp} <<<`);
  console.log(`⏳  Valid for: 10 minutes`);
  console.log(`========================================\n`);

  // If SMTP configuration exists, attempt real email transmission
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: `"WanderWise Tours & Travels" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your Password Reset OTP - WanderWise Tours',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #0284c7; text-align: center;">WanderWise Tours & Travel</h2>
            <p>Hello,</p>
            <p>You requested a password reset. Use the One-Time Password (OTP) below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; background-color: #f0f9ff; padding: 12px 24px; border-radius: 6px; border: 1px dashed #0284c7; color: #0369a1;">
                ${otp}
              </span>
            </div>
            <p style="color: #64748b; font-size: 14px;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
          </div>
        `
      });
      console.log(`[Email Sent Successfully] to ${email}`);
    } catch (err) {
      console.error(`[Email Send Error]: ${err.message}`);
    }
  }

  return true;
};

module.exports = {
  sendOTPEmail
};
