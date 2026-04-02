const STRENGTH_LABELS = ['Weak', 'Fair', 'Good', 'Strong'];

const COMMON_PASSWORDS = new Set([
  'password',
  'password1',
  'password123',
  '123456',
  '12345678',
  '123456789',
  'qwerty',
  'qwerty123',
  'admin',
  'admin123',
  'letmein',
  'welcome',
  'welcome123',
  'iloveyou',
]);

const SEQUENCE_PATTERNS = [/0123/i, /1234/i, /2345/i, /3456/i, /4567/i, /5678/i, /6789/i, /abcd/i, /bcde/i, /cdef/i, /qwer/i, /asdf/i, /zxcv/i];

const normalizePassword = (value) => String(value || '').normalize('NFKC').trim();

function findSequentialPattern(value) {
  const lowered = value.toLowerCase();
  return SEQUENCE_PATTERNS.some((pattern) => pattern.test(lowered));
}

function getLengthScore(length) {
  if (length >= 20) return 3;
  if (length >= 16) return 3;
  if (length >= 12) return 2;
  if (length >= 8) return 1;
  return 0;
}

export function evaluatePasswordStrength(password = '', profile = {}) {
  const value = normalizePassword(password);
  const hints = [];
  let score = getLengthScore(value.length);

  if (value.length < 8) {
    hints.push('Use at least 8 characters.');
  } else if (value.length < 12) {
    hints.push('Use a longer passphrase. 12+ characters is better.');
  } else if (value.length < 16) {
    hints.push('Longer passphrases are harder to guess.');
  }

  const lowered = value.toLowerCase();
  const email = String(profile.email || '').toLowerCase();
  const fullName = String(profile.fullName || '').toLowerCase();

  if (COMMON_PASSWORDS.has(lowered)) {
    hints.unshift('This password is too common. Choose a unique passphrase.');
    score = 0;
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

  if (/(.)\1{3,}/.test(value) || findSequentialPattern(value)) {
    hints.unshift('Avoid repeated characters and predictable sequences.');
    score = Math.max(0, score - 1);
  }

  if (value.length >= 12 && value.includes(' ')) {
    hints.unshift('A long passphrase with spaces is fine and often easier to remember.');
  }

  const normalizedScore = Math.min(3, Math.max(0, score));

  return {
    score: normalizedScore,
    level: STRENGTH_LABELS[normalizedScore],
    hints: [...new Set(hints)].slice(0, 4),
    isAcceptable: normalizedScore >= 1 && value.length >= 8,
  };
}

export function validatePasswordPolicy({ password, fullName, email, isPrivileged = false }) {
  const result = evaluatePasswordStrength(password, { fullName, email });
  const minLength = isPrivileged ? 12 : 8;

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
      message: 'Password is too weak. Use a longer unique passphrase.',
      strength: result,
    };
  }

  return { ok: true, strength: result };
}
