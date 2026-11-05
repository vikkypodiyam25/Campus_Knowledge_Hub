import React from 'react';
import { ArrowUpRight, BookOpenCheck, GraduationCap, LockKeyhole, ShieldCheck, UsersRound } from 'lucide-react';
import LoginForm from '../components/LoginForm.jsx';

const highlights = [
  { icon: UsersRound, title: 'Community overview', detail: 'Keep campus learning spaces organized.' },
  { icon: BookOpenCheck, title: 'Learning operations', detail: 'Review content, assignments and sessions.' },
  { icon: ShieldCheck, title: 'Protected workspace', detail: 'Administrative tools in one secure place.' },
];

export default function AdminLogin() {
  return <main className="admin-login-page">
    <div className="admin-login-frame">
      <section className="admin-login-story" aria-label="Campus Knowledge Hub administration">
        <header className="admin-login-brand">
          <span className="admin-login-brand-icon"><GraduationCap size={23} strokeWidth={1.8}/></span>
          <span><strong>Campus Knowledge Hub</strong><small>ADMINISTRATION</small></span>
        </header>

        <div className="admin-login-story-copy">
          <span className="admin-login-eyebrow"><span/> CAMPUS OPERATIONS</span>
          <h1>Make room for<br/><em>better learning.</em></h1>
          <p>Your control center for the people, conversations and learning activity that make the campus community work.</p>
          <div className="admin-login-highlights">
            {highlights.map(({ icon: Icon, title, detail }) => <article key={title}>
              <span className="admin-login-highlight-icon"><Icon size={17}/></span>
              <span><strong>{title}</strong><small>{detail}</small></span>
              <ArrowUpRight className="admin-login-highlight-arrow" size={15}/>
            </article>)}
          </div>
        </div>

        <footer className="admin-login-story-footer"><span>LEARNCONNECT · ADMIN CONSOLE</span><span>BUILT FOR CAMPUS COMMUNITIES</span></footer>
      </section>

      <section className="admin-login-panel" aria-labelledby="admin-login-title">
        <div className="admin-login-panel-top"><span className="admin-login-panel-mark"><LockKeyhole size={16}/></span><span>ADMIN ACCESS</span><span className="admin-login-online"><i/> SYSTEM READY</span></div>
        <div className="admin-login-heading">
          <p className="admin-login-kicker">WELCOME BACK</p>
          <h2 id="admin-login-title">Sign in to your<br/>workspace</h2>
          <p>Enter your administrator credentials to continue.</p>
        </div>
        <LoginForm />
        <div className="admin-login-foot"><ShieldCheck size={15}/> Your administrator session is protected</div>
        <div className="admin-login-panel-bottom"><span>Need access help?</span><span>Contact your system administrator</span></div>
      </section>
    </div>
  </main>;
}
