import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { ArrowUpRight, ArrowRight, BookOpen, BriefcaseBusiness, Code2, Eye, EyeOff, Landmark, LockKeyhole, Mail, ShieldCheck, Sparkles, UserRound, UsersRound, MessageCircle, CalendarDays, CheckCircle2, Compass, GraduationCap, Clock3, Flame, CircleHelp, Play, Pause, Radio, Star, Layers3, Search, X, Menu, Moon, Sun } from 'lucide-react';
import api from '../api.js';
import GoogleAuthContext from '../googleAuthContext.js';
import { INITIAL_APP_STATE, useApp } from '../state.jsx';
import { CURRICULA } from '../data/curricula.js';
import './Login.css';
import './LoginArtDirection.css';

const USERS_KEY = 'learnconnect-user-accounts';
const DEMO_PROGRESS_KEY = 'campus-hub-learning-preview-progress';
const SCHOOL_ICONS = { programming: Code2, business: BriefcaseBusiness, finance: Landmark };
const LEARNING_DEMOS = {
  programming: { label: 'Programming', code: 'SOP', module: 'Web foundations', lesson: 'Build a responsive page', steps: ['HTML structure', 'Responsive CSS', 'Add interaction'], sample: '<section class="hero">\n  <h1>Start building</h1>\n  <button>Explore paths</button>\n</section>', progress: 42, challenges: [
    { question: 'What helps a page adapt to different screen sizes?', options: ['A CSS media query', 'A console message', 'An extra line break'], answer: 0, explanation: 'Media queries let styles respond to screen width.' },
    { question: 'Which HTML element is best for the main page heading?', options: ['<h1>', '<span>', '<footer>'], answer: 0, explanation: 'Use one clear h1 for the primary heading of a page.' },
    { question: 'What makes a button respond when clicked?', options: ['An event handler', 'A font size', 'A margin value'], answer: 0, explanation: 'An event handler runs code in response to a click.' },
  ] },
  business: { label: 'Business', code: 'SOB', module: 'Digital marketing', lesson: 'Shape a campaign', steps: ['Know your audience', 'Choose the offer', 'Measure results'], sample: 'Audience  →  Offer\n        ↓\n     Campaign  →  Insights', progress: 58, challenges: [
    { question: 'What should guide the message of a campaign first?', options: ['The target audience', 'The logo size', 'The posting time'], answer: 0, explanation: 'A campaign starts with the people it needs to reach.' },
    { question: 'Which metric best shows whether people take action?', options: ['Conversion rate', 'Font choice', 'Number of colors'], answer: 0, explanation: 'Conversion rate measures the share of people who complete the intended action.' },
    { question: 'What is a useful next step after a campaign?', options: ['Review the results', 'Delete the data', 'Repeat without changes'], answer: 0, explanation: 'Reviewing results helps you learn what worked and improve the next campaign.' },
  ] },
  finance: { label: 'Finance', code: 'SOF', module: 'Financial basics', lesson: 'Make a simple budget', steps: ['Track income', 'Plan expenses', 'Review the balance'], sample: 'Income         INR 24,000\nEssentials     INR 12,000\nSavings        INR  4,000\nBalance        INR  8,000', progress: 31, challenges: [
    { question: 'After INR 12,000 essentials and INR 4,000 savings, what remains from INR 24,000?', options: ['INR 4,000', 'INR 8,000', 'INR 12,000'], answer: 1, explanation: 'INR 24,000 minus INR 12,000 minus INR 4,000 leaves INR 8,000.' },
    { question: 'What is a budget mainly used for?', options: ['Planning income and spending', 'Guaranteeing profit', 'Avoiding all expenses'], answer: 0, explanation: 'A budget helps plan how money comes in and where it goes.' },
    { question: 'Which is usually a fixed expense?', options: ['Monthly rent', 'A surprise repair', 'A one-time gift'], answer: 0, explanation: 'Rent is commonly a recurring amount that stays similar each month.' },
  ] },
};
function readLegacyAccounts() {
  try { const value = JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
}
function readDemoProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(DEMO_PROGRESS_KEY) || '{}');
    return { completed: Array.isArray(saved.completed) ? saved.completed : [], streak: Number(saved.streak) || 0, lastActive: saved.lastActive || '' };
  } catch { return { completed: [], streak: 0, lastActive: '' }; }
}
function getLocalDateKey(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
async function legacyPasswordHash(password) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, '0')).join('');
}

