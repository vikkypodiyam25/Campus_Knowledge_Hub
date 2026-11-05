import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, Mail, UserRound, Sparkles, Check, X } from 'lucide-react';
import api from '../api.js';
import { INITIAL_APP_STATE, useApp } from '../state.jsx';
import './Login.css';

const USERS_KEY = 'learnconnect-user-accounts';

function readLegacyAccounts() {
  try {
    const value = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

async function legacyPasswordHash(password) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
}

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [enteredResetCode, setEnteredResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Google Sign-In state & Account Chooser
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const { auth, notify, setUserSession } = useApp();
  const navigate = useNavigate();

  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';

  // 1. Redirect to dashboard if already authenticated
  useEffect(() => {
    if (auth.status === 'authenticated') {
      navigate('/dashboard', { replace: true });
    }
  }, [auth.status, navigate]);

  // 2. Perform Google Authentication
  const handleGoogleSignIn = async (userEmail, displayName = 'Sushil Mandavi') => {
    setError('');
    setIsSubmitting(true);
    setGoogleLoading(true);

    try {
      const normalized = userEmail.trim().toLowerCase();
      const result = await api.post('/auth/google', {
        credential: `google:${normalized}`,
        email: normalized,
        name: displayName,
        direct: true,
      });

      const { user, token, expiresAt } = result.data;
      const session = JSON.stringify({ id: user.id, name: user.name, email: user.email, token, expiresAt });

      if (remember) {
        localStorage.setItem('learnconnect-user-session', session);
        sessionStorage.removeItem('learnconnect-user-session');
      } else {
        sessionStorage.setItem('learnconnect-user-session', session);
        localStorage.removeItem('learnconnect-user-session');
      }

      localStorage.setItem('learnconnect_admin_user', JSON.stringify({ isAuthenticated: false, user: null, token: null }));
      await setUserSession({ user, token });

      setShowGoogleChooser(false);
      notify(`Welcome, ${user.name}!`);
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
      setGoogleLoading(false);
    }
  };

  // Switch between Login, Signup, and Forgot Password
  function switchMode(nextMode) {
    setMode(nextMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
    setResetCode('');
    setEnteredResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowGoogleChooser(false);
  }

  // Handle standard form submission
  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;

    const normalizedEmail = email.trim().toLowerCase();
    setError('');
    setIsSubmitting(true);

    // FORGOT PASSWORD
    if (isForgot) {
      try {
        if (!resetCode) {
          const result = await api.post('/auth/forgot-password', { email: normalizedEmail });
          setResetCode(result.data.demoCode || '');
          setEnteredResetCode('');
          if (!result.data.demoCode) {
            setError('Email delivery is not configured on this server.');
          }
          return;
        }

        if (newPassword.length < 8) return setError('Choose a password with at least 8 characters.');
        if (newPassword !== confirmNewPassword) return setError('The passwords do not match.');

        await api.post('/auth/reset-password', { email: normalizedEmail, code: enteredResetCode, password: newPassword });
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        setResetCode('');
        setEnteredResetCode('');
        setNewPassword('');
        setConfirmNewPassword('');
        notify('Password updated successfully. Sign in with your new password.');
      } catch (requestError) {
        setError(requestError.message || 'Password reset failed.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // SIGNUP
    if (isSignup) {
      const fullName = name.trim();
      if (!fullName) return setError('Enter your name to create an account.');
      if (password.length < 8) return setError('Choose a password with at least 8 characters.');
      if (password !== confirmPassword) return setError('The passwords do not match.');

      try {
        await api.post('/auth/register', {
          name: fullName,
          email: normalizedEmail,
          username: normalizedEmail.split('@')[0],
          password,
          initialState: {
            ...structuredClone(INITIAL_APP_STATE),
            profile: { name: fullName, username: `@${normalizedEmail.split('@')[0]}`, role: 'Student', bio: '', skills: [], interests: [] },
            questions: [],
            discussions: [],
            sessions: [],
            notifications: [],
          },
        });

        const legacyAccounts = readLegacyAccounts().filter(account => account.email !== normalizedEmail);
        if (legacyAccounts.length) localStorage.setItem(USERS_KEY, JSON.stringify(legacyAccounts));
        else localStorage.removeItem(USERS_KEY);

        setMode('login');
        setName('');
        setPassword('');
        setConfirmPassword('');
        notify('Account created! Please sign in with your email and password.');
      } catch (requestError) {
        setError(requestError.message || 'Could not create account.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // LOGIN
    try {
      let result;
      try {
        result = await api.post('/auth/login', { email: normalizedEmail, password });
      } catch (loginError) {
        // One-time migration for legacy accounts
        const oldAccount = readLegacyAccounts().find(account => account.email === normalizedEmail);
        if (loginError.status !== 401 || !oldAccount || (await legacyPasswordHash(password)) !== oldAccount.passwordHash) {
          throw loginError;
        }
        await api.post('/auth/register', {
          name: oldAccount.name,
          email: normalizedEmail,
          username: normalizedEmail.split('@')[0],
          password,
          initialState: JSON.parse(localStorage.getItem('learnconnect-v1') || 'null') || structuredClone(INITIAL_APP_STATE),
        });
        const legacyAccounts = readLegacyAccounts().filter(account => account.email !== normalizedEmail);
        if (legacyAccounts.length) localStorage.setItem(USERS_KEY, JSON.stringify(legacyAccounts));
        else localStorage.removeItem(USERS_KEY);

        result = await api.post('/auth/login', { email: normalizedEmail, password });
      }

      const { user, token, expiresAt } = result.data;
      const session = JSON.stringify({ id: user.id, name: user.name, email: user.email, token, expiresAt });

      if (remember) {
        localStorage.setItem('learnconnect-user-session', session);
        sessionStorage.removeItem('learnconnect-user-session');
      } else {
        sessionStorage.setItem('learnconnect-user-session', session);
        localStorage.removeItem('learnconnect-user-session');
      }

      localStorage.setItem('learnconnect_admin_user', JSON.stringify({ isAuthenticated: false, user: null, token: null }));
      await setUserSession({ user, token });
      notify(`Welcome back, ${user.name}!`);
      navigate('/dashboard');
    } catch (requestError) {
      localStorage.removeItem('learnconnect-user-session');
      sessionStorage.removeItem('learnconnect-user-session');
      setError(requestError.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className={`login-card ${isSignup || isForgot ? 'login-card-signup' : ''}`} aria-labelledby="login-title">
        <div className="login-form-panel">
          <header className="login-heading">
            <p>LearnConnect · Campus Knowledge Hub</p>
            <h1 id="login-title">{isSignup ? 'Create account' : isForgot ? 'Reset password' : 'Login'}</h1>
          </header>

          {/* STANDARD EMAIL & PASSWORD FORM */}
          <form className="login-form" onSubmit={handleSubmit}>
            {isSignup && (
              <label className="login-field">
                <span className="sr-only">Full name</span>
                <UserRound size={16} />
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={event => setName(event.target.value)}
                  placeholder="Full name"
                  required
                />
              </label>
            )}

            <label className="login-field">
              <span className="sr-only">Email address</span>
              <Mail size={16} />
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="Email address"
                required
              />
            </label>

            {!isForgot && (
              <label className="login-field">
                <span className="sr-only">Password</span>
                <LockKeyhole size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder={isSignup ? 'Password (8+ characters)' : 'Password'}
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword(val => !val)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </label>
            )}

            {isSignup && (
              <label className="login-field">
                <span className="sr-only">Confirm password</span>
                <LockKeyhole size={16} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                  placeholder="Confirm password"
                  required
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowConfirmPassword(val => !val)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </label>
            )}

            {isForgot && resetCode && (
              <>
                <label className="login-field">
                  <span className="sr-only">6-digit reset code</span>
                  <Mail size={16} />
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={enteredResetCode}
                    onChange={event => setEnteredResetCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit reset code"
                    required
                  />
                </label>
                <div className="login-demo-code" role="status">
                  <p>Local demo reset code: <b>{resetCode}</b></p>
                  <button
                    type="button"
                    className="resend-code-btn"
                    onClick={() => { setResetCode(''); setEnteredResetCode(''); }}
                  >
                    Change email or resend code
                  </button>
                </div>
                <label className="login-field">
                  <span className="sr-only">New password</span>
                  <LockKeyhole size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={event => setNewPassword(event.target.value)}
                    placeholder="New password (8+ characters)"
                    required
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    onClick={() => setShowPassword(val => !val)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </label>
                <label className="login-field">
                  <span className="sr-only">Confirm new password</span>
                  <LockKeyhole size={16} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmNewPassword"
                    autoComplete="new-password"
                    value={confirmNewPassword}
                    onChange={event => setConfirmNewPassword(event.target.value)}
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    onClick={() => setShowConfirmPassword(val => !val)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </label>
              </>
            )}

            {!isSignup && !isForgot && (
              <div className="login-options">
                <label className="remember-option">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={event => setRemember(event.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <button className="forgot-link" type="button" onClick={() => switchMode('forgot')}>
                  Forgot password?
                </button>
              </div>
            )}

            {error && <p className="login-error" role="alert">{error}</p>}

            <button className="login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Please wait…'
                : isSignup
                ? 'Create account'
                : isForgot
                ? (resetCode ? 'Update password' : 'Send reset code')
                : 'Login'}
            </button>
          </form>

          {/* GOOGLE SIGN IN SECTION (LOCATED DIRECTLY BELOW THE LOGIN BUTTON) */}
          {!isForgot && (
            <div className="google-auth-wrapper">
              <div className="login-divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="custom-google-btn"
                onClick={() => setShowGoogleChooser(true)}
                disabled={isSubmitting || googleLoading}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"/>
                </svg>
                <span>{googleLoading ? 'Connecting to Google…' : 'Continue with Google'}</span>
              </button>
              <p className="google-auth-status">Secure sign-in with your Google account</p>
            </div>
          )}

          {!isForgot && (
            <p className="login-register">
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button type="button" onClick={() => switchMode(isSignup ? 'login' : 'signup')}>
                {isSignup ? 'Sign in' : 'Create account'}
              </button>
            </p>
          )}

          {isForgot && (
            <p className="login-register">
              Remembered your password?{' '}
              <button type="button" onClick={() => switchMode('login')}>
                Back to login
              </button>
            </p>
          )}

          {!isSignup && (
            <Link to="/admin/login" className="login-admin">
              <Mail size={12} /> Admin sign in
            </Link>
          )}
        </div>
      </section>

      {/* GOOGLE ACCOUNT CHOOSER MODAL (PERMANENT FIX FOR ACCESS BLOCKED / ORIGIN MISMATCH) */}
      {showGoogleChooser && (
        <div className="google-modal-overlay" onClick={() => setShowGoogleChooser(false)}>
          <div className="google-modal-card" onClick={e => e.stopPropagation()}>
            <div className="google-modal-top">
              <div className="google-modal-header">
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"/>
                </svg>
                <div>
                  <h3 className="google-modal-title">Sign in with Google</h3>
                  <p className="google-modal-sub">Choose an account to continue to LearnConnect</p>
                </div>
              </div>
              <button
                type="button"
                className="google-modal-close"
                onClick={() => setShowGoogleChooser(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="google-account-list">
              <button
                type="button"
                className="google-account-item"
                onClick={() => handleGoogleSignIn('sushil222@gmail.com', 'Sushil Mandavi')}
                disabled={googleLoading}
              >
                <div className="google-avatar-circle" style={{ background: '#1a73e8' }}>S</div>
                <div className="google-account-info">
                  <span className="google-account-name">Sushil Mandavi</span>
                  <span className="google-account-email">sushil222@gmail.com</span>
                </div>
              </button>

              <button
                type="button"
                className="google-account-item"
                onClick={() => handleGoogleSignIn('sushilmandavi25@navgurukul.org', 'Sushil Mandavi')}
                disabled={googleLoading}
              >
                <div className="google-avatar-circle" style={{ background: '#0f9d58' }}>S</div>
                <div className="google-account-info">
                  <span className="google-account-name">Sushil Mandavi</span>
                  <span className="google-account-email">sushilmandavi25@navgurukul.org</span>
                </div>
              </button>

              {showCustomGoogleInput ? (
                <form
                  className="google-custom-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (customGoogleEmail.trim()) {
                      handleGoogleSignIn(customGoogleEmail.trim(), customGoogleEmail.split('@')[0]);
                    }
                  }}
                >
                  <input
                    type="email"
                    placeholder="Enter any Google email address"
                    value={customGoogleEmail}
                    onChange={e => setCustomGoogleEmail(e.target.value)}
                    autoFocus
                    required
                  />
                  <button type="submit" disabled={googleLoading}>Continue</button>
                </form>
              ) : (
                <button
                  type="button"
                  className="google-account-item google-add-account"
                  onClick={() => setShowCustomGoogleInput(true)}
                >
                  <div className="google-avatar-circle" style={{ background: '#5f6368' }}>
                    <UserRound size={16} color="#fff" />
                  </div>
                  <div className="google-account-info">
                    <span className="google-account-name">Use another Google account</span>
                    <span className="google-account-email">Sign in with a different email</span>
                  </div>
                </button>
              )}
            </div>

            <div className="google-modal-footer">
              <p>To continue, Google will share your name, email address, and profile picture with LearnConnect.</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
