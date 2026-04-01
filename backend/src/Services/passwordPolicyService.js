const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  '12345678',
  '123456789',
  'qwerty123',
  'admin123',
  'letmein',
  'welcome123',
]);

const STRENGTH_LABELS = ['Weak', 'Fair', 'Good', 'Strong'];

const hasLower = (text) => /[a-z]/.test(text);
const hasUpper = (text) => /[A-Z]/.test(text);
const hasDigit = (text) => /\d/.test(text);
const hasSymbol = (text) => /[^A-Za-z0-9\s]/.test(text);

export function evaluatePasswordStrength(password = '', profile = {}) {
  const value = String(password || '');
  const hints = [];
  let score = 0;

  if (value.length >= 12) score += 1;
  else hints.push('Use at least 12 characters.');

  if (value.length >= 16) score += 1;
  else hints.push('Consider 16+ characters for a strong passphrase.');

  const classes = [hasLower(value), hasUpper(value), hasDigit(value), hasSymbol(value)].filter(Boolean).length;
  if (classes >= 3) score += 1;
  else hints.push('Add uppercase, digits, or symbols to increase complexity.');

  if (value.includes(' ')) score += 1;
  else hints.push('A multi-word passphrase is easier to remember and harder to crack.');

  const lowered = value.toLowerCase();
  const email = String(profile.email || '').toLowerCase();
  const fullName = String(profile.fullName || '').toLowerCase();

  if (COMMON_PASSWORDS.has(lowered)) {
    hints.unshift('This password is too common. Choose a unique passphrase.');
    score = Math.max(0, score - 2);
  }

  if (email && lowered.includes(email.split('@')[0])) {
    hints.unshift('Do not include your email username in the password.');
    score = Math.max(0, score - 1);
  }

  const fullNameChunk = fullName.replace(/\s+/g, '').slice(0, 6);
  if (fullNameChunk && fullNameChunk.length >= 4 && lowered.includes(fullNameChunk)) {
    hints.unshift('Do not include your name in the password.');
    score = Math.max(0, score - 1);
  }

  const repeatedPattern = /(.)\1{3,}/.test(value) || /(1234|abcd|qwer)/i.test(value);
  if (repeatedPattern) {
    hints.unshift('Avoid repeated characters and predictable sequences.');
    score = Math.max(0, score - 1);
  }

  const normalizedScore = Math.min(3, Math.max(0, score));

  return {
    score: normalizedScore,
    level: STRENGTH_LABELS[normalizedScore],
    hints: [...new Set(hints)].slice(0, 4),
    isAcceptable: normalizedScore >= 2 && value.length >= 12,
  };
}

export function validatePasswordPolicy({ password, fullName, email, isPrivileged = false }) {
  const result = evaluatePasswordStrength(password, { fullName, email });
  const minLength = isPrivileged ? 14 : 12;

  if (!password || password.length < minLength) {
    return {
      ok: false,
      message: `Password must be at least ${minLength} characters long.`,
      strength: result,
    };
  }

  if (!result.isAcceptable) {
    return {
      ok: false,
      message: 'Password is too weak. Use a stronger passphrase.',
      strength: result,
    };
  }

  return { ok: true, strength: result };
}
