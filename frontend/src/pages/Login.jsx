import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useApp } from '../state.jsx';
import { DEMO_ADMIN_ACCOUNTS, DEMO_ADMIN_PASSWORD } from '../data/demoAdminAccounts.js';
import './Login.css';

const USERS_KEY = 'learnconnect-user-accounts';

function readAccounts() {
  try {
    const accounts = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return Array.isArray(accounts) ? accounts : [];
  } catch {
    return [];
  }
}

async function hashPassword(password) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
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
  const [resetCreatedAt, setResetCreatedAt] = useState(0);
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { notify, update } = useApp();
  const navigate = useNavigate();
  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';

  async function handleSubmit(event) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const adminAccount = DEMO_ADMIN_ACCOUNTS[normalizedEmail];

    if (isForgot) {
      if (!resetCode) {
        if (adminAccount) return setError('Admin password recovery must be handled by your system administrator.');
        const account = readAccounts().find(item => item.email === normalizedEmail);
        if (!account) return setError('No account found for this email. Check the address or create an account.');
        const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
        setResetCode(code);
        setResetCreatedAt(Date.now());
        setEnteredResetCode('');
        setError('');
        return;
      }

      if (Date.now() - resetCreatedAt > 5 * 60 * 1000) {
        setResetCode('');
        setError('The reset code expired. Request a new one.');
        return;
      }
      if (enteredResetCode !== resetCode) return setError('That reset code is incorrect.');
      if (newPassword.length < 8) return setError('Choose a password with at least 8 characters.');
      if (newPassword !== confirmNewPassword) return setError('The passwords do not match.');
      const accounts = readAccounts();
      const accountIndex = accounts.findIndex(item => item.email === normalizedEmail);
      if (accountIndex < 0) return setError('Account not found. Please create an account first.');
      accounts[accountIndex] = { ...accounts[accountIndex], passwordHash: await hashPassword(newPassword), passwordUpdatedAt: new Date().toISOString() };
      localStorage.setItem(USERS_KEY, JSON.stringify(accounts));
      setMode('login');
      setPassword('');
      setConfirmPassword('');
      setResetCode('');
      setEnteredResetCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setError('');
      notify('Password updated. Sign in with your new password.');
      return;
    }

    if (isSignup) {
      const fullName = name.trim();
      if (!fullName) return setError('Enter your name to create an account.');
      if (adminAccount) return setError('This email is reserved for admin sign-in.');
      if (password.length < 8) return setError('Choose a password with at least 8 characters.');
      if (password !== confirmPassword) return setError('The passwords do not match.');

      const accounts = readAccounts();
      if (accounts.some(account => account.email === normalizedEmail)) {
        return setError('An account with this email already exists. Please sign in.');
      }

      const passwordHash = await hashPassword(password);
      accounts.push({ id: `user_${Date.now()}`, name: fullName, email: normalizedEmail, passwordHash, createdAt: new Date().toISOString() });
      localStorage.setItem(USERS_KEY, JSON.stringify(accounts));
      setError('');
      setMode('login');
      setName('');
      setPassword('');
      setConfirmPassword('');
      notify('Account created. Sign in with your email and password.');
      return;
    }

    if (adminAccount) {
      if (password !== DEMO_ADMIN_PASSWORD) return setError('The password for this administrator account is incorrect.');
      const user = {
        id: 'admin_001',
        name: adminAccount.name,
        email: normalizedEmail,
        role: adminAccount.role,
        title: `${adminAccount.role} · LearnConnect`,
        platform: 'LearnConnect',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        lastLogin: new Date().toISOString(),
      };
      localStorage.setItem('learnconnect_admin_user', JSON.stringify({ isAuthenticated: true, user, token: `learnconnect-admin-session:${Date.now()}` }));
      localStorage.removeItem('learnconnect-user-session');
      sessionStorage.removeItem('learnconnect-user-session');
      window.location.assign('/admin/dashboard');
      return;
    }

    const account = readAccounts().find(item => item.email === normalizedEmail);
    if (!account) return setError('No account found for this email. Create an account first.');
    if (await hashPassword(password) !== account.passwordHash) return setError('Email or password is incorrect.');

    const session = JSON.stringify({ id: account.id, name: account.name, email: account.email, signedInAt: new Date().toISOString() });
    if (remember) {
      localStorage.setItem('learnconnect-user-session', session);
      sessionStorage.removeItem('learnconnect-user-session');
    } else {
      sessionStorage.setItem('learnconnect-user-session', session);
      localStorage.removeItem('learnconnect-user-session');
    }
    localStorage.setItem('learnconnect_admin_user', JSON.stringify({ isAuthenticated: false, user: null, token: null }));
    update('profile', profile => ({ ...profile, name: account.name, username: `@${account.email.split('@')[0]}`, role: 'Student' }));
    setError('');
    notify(`Welcome, ${account.name}!`);
    navigate('/dashboard');
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
    <section className={`login-card ${isSignup ? 'login-card-signup' : ''}`} aria-labelledby="login-title">
      <div className="login-form-panel">
          <header className="login-heading"><p>LearnConnect · Campus Knowledge Hub</p><h1 id="login-title">{isSignup ? 'Create account' : isForgot ? 'Reset password' : 'Login'}</h1></header>
        <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
          {isSignup && <label className="login-field">
            <span className="sr-only">Full name</span><UserRound size={16} aria-hidden="true" />
            <input type="text" autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Full name" required />
          </label>}
          <label className="login-field">
            <span className="sr-only">Email address</span><Mail size={16} aria-hidden="true" />
            <input type="email" name="learnconnect-email-entry" autoComplete="off" readOnly={!fieldsEnabled} onFocus={() => setFieldsEnabled(true)} value={email} onChange={event => setEmail(event.target.value)} placeholder="Email address" required />
          </label>
          {!isForgot && <label className="login-field">
            <span className="sr-only">Password</span><LockKeyhole size={16} aria-hidden="true" />
            <input type={showPassword ? 'text' : 'password'} name={isSignup ? 'learnconnect-new-password' : 'learnconnect-password-entry'} autoComplete="off" readOnly={!fieldsEnabled} onFocus={() => setFieldsEnabled(true)} value={password} onChange={event => setPassword(event.target.value)} placeholder={isSignup ? 'Password (8+ characters)' : 'Password'} required />
            <button className="password-toggle" type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}</button>
          </label>}
          {isSignup && <label className="login-field">
            <span className="sr-only">Confirm password</span><LockKeyhole size={16} aria-hidden="true" />
            <input type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="Confirm password" required />
          </label>}
          {isForgot && resetCode && <>
            <label className="login-field"><span className="sr-only">6-digit reset code</span><Mail size={16}/><input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={enteredResetCode} onChange={event => setEnteredResetCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit reset code" required /></label>
            <p className="login-demo-code" role="status">Demo reset code: <b>{resetCode}</b><br/>For email delivery, a backend is required.</p>
            <label className="login-field"><span className="sr-only">New password</span><LockKeyhole size={16}/><input type="password" autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} placeholder="New password (8+ characters)" required /></label>
            <label className="login-field"><span className="sr-only">Confirm new password</span><LockKeyhole size={16}/><input type="password" autoComplete="new-password" value={confirmNewPassword} onChange={event => setConfirmNewPassword(event.target.value)} placeholder="Confirm new password" required /></label>
          </>}
          {!isSignup && !isForgot && <div className="login-options">
            <label className="remember-option"><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} /> <span>Remember me</span></label>
            <button className="forgot-link" type="button" onClick={() => switchMode('forgot')}>Forgot password?</button>
          </div>}
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="login-submit" type="submit">{isSignup ? 'Create account' : isForgot ? (resetCode ? 'Update password' : 'Send reset code') : 'Login'}</button>
        </form>
        {!isForgot && <p className="login-register">{isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" onClick={() => switchMode(isSignup ? 'login' : 'signup')}>{isSignup ? 'Sign in' : 'Create account'}</button>
        </p>}
        {isForgot && <p className="login-register">Remembered it? <button type="button" onClick={() => switchMode('login')}>Back to login</button></p>}
        {!isSignup && <Link to="/admin/login" className="login-admin"><Mail size={12}/> Admin sign in</Link>}
      </div>
    </section>
  </main>;
}
