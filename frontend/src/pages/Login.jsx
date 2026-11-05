import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { ArrowUpRight, BookOpen, BriefcaseBusiness, Code2, Eye, EyeOff, Landmark, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound, UsersRound } from 'lucide-react';
import api from '../api.js';
import { INITIAL_APP_STATE, useApp } from '../state.jsx';
import { CURRICULA } from '../data/curricula.js';
import './Login.css';

const USERS_KEY = 'learnconnect-user-accounts';
const SCHOOL_ICONS = { programming: Code2, business: BriefcaseBusiness, finance: Landmark };
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
  const [selectedSchool, setSelectedSchool] = useState(() => {
    const savedSchool = localStorage.getItem('learnconnect-pending-school');
    return CURRICULA[savedSchool] ? savedSchool : '';
  });
  const [password, setPassword] = useState('');
  const [fieldsEnabled, setFieldsEnabled] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [enteredResetCode, setEnteredResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { notify, setUserSession } = useApp();
  const navigate = useNavigate();
  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  async function handleGoogleSuccess(response) {
    if (!selectedSchool) { setError('Choose your school before continuing with Google.'); return; }
    if (!response.credential) { setError('Google did not return an ID token. Please try again.'); return; }
    setError('');
    setIsSubmitting(true);
    try {
      const result = await api.post('/auth/google', { credential: response.credential });
      const { user, admin, role, token, expiresAt } = result.data;
      if (role === 'admin' && admin) {
        localStorage.removeItem('learnconnect-user-session');
        sessionStorage.removeItem('learnconnect-user-session');
        localStorage.setItem('learnconnect_admin_user', JSON.stringify({ isAuthenticated: true, user: admin, token, expiresAt }));
        notify(`Welcome, ${admin.name}!`);
        navigate('/admin/dashboard');
        return;
      }
      const session = JSON.stringify({ id: user.id, name: user.name, email: user.email, token, expiresAt });
      if (remember) { localStorage.setItem('learnconnect-user-session', session); sessionStorage.removeItem('learnconnect-user-session'); }
      else { sessionStorage.setItem('learnconnect-user-session', session); localStorage.removeItem('learnconnect-user-session'); }
      localStorage.setItem('learnconnect_admin_user', JSON.stringify({ isAuthenticated: false, user: null, token: null }));
      localStorage.setItem('learnconnect-pending-school', selectedSchool);
      await api.post('/schools/select', { schoolCode: CURRICULA[selectedSchool].code });
      await setUserSession({ user: { ...user, profile: { ...(user.profile || {}), subject: selectedSchool, selectedSchool: CURRICULA[selectedSchool].code, selectedSchoolId: selectedSchool } }, token });
      notify(`Welcome, ${user.name}!`);
      navigate('/dashboard');
    } catch (requestError) {
      localStorage.removeItem('learnconnect-user-session');
      sessionStorage.removeItem('learnconnect-user-session');
      setError(requestError.message || 'Google sign-in failed. Please try again.');
    } finally { setIsSubmitting(false); }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    if (!isForgot && !selectedSchool) {
      setError('Choose your school before continuing.');
      return;
    }
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
            profile: { name: fullName, username: `@${normalizedEmail.split('@')[0]}`, role: 'Student', bio: '', skills: [], interests: [], subject: selectedSchool, selectedSchool: CURRICULA[selectedSchool].code, selectedSchoolId: selectedSchool },
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
      await api.post('/schools/select', { schoolCode: CURRICULA[selectedSchool].code });
      await setUserSession({ user: { ...user, profile: { ...(user.profile || {}), subject: selectedSchool, selectedSchool: CURRICULA[selectedSchool].code, selectedSchoolId: selectedSchool } }, token });
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
    <div className="login-layout">
      <aside className="login-story">
        <div className="login-story-brand"><span><Sparkles size={19}/></span><b>learn<span>connect</span></b><small>CAMPUS KNOWLEDGE HUB</small></div>
        <div className="login-story-copy">
          <span className="login-kicker"><i/> YOUR CAMPUS LEARNING SPACE</span>
          <h2>Learn something.<br/><em>Share everything.</em></h2>
          <p>Explore your school, pick up new skills, and learn alongside your campus community.</p>
          <div className="login-feature-stack">
            <div className="login-feature"><span className="feature-icon feature-violet"><BookOpen size={17}/></span><span><b>Find your learning path</b><small>Programming · Business · Finance</small></span><ArrowUpRight size={15}/></div>
            <div className="login-feature"><span className="feature-icon feature-mint"><UsersRound size={17}/></span><span><b>Learn with your campus</b><small>Share notes, ask questions, grow</small></span><ArrowUpRight size={15}/></div>
          </div>
          <div className="login-school-preview" aria-label="Explore schools: Programming, Business and Finance">
            <span className="school-preview-label">EXPLORE YOUR SCHOOL</span>
            <div className="school-preview-list"><span className="school-chip school-chip-code"><i>&lt;/&gt;</i> Programming</span><span className="school-chip school-chip-business"><i>↗</i> Business</span><span className="school-chip school-chip-finance"><i>₹</i> Finance</span></div>
          </div>
        </div>
        <div className="login-story-foot"><ShieldCheck size={15}/> Your learning space, ready when you are.</div>
        <span className="login-decoration login-decoration-one"/><span className="login-decoration login-decoration-two"/>
      </aside>

      <section className={`login-card ${isSignup || isForgot ? 'login-card-signup' : ''}`} aria-labelledby="login-title">
      <div className="login-form-panel">
        <header className="login-heading"><span className="login-form-mark"><Sparkles size={16}/></span><p>{isSignup ? 'JOIN THE COMMUNITY' : isForgot ? 'ACCOUNT RECOVERY' : 'WELCOME BACK'}</p><h1 id="login-title">{isSignup ? 'Create your account' : isForgot ? 'Reset your password' : 'Sign in to your account'}</h1><small>{isSignup ? 'One account, a whole campus of possibility.' : isForgot ? 'We’ll help you get back into your learning space.' : 'Your campus learning community is waiting.'}</small></header>
        {!isForgot && <section className="login-school-picker" aria-label="Choose your school">
          <div className="login-school-picker-heading"><span>CHOOSE A SCHOOL</span><small>Your dashboard will open this curriculum</small></div>
          <div className="login-school-options">{Object.values(CURRICULA).map(school => {
            const Icon = SCHOOL_ICONS[school.id];
            const active = selectedSchool === school.id;
            return <button key={school.id} type="button" className={`login-school-option school-option-${school.id} ${active ? 'is-selected' : ''}`} onClick={() => { setSelectedSchool(school.id); localStorage.setItem('learnconnect-pending-school', school.id); setError(''); }} aria-pressed={active}>
              <Icon size={17}/><span><b>{school.code}</b><small>{school.shortName}</small></span>{active && <i aria-hidden="true">✓</i>}
            </button>;
          })}</div>
          {selectedSchool && <p className="login-school-selected"><BookOpen size={13}/> {CURRICULA[selectedSchool].name} curriculum selected</p>}
        </section>}
        {!isForgot && googleClientId && <div className="google-auth">{isSubmitting ? <p role="status">Finishing secure sign-in…</p> : <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google sign-in was cancelled or could not be completed.')} text="continue_with" shape="pill" width="280" useOneTap={false}/>}<p>Secure sign-in with your Google account</p></div>}
        {!isForgot && !googleClientId && <div className="google-auth"><button className="google-unconfigured" type="button" disabled><b>G</b>Continue with Google</button><p>Add your Google Web Client ID to frontend/.env to enable Google sign-in.</p></div>}
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
    </div>
  </main>;
}
