import api, { unwrap } from './client.js';

export const register = async (form) => unwrap(await api.post('/users/register', form));
export const login = async (email, password) => unwrap(await api.post('/users/login', { email, password }));
export const demoLogin = async () => unwrap(await api.post('/users/demo-login'));
export const logout = async () => unwrap(await api.post('/users/logout'));
export const getMe = async () => unwrap(await api.get('/users/me')).data.user;

export const resendVerification = async () => unwrap(await api.post('/users/resend-verification'));
export const forgotPassword = async (email) => unwrap(await api.post('/users/forgot-password', { email }));
export const changePassword = async (currentPassword, newPassword) =>
  unwrap(await api.post('/users/change-password', { currentPassword, newPassword }));

// the links that arrive by email
export const verifyEmail = async (token) => unwrap(await api.get('/verify/verify-email', { params: { token } }));
export const checkResetLink = async (token) => unwrap(await api.get('/verify/reset-password', { params: { token } }));
export const resetPassword = async (token, password) => unwrap(await api.post('/verify/reset-password', { token, password }));
