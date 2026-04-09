import { ROLE } from '../../../auth/permissions';

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? null : 'Invalid email format';
};

export const validatePassword = (password, minLength = 12) => {
  if (password.length < minLength) return `Must be at least ${minLength} characters`;
  if (!/[a-z]/.test(password)) return 'Must contain lowercase letters';
  if (!/[A-Z]/.test(password)) return 'Must contain uppercase letters';
  if (!/[0-9]/.test(password)) return 'Must contain numbers';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Must contain special characters';
  return null;
};

export const validateSensorForm = (form) => {
  const errors = {};
  if (!form.name?.trim()) errors.name = 'Sensor name required';
  if (!form.key?.trim()) errors.key = 'Sensor key required';
  if (!form.unit?.trim()) errors.unit = 'Unit required';
  if (typeof form.minThreshold !== 'number') errors.minThreshold = 'Min threshold required';
  if (typeof form.maxThreshold !== 'number') errors.maxThreshold = 'Max threshold required';
  if (form.minThreshold >= form.maxThreshold) {
    errors.maxThreshold = 'Must be greater than min threshold';
  }
  return errors;
};

export const validateUserForm = (form, isCreate = true) => {
  const errors = {};
  if (!form.fullName?.trim()) errors.fullName = 'Full name required';
  if (!form.email?.trim()) errors.email = 'Email required';
  const emailError = validateEmail(form.email);
  if (emailError) errors.email = emailError;
  if (isCreate) {
    if (!form.password) errors.password = 'Password required';
    const minLen = form.roleKey === ROLE.ADMIN ? 14 : 12;
    const passError = validatePassword(form.password, minLen);
    if (passError) errors.password = passError;
  }
  return errors;
};


