import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export function createAccessToken(payload) {
  return jwt.sign(payload, config.SECURITY.JWT_SECRET, {
    expiresIn: '15m',
    issuer: 'sproutsense-api',
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.SECURITY.JWT_SECRET, {
    issuer: 'sproutsense-api',
  });
}

export function generateOpaqueToken() {
  return crypto.randomBytes(48).toString('hex');
}

export function hashOpaqueToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
