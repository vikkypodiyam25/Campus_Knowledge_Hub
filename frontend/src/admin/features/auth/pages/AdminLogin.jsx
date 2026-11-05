import React from 'react';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import LoginForm from '../components/LoginForm.jsx';

export default function AdminLogin() {
  return <main className="admin-login-page">
    <section className="admin-login-card" aria-labelledby="admin-login-title">
      <header className="admin-login-heading">
        <div className="admin-login-mark"><GraduationCap size={21}/></div>
        <p className="admin-login-kicker">CAMPUS KNOWLEDGE HUB</p>
        <h1 id="admin-login-title">Admin Login</h1>
        <p>Sign in to manage your LearnConnect community.</p>
      </header>
      <LoginForm />
      <div className="admin-login-foot"><ShieldCheck size={14}/> Protected administrator access</div>
    </section>
  </main>;
}
