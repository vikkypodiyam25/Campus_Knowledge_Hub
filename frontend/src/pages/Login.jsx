import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import api from '../api.js';
import { INITIAL_APP_STATE, useApp } from '../state.jsx';
import './Login.css';

const USERS_KEY = 'learnconnect-user-accounts';
function readLegacyAccounts() {
  try { const value = JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
async function legacyPasswordHash(password) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
}

export default function Login() {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldsEnabled, setFieldsEnabled] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [enteredResetCode, setEnteredResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const googleButtonRef = useRef(null);
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { notify, setUserSession } = useApp();
  const navigate = useNavigate();
  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!googleClientId || isForgot) return undefined;
    let active = true;
    const renderButton = () => {
      if (!active || !window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          setError('');
          setIsSubmitting(true);
          try {
            const result = await api.post('/auth/google', { credential });
            const { user, token, expiresAt } = result.data;
            const session = JSON.stringify({ id: user.id, name: user.name, email: user.email, token, expiresAt });
            localStorage.setItem('learnconnect-user-session', session);
            sessionStorage.removeItem('learnconnect-user-session');
            localStorage.setItem('learnconnect_admin_user', JSON.stringify({ isAuthenticated: false, user: null, token: null }));
            await setUserSession({ user, token });
            notify(`Welcome, ${user.name}!`);
            navigate('/dashboard');
          } catch (requestError) {
            setError(requestError.message || 'Google sign-in failed. Please try again.');
          } finally { setIsSubmitting(false); }
        },
      });
      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.renderButton(googleButtonRef.current, { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: 280 });
      setGoogleReady(true);
    };
    let script = document.querySelector('script[data-google-identity]');
    if (window.google?.accounts?.id) renderButton();
    else {
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.dataset.googleIdentity = 'true';
        document.head.appendChild(script);
      }
      script.addEventListener('load', renderButton);
      script.addEventListener('error', () => active && setError('Could not load Google sign-in. Check your internet connection.'));
    }
    return () => { active = false; };
  }, [googleClientId, isForgot]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    const normalizedEmail = email.trim().toLowerCase();
    setError('');
    setIsSubmitting(true);

    if (isForgot) {
      try {
        if (!resetCode) {
          const result = await api.post('/auth/forgot-password', { email: normalizedEmail });
          setResetCode(result.data.demoCode || '');
          setEnteredResetCode('');
          if (!result.data.demoCode) setError('Email delivery is not configured on this server.');
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
        notify('Password updated. Sign in with your new password.');
      } catch (requestError) { setError(requestError.message); }
      finally { setIsSubmitting(false); }
      return;
    }

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
            questions: [], discussions: [], sessions: [], notifications: [],
          },
        });
        const legacyAccounts = readLegacyAccounts().filter(account => account.email !== normalizedEmail);
        if (legacyAccounts.length) localStorage.setItem(USERS_KEY, JSON.stringify(legacyAccounts));
        else localStorage.removeItem(USERS_KEY);
        setMode('login');
        setName('');
        setPassword('');
        setConfirmPassword('');
        notify('Account created. Sign in with your email and password.');
      } catch (requestError) { setError(requestError.message); }
      finally { setIsSubmitting(false); }
      return;
    }

    try {
      let result;
      try {
        result = await api.post('/auth/login', { email: normalizedEmail, password });
      } catch (loginError) {
        // One-time migration for accounts created by the earlier local-only login page.
        const oldAccount = readLegacyAccounts().find(account => account.email === normalizedEmail);
        if (loginError.status !== 401 || !oldAccount || await legacyPasswordHash(password) !== oldAccount.passwordHash) throw loginError;
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
      notify(`Welcome, ${user.name}!`);
      navigate('/dashboard');
    } catch (requestError) {
      localStorage.removeItem('learnconnect-user-session');
      sessionStorage.removeItem('learnconnect-user-session');
      setError(requestError.message);
    } finally { setIsSubmitting(false); }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setFieldsEnabled(false);
    setError('');
    setPassword('');
    setConfirmPassword('');
    setResetCode('');
    setEnteredResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
  }

  return <main className="login-page">
    <section className={`login-card ${isSignup || isForgot ? 'login-card-signup' : ''}`} aria-labelledby="login-title">
      <div className="login-form-panel">
        <header className="login-heading"><p>LearnConnect · Campus Knowledge Hub</p><h1 id="login-title">{isSignup ? 'Create account' : isForgot ? 'Reset password' : 'Login'}</h1></header>
        {!isForgot && googleClientId && <div className="google-auth"><div ref={googleButtonRef} className="google-button"/><p>{googleReady ? 'Secure sign-in with your Google account' : 'Loading Google sign-in…'}</p></div>}
        {!isForgot && !googleClientId && <p className="google-config-note">Google sign-in needs a Web OAuth Client ID in the app configuration.</p>}
        <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
          {isSignup && <label className="login-field"><span className="sr-only">Full name</span><UserRound size={16}/><input type="text" autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Full name" required/></label>}
          <label className="login-field"><span className="sr-only">Email address</span><Mail size={16}/><input type="email" name="learnconnect-email-entry" autoComplete="off" readOnly={!fieldsEnabled} onFocus={() => setFieldsEnabled(true)} value={email} onChange={event => setEmail(event.target.value)} placeholder="Email address" required/></label>
          {!isForgot && <label className="login-field"><span className="sr-only">Password</span><LockKeyhole size={16}/><input type={showPassword ? 'text' : 'password'} name={isSignup ? 'learnconnect-new-password' : 'learnconnect-password-entry'} autoComplete="off" readOnly={!fieldsEnabled} onFocus={() => setFieldsEnabled(true)} value={password} onChange={event => setPassword(event.target.value)} placeholder={isSignup ? 'Password (8+ characters)' : 'Password'} required/><button className="password-toggle" type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}</button></label>}
          {isSignup && <label className="login-field"><span className="sr-only">Confirm password</span><LockKeyhole size={16}/><input type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Confirm password" required/></label>}
          {isForgot && resetCode && <>
            <label className="login-field"><span className="sr-only">6-digit reset code</span><Mail size={16}/><input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={enteredResetCode} onChange={event => setEnteredResetCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit reset code" required/></label>
            <p className="login-demo-code" role="status">Local demo code: <b>{resetCode}</b><br/>Email delivery needs an email service.</p>
            <label className="login-field"><span className="sr-only">New password</span><LockKeyhole size={16}/><input type="password" autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} placeholder="New password (8+ characters)" required/></label>
            <label className="login-field"><span className="sr-only">Confirm new password</span><LockKeyhole size={16}/><input type="password" autoComplete="new-password" value={confirmNewPassword} onChange={event => setConfirmNewPassword(event.target.value)} placeholder="Confirm new password" required/></label>
          </>}
          {!isSignup && !isForgot && <div className="login-options"><label className="remember-option"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)}/><span>Remember me</span></label><button className="forgot-link" type="button" onClick={() => switchMode('forgot')}>Forgot password?</button></div>}
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : isSignup ? 'Create account' : isForgot ? (resetCode ? 'Update password' : 'Send reset code') : 'Login'}</button>
        </form>
        {!isForgot && <p className="login-register">{isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}<button type="button" onClick={() => switchMode(isSignup ? 'login' : 'signup')}>{isSignup ? 'Sign in' : 'Create account'}</button></p>}
        {isForgot && <p className="login-register">Remembered it? <button type="button" onClick={() => switchMode('login')}>Back to login</button></p>}
        {!isSignup && <Link to="/admin/login" className="login-admin"><Mail size={12}/> Admin sign in</Link>}
      </div>
    </section>
  </main>;
}
