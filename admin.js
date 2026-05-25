import { supabase } from './supabase.js';

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const loginForm    = document.getElementById('login-form');
const emailInput   = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMsg     = document.getElementById('error-msg');
const loginBtn     = document.getElementById('login-btn');

// ─── Rate-limiting — lock out after MAX_ATTEMPTS failures ─────────────────────
const MAX_ATTEMPTS    = 5;
const LOCKOUT_MS      = 60_000; // 1 minute
let   failedAttempts  = 0;
let   lockoutUntil    = 0;

function isLockedOut() {
  return Date.now() < lockoutUntil;
}

function getRemainingLockoutSecs() {
  return Math.ceil((lockoutUntil - Date.now()) / 1000);
}

function showError(message) {
  if (!errorMsg) return;
  errorMsg.textContent    = message;
  errorMsg.style.display  = 'block';
}

function clearError() {
  if (!errorMsg) return;
  errorMsg.textContent    = '';
  errorMsg.style.display  = 'none';
}

function setLoading(loading) {
  if (!loginBtn) return;
  loginBtn.disabled   = loading;
  loginBtn.innerHTML  = loading
    ? '<span>Verifying…</span>'
    : '<span>Initialize Access</span>';
}

// ─── Redirect if already logged in ───────────────────────────────────────────
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) window.location.href = 'dashboard.html';
}

checkSession();

// ─── Login form ───────────────────────────────────────────────────────────────
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  // Check lockout
  if (isLockedOut()) {
    showError(`Too many failed attempts. Please wait ${getRemainingLockoutSecs()} seconds.`);
    return;
  }

  const email    = emailInput?.value    ?? '';
  const password = passwordInput?.value ?? '';

  if (!email || !password) {
    showError('Please enter your email and password.');
    return;
  }

  setLoading(true);

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    failedAttempts += 1;

    if (failedAttempts >= MAX_ATTEMPTS) {
      lockoutUntil   = Date.now() + LOCKOUT_MS;
      failedAttempts = 0;
      showError(`Too many failed attempts. Access locked for 60 seconds.`);

      // Countdown feedback
      const countdown = setInterval(() => {
        if (!isLockedOut()) {
          clearInterval(countdown);
          clearError();
          setLoading(false);
        } else {
          showError(`Too many failed attempts. Please wait ${getRemainingLockoutSecs()} seconds.`);
        }
      }, 1000);
    } else {
      const remaining = MAX_ATTEMPTS - failedAttempts;
      showError(`${error.message} (${remaining} attempt${remaining !== 1 ? 's' : ''} remaining)`);
      setLoading(false);
    }
  } else {
    // Success — reset counter and redirect
    failedAttempts = 0;
    window.location.href = 'dashboard.html';
  }
});
