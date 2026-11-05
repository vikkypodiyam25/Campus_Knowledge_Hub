import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { validateEmail, validatePassword } from '../../../utils/validators.js';
import { useAdminAuth } from '../../../hooks/useAdminAuth.js';
import { ROLES } from '../../../utils/constants.js';

const demoAccounts = [
  { role: ROLES.SUPER_ADMIN, email: 'vikkypodiyam25@navgurukul.org', label: 'Super Admin', access: 'Full access' },
  { role: ROLES.ADMIN, email: 'admin.staff@campus.edu', label: 'Admin', access: 'Standard' },
  { role: ROLES.MODERATOR, email: 'moderator.lead@campus.edu', label: 'Moderator', access: 'Reports only' },
];

export default function LoginForm() {
  const [email, setEmail] = useState(demoAccounts[0].email);
  const [password, setPassword] = useState('Admin@123456');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const { login, setRole } = useAdminAuth();
  const navigate = useNavigate();

  function submit(event) {
    event.preventDefault();
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password, 6);
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const account = demoAccounts.find(item => item.email.toLowerCase() === email.trim().toLowerCase());
      if (account) setRole(account.role);
      if (login(email.trim(), password, account?.role)) navigate('/admin/dashboard');
    } finally {
      setLoading(false);
    }
  }

  function selectAccount(account) {
    setEmail(account.email);
    setPassword('Admin@123456');
    setRole(account.role);
    setMessage('');
  }

  return <form onSubmit={submit} className="admin-login-form">
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
      <button type="button" onClick={() => setMessage('Use the demo password below, or contact your campus administrator.')}>Forgot password?</button>
    </div>
    {message && <p className="admin-login-message" role="status">{message}</p>}
    <button className="admin-login-submit" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in to Dashboard'}</button>
    <div className="admin-demo-accounts">
      <p>Choose a demo role</p>
      <div className="admin-demo-grid">{demoAccounts.map(account => <button type="button" key={account.email} onClick={() => selectAccount(account)}><strong>{account.label}</strong><span>{account.access}</span></button>)}</div>
      <small>Demo password: <b>Admin@123456</b></small>
    </div>
    <Link to="/login" className="admin-login-user"><Mail size={13}/> Go to user login</Link>
  </form>;
}
