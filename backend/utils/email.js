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

/**
 * Welcome email after successful registration (HTML + plain text).
 */
async function sendWelcomeEmail(toEmail, displayName, role) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const appName = process.env.APP_NAME || "MentorBridge";
  const roleLabel =
    role === "student" ? "Student" : role === "alumni" ? "Alumni mentor" : "Administrator";
  const subject = `Welcome to ${appName} — you’re in`;
  const safeName = (displayName || "there").replace(/[<>]/g, "");
  const text = `Hi ${safeName},

Your ${appName} account is ready. You signed up as a ${roleLabel}.

Sign in anytime to connect, learn, and grow with the community.

— The ${appName} team`;

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.08);">
        <tr><td style="height:6px;background:linear-gradient(90deg,#1d1d1f 0%,#0071e3 100%);"></td></tr>
        <tr><td style="padding:36px 32px 28px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.08em;color:#0071e3;text-transform:uppercase;">${appName}</p>
          <h1 style="margin:0 0 12px;font-size:26px;font-weight:600;color:#1d1d1f;line-height:1.2;">Welcome, ${safeName}!</h1>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.55;color:#424245;">
            Your account was created successfully. You’re registered as <strong>${roleLabel}</strong>.
          </p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#6e6e73;">
            Explore the feed, build your profile, and start meaningful conversations on the platform.
          </p>
          <p style="margin:0;font-size:14px;color:#86868b;">We’re glad you’re here.</p>
        </td></tr>
        <tr><td style="padding:0 32px 32px;">
          <p style="margin:0;font-size:12px;color:#aeaeb2;">This message was sent because someone registered this email on ${appName}.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const transport = getTransporter();
  if (!transport) {
    console.warn("[email] SMTP not configured — welcome email not sent.");
    return;
  }

  await transport.sendMail({
    from: `"${appName}" <${from}>`,
    to: toEmail,
    subject,
    text,
    html,
  });
}

module.exports = {
  sendPasswordResetOtpEmail,
  isSmtpConfigured,
  sendWelcomeEmail,
};
