import 'dotenv/config';
import mongoose from 'mongoose';
import axios from 'axios';
import User from '../src/models/User.js';
import { ACCOUNT_STATUS } from '../src/config/rbac.js';

const API_BASE = process.env.SMOKE_API_BASE || `http://localhost:${process.env.PORT || 5000}/api`;
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('[FAIL] MONGODB_URI missing in apps/api/.env');
  process.exit(1);
}

const runId = Date.now();
const email = `smoke.user.${runId}@example.com`;
const password = 'SproutSense Smoke Pass 2026!';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  validateStatus: () => true,
});

function assert(condition, okText, failText) {
  if (condition) {
    console.log(`[PASS] ${okText}`);
    return;
  }
  console.error(`[FAIL] ${failText}`);
  throw new Error(failText);
}

async function main() {
  console.log(`[INFO] API: ${API_BASE}`);
  console.log(`[INFO] Test user: ${email}`);

  await mongoose.connect(MONGO_URI);

  await User.deleteOne({ email });

  const registerRes = await client.post('/auth/register', {
    fullName: 'Smoke Test User',
    email,
    password,
    confirmPassword: password,
  });

  assert(registerRes.status === 201, 'register endpoint returns 201', `register expected 201, got ${registerRes.status}`);
  assert(registerRes.data?.user?.accountStatus === ACCOUNT_STATUS.PENDING_VERIFICATION, 'new user is pending_verification', 'new user did not start in pending_verification');

  const pendingLogin = await client.post('/auth/login', { email, password });
  assert(pendingLogin.status === 403, 'login blocked for pending_verification account', `pending login expected 403, got ${pendingLogin.status}`);

  await User.updateOne(
    { email },
    {
      $set: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        accountStatus: ACCOUNT_STATUS.ACTIVE,
      },
    }
  );

  const loginRes = await client.post('/auth/login', { email, password });
  assert(loginRes.status === 200, 'login succeeds after activation', `active login expected 200, got ${loginRes.status}`);

  const accessToken = loginRes.data?.accessToken;
  const refreshToken = loginRes.data?.refreshToken;
  assert(Boolean(accessToken), 'access token issued', 'access token missing');
  assert(Boolean(refreshToken), 'refresh token issued', 'refresh token missing');

  const meRes = await client.get('/auth/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  assert(meRes.status === 200, '/auth/me works with bearer token', `/auth/me expected 200, got ${meRes.status}`);

  const refreshRes = await client.post('/auth/refresh', { refreshToken });
  assert(refreshRes.status === 200, 'refresh succeeds with valid token', `refresh expected 200, got ${refreshRes.status}`);

  const logoutRes = await client.post('/auth/logout', { refreshToken: refreshRes.data?.refreshToken || refreshToken });
  assert(logoutRes.status === 200, 'logout succeeds', `logout expected 200, got ${logoutRes.status}`);

  const noTokenSensors = await client.get('/sensors');
  assert(noTokenSensors.status === 401, 'protected sensors route rejects unauthenticated access', `expected /sensors 401, got ${noTokenSensors.status}`);

  const authedSensors = await client.get('/sensors', {
    headers: { Authorization: `Bearer ${refreshRes.data?.accessToken || accessToken}` },
  });
  assert(authedSensors.status !== 401 && authedSensors.status !== 403, 'authenticated user can access sensors.read route', `expected authorized /sensors, got ${authedSensors.status}`);

  await User.deleteOne({ email });

  console.log('[DONE] Auth/RBAC smoke test completed successfully.');
}

main()
  .catch(async (error) => {
    console.error('[ERROR]', error.message);
    try {
      await User.deleteOne({ email });
    } catch {
      // ignore cleanup errors
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore disconnect errors
    }
  });
