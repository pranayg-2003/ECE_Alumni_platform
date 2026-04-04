const nodemailer = require("nodemailer");

const isSmtpConfigured = () =>
  !!(process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter;

const getTransporter = () => {
  if (!isSmtpConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

/**
 * Send 6-digit password reset OTP via Gmail (SMTP_USER + SMTP_APP_PASSWORD).
 */
async function sendPasswordResetOtpEmail(toEmail, otp, displayName) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const appName = process.env.APP_NAME || "MentorBridge";
  const subject = `${appName} — password reset code`;
  const text = `Hi ${displayName || "there"},

Your verification code is: ${otp}

It expires in 10 minutes. If you didn't request this, you can ignore this email.

— ${appName}`;

  const transport = getTransporter();
  if (!transport) {
    console.warn(
      "[email] SMTP not configured (SMTP_USER / SMTP_PASS). OTP not emailed."
    );
    throw new Error("SMTP_NOT_CONFIGURED");
  }

  await transport.sendMail({
    from: `"${appName}" <${from}>`,
    to: toEmail,
    subject,
    text,
  });
}

module.exports = {
  sendPasswordResetOtpEmail,
  isSmtpConfigured,
};
