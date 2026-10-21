import { auth } from './auth/firebase';
import {
  loginWithEmail,
  loginWithProvider,
  registerWithEmail,
  sendPasswordReset,
  signOutUser,
} from './auth/firebase';

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  const user = auth?.currentUser;
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;

  const response = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  if (!response.ok) return { error: 'Request failed. Please try again.' };
  return response.blob();
}

export async function authRegister(credentials) {
  return registerWithEmail(credentials);
}

export async function authLogin(credentials) {
  await loginWithEmail(credentials);
  return request('/auth/me');
}

export async function authSocialLogin(provider) {
  await loginWithProvider(provider);
  return request('/auth/me');
}

export async function authPasswordReset(email) {
  return sendPasswordReset(email);
}

export function saveProfile(body) {
  return request('/profile', { method: 'PUT', body });
}

export async function authMe() {
  if (!auth?.currentUser) return { authenticated: false, user: null };
  return request('/auth/me');
}

export async function clearAuthToken() {
  await signOutUser();
}

export function fetchUser() {
  return request('/user');
}

export function fetchCreditInfo() {
  return request('/credits/info');
}

export function fetchAIStatus() {
  return request('/ai/status');
}

export function startInterview(body) {
  return request('/interview/start', { method: 'POST', body });
}

export function evaluateAnswer(body) {
  return request('/interview/evaluate', { method: 'POST', body });
}

export function analyzeResume(body) {
  return request('/resume/analyze', { method: 'POST', body });
}

export function saveResumeConsent(granted) {
  return request('/consents/resume-ai', { method: 'PUT', body: { granted } });
}

export function fetchResumeConsent() {
  return request('/consents/resume-ai');
}

export function uploadAndAnalyzeResume(file, targetRole = '') {
  const formData = new FormData();
  formData.append('resumeFile', file);
  formData.append('targetRole', targetRole);
  return request('/resume/upload-and-analyze', { method: 'POST', body: formData, isForm: true });
}

export function chatWithAgent(body) {
  return request('/agent/chat', { method: 'POST', body });
}

export function createLiveCoachToken(body) {
  return request('/agent/live/token', { method: 'POST', body });
}

export function saveLiveCoachTranscript(body) {
  return request('/agent/live/transcript', { method: 'POST', body });
}

export function fetchCoachHistory() {
  return request('/agent/history');
}

export function fetchCoachResumeConsent() {
  return request('/consents/coach-resume-context');
}

export function saveCoachResumeConsent(granted) {
  return request('/consents/coach-resume-context', { method: 'PUT', body: { granted } });
}

export function createPaymentOrder(body) {
  return request('/payment/create-order', { method: 'POST', body });
}

export function fetchUsdInrRate() {
  return request('/payment/exchange-rate');
}

export function verifyPayment(body) {
  return request('/payment/verify', { method: 'POST', body });
}

export function fetchTransactions() {
  return request('/payment/transactions');
}

export function fetchHistory() {
  return request('/history');
}

export function exportAccountData() {
  return request('/account/export');
}

export function deleteAccount() {
  return request('/account', { method: 'DELETE' });
}

export function completeInterview(body) {
  return request('/interview/complete', { method: 'POST', body });
}

export async function downloadPDF(body) {
  const result = await request('/report/pdf', { method: 'POST', body });
  return result instanceof Blob ? result : new Blob();
}
