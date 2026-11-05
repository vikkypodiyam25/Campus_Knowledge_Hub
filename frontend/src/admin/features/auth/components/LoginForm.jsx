import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react';
import { validateEmail, validatePassword } from '../../../utils/validators.js';
import { useAdminAuth } from '../../../hooks/useAdminAuth.js';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password, 6);
    if (emailError || passwordError) { setErrors({ email: emailError, password: passwordError }); return; }
    setErrors({});
    setLoading(true);
    try { if (await login(email.trim(), password)) navigate('/admin/dashboard'); }
    finally { setLoading(false); }
  }

  return <div className="admin-login-stack">
    <form onSubmit={submit} className="admin-login-form">
      <label className="admin-login-field">
        <span className="sr-only">Admin email</span><UserRound size={17}/>
        <input type="email" placeholder="Admin email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required />
      </label>
      {errors.email && <p className="admin-login-error">{errors.email}</p>}
      <label className="admin-login-field">
        <span className="sr-only">Password</span><LockKeyhole size={17}/>
        <input type={showPassword ? 'text' : 'password'} placeholder="Password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required />
        <button className="admin-password-toggle" type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
      </label>
      {errors.password && <p className="admin-login-error">{errors.password}</p>}
      <div className="admin-login-options">
        <label><input type="checkbox" defaultChecked/> Remember me</label>
        <span>Contact your system administrator if you need access help.</span>
      </div>
      <button className="admin-login-submit" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in to Dashboard'}</button>
    </form>
    <Link to="/login" className="admin-login-user">Go to student login</Link>
  </div>;
}
