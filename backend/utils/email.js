const nodemailer = require("nodemailer");

/** Gmail app passwords are 16 chars; Google shows them with spaces — strip so .env works either way. */
const smtpUser = () => String(process.env.SMTP_USER || "").trim();
const smtpPass = () => String(process.env.SMTP_PASS || "").replace(/\s+/g, "");

const isSmtpConfigured = () => !!(smtpUser() && smtpPass());

let transporter;

const getTransporter = () => {
  if (!isSmtpConfigured()) return null;
  if (!transporter) {
    const user = smtpUser();
    const pass = smtpPass();
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
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

  try {
    await transport.sendMail({
      from: `"${appName}" <${from}>`,
      to: toEmail,
      subject,
      text,
    });
  } catch (err) {
    const code = err.responseCode || err.code;
    console.error(
      "[email] sendMail failed:",
      code || err.message,
      err.response || ""
    );
    throw err;
  }
}

module.exports = {
  sendPasswordResetOtpEmail,
  isSmtpConfigured,
};
