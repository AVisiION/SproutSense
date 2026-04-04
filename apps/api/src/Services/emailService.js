import nodemailer from 'nodemailer';
import config from '../config/config.js';
import dns from 'node:dns';

// Force Node.js to prefer IPv4 (fixes ENETUNREACH for IPv6 addresses like Gmail SMTP)
dns.setDefaultResultOrder('ipv4first');

function uiBaseUrl() {
  return process.env.FRONTEND_URL || config.CORS_ORIGIN || 'http://localhost:5173';
}

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST);
}

function createTransporter() {
  if (!hasSmtpConfig()) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  const authUser = process.env.SMTP_USER || '';
  const authPass = process.env.SMTP_PASS || '';

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: authUser || authPass ? { user: authUser, pass: authPass } : undefined,
    tls: {
      rejectUnauthorized: false
    }
  });
}

async function sendEmail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'no-reply@sproutsense.local';
  const transporter = createTransporter();

  if (!transporter) {
    console.warn(`[MAIL] SMTP is not configured. Skipping delivery to ${to}.`);
    return { delivered: false, provider: 'console' };
  }

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  return { delivered: true, provider: 'smtp' };
}

export async function sendVerificationEmail({ email, token }) {
  const verifyLink = `${uiBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const subject = 'Verify your SproutSense account';
  const text = [
    'Verify your SproutSense account',
    '',
    `Open this link to verify your email: ${verifyLink}`,
    '',
    'If you did not create this account, ignore this email.',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#10221a">
      <h2>Verify your SproutSense account</h2>
      <p>Open the link below to verify your email address and activate your account.</p>
      <p><a href="${verifyLink}">${verifyLink}</a></p>
      <p>If you did not create this account, you can ignore this email.</p>
    </div>
  `;

  const result = await sendEmail({ to: email, subject, text, html });
  if (!result.delivered) {
    console.log(`[MAIL] Verification email -> ${email}: ${verifyLink}`);
  }
  return { ...result, verifyLink };
}

export async function sendResetPasswordEmail({ email, token }) {
  const resetLink = `${uiBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const subject = 'Reset your SproutSense password';
  const text = [
    'Reset your SproutSense password',
    '',
    `Open this link to reset your password: ${resetLink}`,
    '',
    'If you did not request a password reset, ignore this email.',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#10221a">
      <h2>Reset your SproutSense password</h2>
      <p>Open the link below to reset your password.</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>If you did not request this email, you can ignore it.</p>
    </div>
  `;

  const result = await sendEmail({ to: email, subject, text, html });
  if (!result.delivered) {
    console.log(`[MAIL] Reset password email -> ${email}: ${resetLink}`);
  }
  return { ...result, resetLink };
}