export default function Login({ standalone = false, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
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
  const [topicQuery, setTopicQuery] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('campus-hub-theme') !== 'light');
  const [demoTopic, setDemoTopic] = useState('programming');
  const [demoStats, setDemoStats] = useState(readDemoProgress);
  const [demoCompleted, setDemoCompleted] = useState(() => readDemoProgress().completed.includes('programming'));
  const [demoAnswer, setDemoAnswer] = useState(null);
  const [demoChecked, setDemoChecked] = useState(false);
  const [demoCorrect, setDemoCorrect] = useState(null);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [practiceQuestionIndex, setPracticeQuestionIndex] = useState(0);
  const [autoSeconds, setAutoSeconds] = useState(8);
  const [sessionScore, setSessionScore] = useState(0);
  const [focusSeconds, setFocusSeconds] = useState(300);
  const [focusRunning, setFocusRunning] = useState(false);
  const [communityTab, setCommunityTab] = useState('questions');
  const [questionExpanded, setQuestionExpanded] = useState(false);
  const [questionSaved, setQuestionSaved] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);
  const [winCheered, setWinCheered] = useState(false);
  const [error, setError] = useState('');
  const { notify, setUserSession } = useApp();
  const navigate = useNavigate();
  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';
  const isLanding = !standalone && !isForgot;
  const { clientId: googleClientId, loading: googleConfigLoading } = useContext(GoogleAuthContext);
  const topicResults = Object.values(CURRICULA).flatMap(school => school.categories.map(topic => ({ topic, schoolId: school.id, schoolName: school.shortName, schoolCode: school.code })))
    .filter(item => !topicQuery.trim() || `${item.topic} ${item.schoolName} ${item.schoolCode}`.toLowerCase().includes(topicQuery.trim().toLowerCase()))
    .slice(0, topicQuery.trim() ? 8 : 3);
  const activeDemo = LEARNING_DEMOS[demoTopic];
  const activeChallenge = activeDemo.challenges[practiceQuestionIndex];
  const formattedFocusTime = `${String(Math.floor(focusSeconds / 60)).padStart(2, '0')}:${String(focusSeconds % 60).padStart(2, '0')}`;

  useEffect(() => {
    if (!focusRunning) return undefined;
    const timerId = window.setInterval(() => {
      setFocusSeconds(seconds => {
        if (seconds <= 1) { window.clearInterval(timerId); setFocusRunning(false); return 0; }
        return seconds - 1;
      });
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [focusRunning]);

  useEffect(() => {
    if (!isLanding || demoAnswer !== null || demoChecked || activeDemo.challenges.length < 2) return undefined;
    let remaining = 8;
    setAutoSeconds(remaining);
    const rotateId = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        window.clearInterval(rotateId);
        setAutoSeconds(0);
        setPracticeQuestionIndex(index => (index + 1) % activeDemo.challenges.length);
        return;
      }
      setAutoSeconds(remaining);
    }, 1000);
    return () => window.clearInterval(rotateId);
  }, [isLanding, demoTopic, demoAnswer, demoChecked, practiceQuestionIndex, activeDemo.challenges.length]);

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

  function beginWithSchool(schoolId) {
    localStorage.setItem('learnconnect-pending-school', schoolId);
    navigate('/signup');
  }

  function checkDemoAnswer() {
    if (demoChecked) {
      if (demoCorrect && sessionScore < activeDemo.challenges.length) {
        setChallengeIndex(index => Math.min(index + 1, activeDemo.steps.length - 1));
        setPracticeQuestionIndex(index => (index + 1) % activeDemo.challenges.length);
        setDemoAnswer(null);
        setDemoChecked(false);
        setDemoCorrect(null);
        return;
      }
      if (demoCorrect) {
        setDemoCompleted(true);
        setDemoStats(current => {
          const today = getLocalDateKey();
          const yesterday = getLocalDateKey(new Date(Date.now() - 86400000));
          const completed = current.completed.includes(demoTopic) ? current.completed : [...current.completed, demoTopic];
          const streak = current.lastActive === today ? current.streak : current.lastActive === yesterday ? current.streak + 1 : 1;
          const next = { completed, streak, lastActive: today };
          localStorage.setItem(DEMO_PROGRESS_KEY, JSON.stringify(next));
          return next;
        });
        return;
      }
      setDemoAnswer(null);
      setDemoChecked(false);
      setDemoCorrect(null);
      return;
    }
    setDemoChecked(true);
    const isCorrect = demoAnswer === activeChallenge.answer;
    setDemoCorrect(isCorrect);
    if (isCorrect) setSessionScore(score => score + 1);
  }

  return <main className={`login-page${isLanding && darkMode ? ' landing-dark-mode' : ''}`}>
    {isLanding && <header className="public-nav"><Link to="/login" className="public-brand" aria-label="Campus Knowledge Hub home"><span><GraduationCap size={21} strokeWidth={2.4}/></span><b>Campus <span>Knowledge</span> Hub</b></Link><nav id="public-navigation" className={navOpen ? 'is-open' : ''}><a href="#how-it-works" onClick={() => setNavOpen(false)}>How it works</a><a href="#schools" onClick={() => setNavOpen(false)}>Schools</a><a href="#community" onClick={() => setNavOpen(false)}>Community</a></nav><div><button type="button" className="landing-theme-toggle" aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setDarkMode(value => { const next = !value; localStorage.setItem('campus-hub-theme', next ? 'dark' : 'light'); return next; })}>{darkMode ? <Sun size={17}/> : <Moon size={17}/>}<span>{darkMode ? 'Light' : 'Dark'}</span></button><button type="button" className="mobile-nav-toggle" aria-label={navOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={navOpen} aria-controls="public-navigation" onClick={() => setNavOpen(open => !open)}>{navOpen ? <X size={18}/> : <Menu size={18}/>}</button><Link to="/signin" className="public-signin">Sign in</Link><Link to="/signup" className="public-get-started">Get started <ArrowRight size={15}/></Link></div></header>}
    {standalone && <header className="public-nav auth-nav"><Link to="/login" className="public-brand" aria-label="Campus Knowledge Hub home"><span><GraduationCap size={21} strokeWidth={2.4}/></span><b>Campus <span>Knowledge</span> Hub</b></Link><Link to="/login" className="auth-home-link"><ArrowRight size={14}/> Back to home</Link></header>}
    <div className={`login-layout ${isLanding ? 'login-layout-landing' : ''}`}>
      <aside className="login-story">
        <div className="login-story-brand"><span><Sparkles size={19}/></span><b>learn<span>connect</span></b><small>CAMPUS KNOWLEDGE HUB</small></div>
        <div className="login-story-copy">
          <span className="login-kicker"><i/> YOUR CAMPUS, IN ONE PLACE</span>
          <h2>Learn together.<br/><em>Go further.</em></h2>
          <p>Follow a real learning path, practice what you learn, and get unstuck with people who are figuring it out alongside you.</p>
          <div className="login-feature-stack">
            <div className="login-feature"><span className="feature-icon feature-violet"><Layers3 size={17}/></span><span><b>Structured learning paths</b><small>Modules, resources and practical assignments.</small></span><ArrowUpRight size={15}/></div>
            <div className="login-feature"><span className="feature-icon feature-mint"><UsersRound size={17}/></span><span><b>A campus that learns together</b><small>Ask questions, share answers and join sessions.</small></span><ArrowUpRight size={15}/></div>
          </div>
          <div className="login-school-preview" aria-label="Explore schools: Programming, Business and Finance">
            <span className="school-preview-label">EXPLORE YOUR SCHOOL</span>
            <div className="school-preview-list"><span className="school-chip school-chip-code"><Code2 size={13}/> Programming</span><span className="school-chip school-chip-business"><BriefcaseBusiness size={13}/> Business</span><span className="school-chip school-chip-finance"><Landmark size={13}/> Finance</span></div>
          </div>
        </div>
        <div className="login-story-foot"><ShieldCheck size={15}/> Your learning space, ready when you are.</div>
        <span className="login-decoration login-decoration-one"/><span className="login-decoration login-decoration-two"/>
      </aside>

      {isLanding && <section className="learning-demo" aria-label="Interactive learning path preview">
        <div className="learning-demo-glow" aria-hidden="true"/>
        <div className="learning-demo-top"><span className="demo-live"><i/> LIVE LEARNING PREVIEW</span><span className="demo-session"><Flame size={13}/> {demoStats.streak} DAY STREAK <b>·</b> {demoStats.completed.length}/3 PATHS</span></div>
        <div className="demo-heading"><div><small>{activeDemo.code} / LEARNING PATH</small><h3>{activeDemo.module}</h3></div><span className="demo-progress-ring" style={{ '--progress': `${Math.min(activeDemo.progress + (demoCompleted ? 20 : Math.round(sessionScore / activeDemo.challenges.length * 20)), 100)}%` }}><b>{Math.min(activeDemo.progress + (demoCompleted ? 20 : Math.round(sessionScore / activeDemo.challenges.length * 20)), 100)}<small>%</small></b></span></div>
        <div className="demo-topic-tabs" role="tablist" aria-label="Choose a learning path">{Object.entries(LEARNING_DEMOS).map(([id, item]) => { const Icon = SCHOOL_ICONS[id]; return <button type="button" role="tab" aria-selected={demoTopic === id} className={demoTopic === id ? 'is-active' : ''} key={id} onClick={() => { setDemoTopic(id); setDemoCompleted(demoStats.completed.includes(id)); setDemoAnswer(null); setDemoChecked(false); setDemoCorrect(null); setChallengeIndex(0); setPracticeQuestionIndex(0); setSessionScore(0); }}><Icon size={14}/>{item.label}{demoStats.completed.includes(id) && <CheckCircle2 size={12}/>}</button>; })}</div>
        <div className="demo-workspace"><div className="demo-workspace-bar"><span><i/><i/><i/></span><small>{activeDemo.lesson.toLowerCase().replaceAll(' ', '-')}</small><span className="demo-workspace-tag">PRACTICE</span></div><pre>{activeDemo.sample}</pre><div className="demo-workspace-result"><span className="demo-check">{demoCompleted ? '✓' : '↗'}</span><div><b>{demoCompleted ? 'Nice work. Step complete.' : activeDemo.lesson}</b><small>{demoCompleted ? 'Your path moved forward.' : 'Try one small step, then build on it.'}</small></div></div></div>
        <div className="demo-step-row">{activeDemo.steps.map((step, index) => <div className={`demo-step ${demoCompleted || index < challengeIndex ? 'is-done' : index === challengeIndex ? 'is-current' : ''}`} key={step}><span>{demoCompleted || index < challengeIndex ? '✓' : `0${index + 1}`}</span><small>{step}</small></div>)}</div>
        <div className={`demo-challenge ${demoAnswer === null && !demoChecked ? 'is-auto' : demoCorrect ? 'has-correct' : demoChecked ? 'has-wrong' : 'is-paused'}`} key={`${demoTopic}-${practiceQuestionIndex}`}><div className="demo-challenge-title"><span><CircleHelp size={14}/></span><div><b>Quick challenge</b><small>Question {practiceQuestionIndex + 1} of {activeDemo.challenges.length} · {sessionScore} correct</small></div><div className="practice-clock" aria-label={demoAnswer === null && !demoChecked ? `Next question in ${autoSeconds} seconds` : 'Question timer paused'}><svg viewBox="0 0 44 44" aria-hidden="true"><circle className="practice-clock-track" cx="22" cy="22" r="18"/><circle className="practice-clock-progress" cx="22" cy="22" r="18" style={{strokeDashoffset: `${113.1 * (1 - autoSeconds / 8)}`}}/></svg><b>{demoAnswer === null && !demoChecked ? `0:${String(autoSeconds).padStart(2,'0')}` : <Pause size={12}/>}</b></div></div><div className="challenge-progress" aria-label={`Question ${practiceQuestionIndex + 1} of ${activeDemo.challenges.length}`}>{activeDemo.challenges.map((_, index) => <i className={index < challengeIndex || demoChecked && demoCorrect && index === practiceQuestionIndex ? 'is-done' : index === practiceQuestionIndex ? 'is-current' : ''} key={index}/>)}</div><p>{activeChallenge.question}</p><div className="demo-answer-options">{activeChallenge.options.map((option, index) => <button type="button" key={option} className={`${demoAnswer === index ? 'is-selected' : ''} ${demoChecked && index === activeChallenge.answer ? 'is-correct' : demoChecked && demoAnswer === index && !demoCorrect ? 'is-wrong' : ''}`} onClick={() => { setDemoAnswer(index); setDemoChecked(false); setDemoCorrect(null); }} aria-pressed={demoAnswer === index}>{option}</button>)}</div>{demoChecked && <p className={`demo-feedback ${demoCorrect ? 'is-correct' : 'is-wrong'}`} aria-live="polite">{demoCorrect ? <><CheckCircle2 size={13}/> Correct. {activeChallenge.explanation}</> : <><X size={13}/> Not quite. Choose another answer and try again.</>}</p>}</div>
        <button type="button" className="demo-action" disabled={demoAnswer === null && !demoChecked} onClick={checkDemoAnswer}>{!demoChecked ? 'Check my answer' : demoCorrect ? sessionScore >= activeDemo.challenges.length ? 'Finish this path' : 'Next question' : 'Try another answer'} <ArrowRight size={15}/></button>
        <div className={`demo-focus ${focusRunning ? 'is-running' : ''}`}><span><Clock3 size={15}/></span><div><b>{focusRunning ? 'Focus sprint in progress' : focusSeconds === 0 ? 'Sprint complete. Nice focus!' : 'Need a focus nudge?'}</b><small>{focusRunning ? 'One small step. Stay with it.' : 'Start a gentle 5 minute study timer.'}</small></div><button type="button" onClick={() => { if (focusRunning) setFocusRunning(false); else { if (focusSeconds === 0) setFocusSeconds(300); setFocusRunning(true); } }}>{focusRunning ? formattedFocusTime : focusSeconds === 0 ? 'Restart' : focusSeconds < 300 ? `Resume ${formattedFocusTime}` : 'Start 05:00'}</button></div>
      </section>}

      {!isLanding && <section className={`login-card ${isSignup || isForgot ? 'login-card-signup' : ''}`} aria-labelledby="login-title">
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
        {!isForgot && googleClientId && <div className="google-auth">{isSubmitting ? <p role="status">Finishing secure sign-in…</p> : <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google sign-in could not start. Check that the Web OAuth client is active and this site origin is authorized in Google Cloud Console.')} text="continue_with" shape="pill" width="280" useOneTap={false}/>}<p>Secure sign-in with your Google account</p></div>}
        {!isForgot && !googleClientId && <div className="google-auth"><button className="google-unconfigured" type="button" disabled><b>G</b>{googleConfigLoading ? 'Connecting to Google…' : 'Continue with Google'}</button><p>{googleConfigLoading ? 'Checking the server Google sign-in setup.' : 'Google sign-in is not configured on this server. Set GOOGLE_CLIENT_ID in backend/.env and restart the server.'}</p></div>}
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
      </section>}
    </div>
      {isLanding && <div className="landing-content">
        <section className="landing-discipline"><div className="landing-discipline-head"><span className="landing-eyebrow">A FEW GOOD REASONS TO SHOW UP</span><h2>Make learning feel<br/>like <em>your thing.</em></h2><p>Less pressure to have it all figured out. More ways to keep moving, with people and tools that meet you where you are.</p></div><div className="discipline-grid"><article><span>01 / FIND YOUR THREAD</span><i><Layers3 size={20}/></i><h3>A path, not a pile.</h3><p>Follow a curriculum with clear modules, good resources and practical assignments that make the next step feel possible.</p><b>START WHERE YOU ARE <ArrowRight size={13}/></b></article><article><span>02 / TRY IT FOR REAL</span><i><CheckCircle2 size={20}/></i><h3>Make the idea yours.</h3><p>Practice what you learn, submit your work and see the distance between where you started and where you are now.</p><b>SMALL WINS ADD UP <ArrowRight size={13}/></b></article><article><span>03 / PASS IT ON</span><i><UsersRound size={20}/></i><h3>Good questions travel.</h3><p>Ask for help without the awkwardness. Share a useful answer. Give someone else the shortcut you wish you had.</p><b>BETTER, TOGETHER <ArrowRight size={13}/></b></article><article><span>04 / MAKE A RITUAL</span><i><Flame size={20}/></i><h3>Keep your own pace.</h3><p>Pick a topic, join a live study session and build a learning rhythm that fits around real campus life.</p><b>YOUR PACE COUNTS <ArrowRight size={13}/></b></article></div></section>
        <div className="landing-proof-row"><span><i/> Built for campus learning</span><span>Programming <b>·</b> Business <b>·</b> Finance</span><span>Learn at your own pace <b>·</b> Grow together</span></div>
        <section className="campus-lounge" aria-labelledby="campus-lounge-title">
          <div className="lounge-heading"><div><span className="landing-eyebrow">A LITTLE CAMPUS, RIGHT NOW</span><h2 id="campus-lounge-title">The learning lounge<span>.</span></h2><p>See what your campus is exploring, then jump into the conversation.</p></div><span className="lounge-live"><i/> COMMUNITY PREVIEW</span></div>
          <div className="lounge-panel">
            <div className="lounge-panel-head"><div className="lounge-tabs" role="tablist" aria-label="Campus activity"><button type="button" role="tab" aria-selected={communityTab==='questions'} className={communityTab==='questions'?'is-active':''} onClick={()=>setCommunityTab('questions')}><MessageCircle size={15}/>Questions</button><button type="button" role="tab" aria-selected={communityTab==='rooms'} className={communityTab==='rooms'?'is-active':''} onClick={()=>setCommunityTab('rooms')}><UsersRound size={15}/>Study rooms</button><button type="button" role="tab" aria-selected={communityTab==='wins'} className={communityTab==='wins'?'is-active':''} onClick={()=>setCommunityTab('wins')}><Sparkles size={15}/>Small wins</button></div><span className="lounge-online"><i/> 24 learning today</span></div>
            {communityTab==='questions' && <div className="lounge-content lounge-question-view"><article className="lounge-question-card"><div className="lounge-card-kicker"><span className="lounge-avatar avatar-violet">AR</span><span><b>Aarav Rao</b><small>Programming · 12 min ago</small></span><span className="lounge-tag">NEEDS A HAND</span></div><h3>Why does my CSS grid overflow on mobile?</h3><p>It looks fine on desktop, but the cards push past the screen on my phone. What should I check first?</p><div className="lounge-card-foot"><span><MessageCircle size={14}/> 4 replies <i>·</i> 2 min read</span><button type="button" className={questionSaved?'is-saved':''} onClick={()=>setQuestionSaved(value=>!value)} aria-pressed={questionSaved}><Star size={14} fill={questionSaved?'currentColor':'none'}/>{questionSaved?'Following':'Follow question'}</button></div>{questionExpanded&&<div className="lounge-peer-answer"><span className="lounge-avatar avatar-mint">NK</span><p><b>Nisha · peer answer</b><br/>Check whether each grid column can shrink: <code>minmax(0, 1fr)</code> prevents long content from forcing the layout wider.</p></div>}<button type="button" className="lounge-reply-link" onClick={()=>setQuestionExpanded(value=>!value)}>{questionExpanded?'Hide peer answer':'Read a peer answer'} <ArrowRight size={14}/></button></article><aside className="lounge-side-note"><span className="side-note-icon"><Radio size={17}/></span><small>HAPPENING THIS WEEK</small><b>Questions become shortcuts for everyone.</b><p>One thoughtful answer can help the next person move forward faster.</p><Link to="/signup">Join the conversation <ArrowUpRight size={14}/></Link></aside></div>}
            {communityTab==='rooms' && <div className="lounge-content lounge-room-view"><article className="lounge-room-card"><div className="room-visual"><span className="room-live-pill"><i/> OPEN ROOM</span><div className="room-orbit room-orbit-one"/><div className="room-orbit room-orbit-two"/><span className="room-book"><BookOpen size={25}/></span><span className="room-float room-float-a"><Code2 size={15}/></span><span className="room-float room-float-b"><MessageCircle size={15}/></span></div><div className="room-copy"><span className="landing-eyebrow">PROGRAMMING · DROP IN</span><h3>Frontend focus room</h3><p>Build quietly together, share a blocker, or just borrow the room’s momentum.</p><div className="room-meta"><span className="room-avatars"><i>SK</i><i>MP</i><i>+{roomJoined?'9':'8'}</i></span><span>{roomJoined?'9 people in the room':'8 people learning now'}</span><span>25 min</span></div><button type="button" className="room-join-button" onClick={()=>setRoomJoined(value=>!value)}>{roomJoined?'Leave study room':'Join study room'} <ArrowRight size={15}/></button></div></article><div className="room-agenda"><span className="landing-eyebrow">TODAY’S MINI PLAN</span>{[['01','Pick one tiny goal'],['02','Focus together for 25 min'],['03','Share what clicked']].map(([number,label],index)=><div className={`agenda-step ${roomJoined&&index===0?'is-complete':''}`} key={number}><i>{roomJoined&&index===0?'✓':number}</i><span>{label}</span>{index<2&&<b/>}</div>)}</div></div>}
            {communityTab==='wins' && <div className="lounge-content lounge-wins-view"><div className="win-intro"><span className="win-spark"><Sparkles size={20}/></span><span className="landing-eyebrow">PROGRESS WORTH SHARING</span><h3>Little wins add up.</h3><p>Celebrate the steps that make learning feel real.</p></div><div className="win-feed"><article><span className="lounge-avatar avatar-amber">PS</span><div><b>Priya finished her first portfolio page</b><small>Programming · 8 min ago</small><div className="win-progress"><i style={{width:'82%'}}/></div></div><span className="win-check">✓</span></article><article><span className="lounge-avatar avatar-violet">RM</span><div><b>Rohan wrapped up a budget case study</b><small>Finance · 21 min ago</small><div className="win-progress"><i style={{width:'100%'}}/></div></div><span className="win-check">✓</span></article><button type="button" className={`cheer-button ${winCheered?'is-cheered':''}`} onClick={()=>setWinCheered(value=>!value)}><Sparkles size={15}/>{winCheered?'You sent a little cheer':'Send the campus a little cheer'} <span>{winCheered?'13':'12'} <span aria-hidden="true">♥</span></span></button></div></div>}
          </div>
        </section>
        <section className="landing-preview" id="how-it-works"><div className="landing-preview-copy"><span className="landing-eyebrow"><i/> YOUR CAMPUS, WITH A LITTLE MORE CLARITY</span><h2>Find your rhythm.<br/><em>Keep your spark.</em></h2><p>See your current topic, the progress you have made, and the conversations happening around you. Everything useful, close at hand.</p><Link to="/signup" className="landing-link-button">Choose your first path <ArrowRight size={16}/></Link><div className="landing-mini-stats"><span><b>03</b><small>ways to begin</small></span><span><b>01</b><small>campus community</small></span><span><b>∞</b><small>good next steps</small></span></div></div>
          <div className="campus-field-notes" aria-label="An illustrated learning path through the campus schools"><div className="field-notes-top"><span><b>✳</b> FIELD NOTES / 01</span><span>YOUR LEARNING, IN MOTION</span></div><div className="field-notes-map"><svg viewBox="0 0 680 260" aria-hidden="true"><path className="map-path map-path-back" d="M38 184 C130 188 138 77 250 85 S353 205 435 145 520 52 640 65"/><path className="map-path" d="M38 184 C130 188 138 77 250 85 S353 205 435 145 520 52 640 65"/><circle className="map-stop stop-a" cx="105" cy="155" r="30"/><circle className="map-stop stop-b" cx="284" cy="102" r="30"/><circle className="map-stop stop-c" cx="472" cy="119" r="30"/><circle className="map-spark" cx="191" cy="46" r="4"/><circle className="map-spark" cx="371" cy="202" r="3"/><circle className="map-spark" cx="569" cy="116" r="5"/></svg><div className="map-node map-node-a"><Code2 size={18}/></div><div className="map-node map-node-b"><BriefcaseBusiness size={18}/></div><div className="map-node map-node-c"><Landmark size={18}/></div><div className="map-caption map-caption-a"><span>01</span><b>Start somewhere</b><small>Programming</small></div><div className="map-caption map-caption-b"><span>02</span><b>Find your angle</b><small>Business</small></div><div className="map-caption map-caption-c"><span>03</span><b>See the bigger picture</b><small>Finance</small></div><div className="map-sticker"><UsersRound size={15}/><span>Campus knowledge<br/><b>gets better shared.</b></span></div></div><div className="field-notes-bottom"><span>NO PERFECT STARTING POINT REQUIRED</span><span>JUST TAKE THE NEXT STEP ↗</span></div></div>
        </section>
        <section className="landing-schools" id="schools"><div className="landing-section-head"><span className="landing-eyebrow">THREE PATHS. ROOM TO GROW.</span><h2>Start with what <em>inspires you.</em></h2><p>A structured curriculum, practical assignments and resources help turn curiosity into real skills.</p></div><div className="landing-school-grid">{Object.values(CURRICULA).map((school, index) => { const Icon = SCHOOL_ICONS[school.id]; return <button type="button" className={`landing-school-card landing-school-${school.accent}`} key={school.id} onClick={() => beginWithSchool(school.id)}><span className="landing-school-number">0{index + 1}</span><span className="landing-school-icon"><Icon size={19}/></span><small>{school.code} · YOUR LEARNING PATH</small><h3>{school.shortName}</h3><p>{school.description}</p><span className="landing-school-link">Explore the curriculum <ArrowUpRight size={14}/></span></button>; })}</div><div className="landing-topic-finder"><div className="topic-finder-heading"><span><Search size={17}/></span><div><b>Know what you want to learn?</b><small>Search real topics from our campus paths.</small></div></div><label className="topic-finder-input"><Search size={17}/><span className="sr-only">Search learning topics</span><input value={topicQuery} onChange={event => setTopicQuery(event.target.value)} placeholder="Try JavaScript, marketing, finance…"/><kbd>⌕</kbd>{topicQuery && <button type="button" onClick={() => setTopicQuery('')} aria-label="Clear search"><X size={15}/></button>}</label><div className="topic-finder-results" aria-live="polite">{topicResults.length ? topicResults.map(item => <button type="button" className="topic-result" key={`${item.schoolId}-${item.topic}`} onClick={() => beginWithSchool(item.schoolId)}><span>{item.topic}</span><small>{item.schoolCode}</small><ArrowUpRight size={14}/></button>) : <p className="topic-empty">No matching topics yet. Try a broader search.</p>}</div></div></section>
        <section className="landing-community" id="community"><div><span className="landing-eyebrow">A BETTER WAY TO LEARN</span><h2>Progress feels different<br/>when you <em>do it together.</em></h2><p>Ask a doubt. Share something you learned. Join a live session. Every small contribution makes campus knowledge stronger.</p><Link to="/signup" className="landing-community-cta">Join your campus community <ArrowRight size={16}/></Link></div><div className="community-orbit" aria-hidden="true"><span className="orbit orbit-a"/><span className="orbit orbit-b"/><i className="orbit-core"><GraduationCap size={28}/></i><i className="orbit-node node-a"><BookOpen size={17}/></i><i className="orbit-node node-b"><MessageCircle size={17}/></i><i className="orbit-node node-c"><UsersRound size={17}/></i><i className="orbit-node node-d"><Sparkles size={17}/></i></div></section>
        <section className="landing-final-cta"><span>A LITTLE CURIOSITY CAN TAKE YOU A LONG WAY.</span><h2>Come as you are.<br/><em>Leave a little wiser.</em></h2><div className="landing-final-actions"><Link to="/signup" className="landing-final-cta-link">Find your place here <ArrowRight size={16}/></Link><small>Choose a school <i>·</i> Start with one topic <i>·</i> Find your people</small></div></section>
        <footer className="landing-footer"><Link to="/login" className="public-brand" aria-label="Campus Knowledge Hub home"><span><GraduationCap size={19} strokeWidth={2.4}/></span><b>Campus <span>Knowledge</span> Hub</b></Link><span>Made for curious minds and stronger campus communities.</span><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top <ArrowRight size={14}/></button></footer>
      </div>}
  </main>;
}
