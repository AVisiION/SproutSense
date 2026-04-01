import config from '../config/config.js';

function uiBaseUrl() {
  return config.CORS_ORIGIN || 'http://localhost:5173';
}

export async function sendVerificationEmail({ email, token }) {
  const verifyLink = `${uiBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  console.log(`[MAIL] Verification email -> ${email}: ${verifyLink}`);
  return { delivered: true, verifyLink };
}

export async function sendResetPasswordEmail({ email, token }) {
  const resetLink = `${uiBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  console.log(`[MAIL] Reset password email -> ${email}: ${resetLink}`);
  return { delivered: true, resetLink };
}
