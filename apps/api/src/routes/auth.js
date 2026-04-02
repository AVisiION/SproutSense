import express from 'express';
import {
  forgotPassword,
  login,
  logout,
  me,
  updateProfile,
  passwordStrength,
  refreshSession,
  register,
  resendVerification,
  resetPassword,
  verifyEmail,
} from '../controllers/authController.js';
import authenticate from '../middleware/authenticate.js';
import {
  authForgotPasswordLimiter,
  authLoginLimiter,
  authRefreshLimiter,
  authRegisterLimiter,
  authResetPasswordLimiter,
} from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authRegisterLimiter, register);
router.post('/login', authLoginLimiter, login);
router.post('/refresh', authRefreshLimiter, refreshSession);
router.post('/logout', logout);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', authForgotPasswordLimiter, forgotPassword);
router.post('/reset-password', authResetPasswordLimiter, resetPassword);
router.post('/password-strength', passwordStrength);

router.get('/me', authenticate, me);
router.patch('/me', authenticate, updateProfile);

export default router;
