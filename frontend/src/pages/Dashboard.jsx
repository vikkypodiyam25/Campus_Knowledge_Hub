import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, CheckCircle2, ChevronRight, CircleHelp, GraduationCap, MessageCircle, MessageSquare, Plus, Sparkles, Users } from 'lucide-react';
import { useApp } from '../state.jsx';
import { Empty, QuestionCard, DiscussionCard, SessionCard, SectionHead, Stat } from '../components/common/index.jsx';
import { getCurriculum, getSchoolAssignments, getSchoolModules } from '../data/curricula.js';
import ChooseSubject from './ChooseSubject.jsx';
import api from '../api.js';
import './Dashboard.css';

export default function Dashboard() {
  const { data } = useApp();
  const [curriculum, setCurriculum] = useState(() => getCurriculum(data.profile?.subject));
  const [learningRecords, setLearningRecords] = useState({ progress: [], submissions: [] });
  useEffect(() => {
    const selected = getCurriculum(data.profile?.subject);
    if (!selected?.code) return undefined;
    let active = true;
    api.get(`/curriculum/${selected.code}`).then(result => { if (active) setCurriculum(result.data); }).catch(() => { if (active) setCurriculum(selected); });
    return () => { active = false; };
  }, [data.profile?.subject]);
  useEffect(() => {
    const selected = getCurriculum(data.profile?.subject);
    if (!selected?.code) return undefined;
    let active = true;
    setLearningRecords({ progress: [], submissions: [] });
    Promise.allSettled([api.get('/progress'), api.get('/assignments/submissions')]).then(([progressResult, submissionResult]) => {
      if (!active) return;
      setLearningRecords({
        progress: progressResult.status === 'fulfilled' ? progressResult.value.data || [] : [],
        submissions: submissionResult.status === 'fulfilled' ? submissionResult.value.data || [] : [],
      });
    });
    return () => { active = false; };
  }, [data.profile?.subject]);
  const questions = data.questions.slice(0, 3);
  const discussions = [...data.discussions].sort((a, b) => b.likes - a.likes).slice(0, 2);
  const sessions = data.sessions.slice(0, 2);
  const topics = curriculum?.categories || ['React', 'JavaScript', 'Web accessibility', 'Node.js', 'Data structures', 'CSS'];
  const schoolModules = getSchoolModules(curriculum);
  const schoolAssignments = getSchoolAssignments(curriculum);
  const completedTopics = learningRecords.progress.filter(row => row.schoolCode === curriculum?.code && row.status === 'completed').length;
  const totalTopics = schoolModules.reduce((total, module) => total + module.topics.length, 0);
  const progressPercent = totalTopics ? Math.min(100, Math.round(completedTopics / totalTopics * 100)) : 0;
  const submittedAssignments = learningRecords.submissions.filter(row => row.schoolCode === curriculum?.code).length;
  const firstSubject = curriculum?.subjects?.[0];
  const continuePath = firstSubject ? `/subjects/${firstSubject.id}` : schoolModules[0] ? `/modules/${schoolModules[0].id}` : '/progress';

  if (!curriculum) return <ChooseSubject/>;

  return <div className={`student-dashboard school-theme-${curriculum.accent}`}>
    <div className="welcome-banner student-welcome-banner">
      <div className="welcome-copy">
        <div className="welcome-pill"><span/> {curriculum.code} - {curriculum.name}</div>
        <h1>Welcome back, {(data.profile?.name || 'Learner').trim().split(/\s+/)[0]}</h1>
        <p>{curriculum.description} Pick a topic, build a skill, and share what you discover with your campus.</p>
        <div className="welcome-actions"><Link to={continuePath} className="btn btn-white"><BookOpen size={16}/>Open my curriculum</Link><Link to="/ask" className="banner-link">Ask your community <ArrowRight size={15}/></Link></div>
      </div>
      <div className="welcome-art student-hero-art" aria-hidden="true"><div className="hero-orbit hero-orbit-one"/><div className="hero-orbit hero-orbit-two"/><div className="hero-course-card"><span className="hero-course-label"><GraduationCap size={14}/> YOUR SCHOOL</span><b>{curriculum.shortName}</b><small>{schoolModules.length} learning modules</small><div className="hero-course-line"><i style={{ width: `${progressPercent}%` }}/></div><span className="hero-course-progress">{completedTopics} of {totalTopics} topics completed</span></div><div className="hero-course-float hero-float-top"><BookOpen size={15}/><span>{schoolAssignments.length} practical assignments</span></div><div className="hero-course-float hero-float-bottom"><CheckCircle2 size={15}/><span>{submittedAssignments} submitted</span></div></div>
    </div>

    <section className="student-learning-overview" aria-label="Your learning overview">
      <div className="student-overview-heading"><div><p className="eyebrow">YOUR LEARNING AT A GLANCE</p><h2>Keep your momentum</h2></div><Link to="/progress">View progress <ArrowUpRight size={14}/></Link></div>
      <div className="student-overview-grid">
        <article className="student-progress-feature"><div className="student-progress-top"><span className="student-progress-icon"><BookOpen size={17}/></span><span className="student-progress-rate">{progressPercent}%</span></div><div><h3>Topic progress</h3><p>{completedTopics} completed <span>of {totalTopics} topics</span></p></div><div className="student-progress-track"><i style={{ width: `${progressPercent}%` }}/></div><Link to="/progress">See completed topics <ArrowRight size={14}/></Link></article>
        <article className="student-overview-stat"><span className="overview-stat-icon overview-stat-amber"><GraduationCap size={17}/></span><div><small>MY SCHOOL</small><b>{curriculum.code}</b><span>{curriculum.shortName}</span></div><Link to="/choose-subject" aria-label="Change school"><ArrowUpRight size={15}/></Link></article>
        <article className="student-overview-stat"><span className="overview-stat-icon overview-stat-blue"><BookOpen size={17}/></span><div><small>ASSIGNMENTS</small><b>{submittedAssignments}<span> / {schoolAssignments.length}</span></b><span>submitted for review</span></div><Link to="/assignments" aria-label="View assignments"><ArrowUpRight size={15}/></Link></article>
      </div>
    </section>
    {curriculum?.curriculum?.length > 0 && <section id="curriculum" className="curriculum-roadmap panel">
      <div className="curriculum-roadmap-head"><div><p className="eyebrow">YOUR PERSONAL LEARNING PATH</p><h2>{curriculum.name}</h2><p>{curriculum.description}</p></div><Link to="/choose-subject" className="subtle-link">Change school <ArrowRight size={14}/></Link></div>
      <div className="curriculum-terms">{curriculum.curriculum.map((term, index) => <article className="curriculum-term" key={term.term}><div className="curriculum-term-index">0{index + 1}</div><div><span>{term.term}</span><ul>{term.topics.map(topic => <li key={topic}>{topic}</li>)}</ul></div></article>)}</div>
    </section>}

    {curriculum?.subjects?.length > 0 && <section id="subjects" className="school-learning-section"><div className="school-learning-heading"><div><p className="eyebrow">SOB · SCHOOL OF BUSINESS</p><h2>Your subjects</h2><p>Choose a subject to explore its modules and mark topics complete.</p></div></div><div className="school-card-grid">{curriculum.subjects.map((subject, index) => <Link to={`/subjects/${subject.id}`} className={`school-learning-card school-${curriculum.accent}`} key={subject.id} style={{ '--subject-index': index }}><span className="school-card-code">0{index + 1}</span><h3>{subject.name}</h3><p>{subject.description}</p><small>{subject.modules.reduce((count, module) => count + module.topics.length, 0)} topics <ArrowRight size={14}/></small></Link>)}</div></section>}

    {curriculum?.modules?.length > 0 && <section id="curriculum" className="school-learning-section"><div className="school-learning-heading"><div><p className="eyebrow">{curriculum.code} · {curriculum.name}</p><h2>{curriculum.code === 'SOF' ? 'Accounting, Costing, Taxation & Digital Accounting Tools' : 'Learning modules'}</h2><p>{curriculum.code === 'SOF' ? 'Certificate Program · 13–15 months' : 'Continue with the existing programming curriculum.'}</p></div></div><div className={`school-card-grid ${curriculum.code === 'SOF' ? 'finance-grid' : ''}`}>{curriculum.modules.map((module, index) => <Link to={`/modules/${module.id}`} className={`school-learning-card school-${curriculum.accent}`} key={module.id} style={{ '--subject-index': index }}><span className="school-card-code">MODULE 0{index + 1}</span><h3>{module.name.replace(/^Module \d+: /, '')}</h3><p>{module.topics.slice(0, 3).join(' · ')}</p><small>{module.topics.length} topics <ArrowRight size={14}/></small></Link>)}</div></section>}

    <div className="stats-grid"><Stat icon={CircleHelp} label="Questions asked" value={data.questions.length} change="Keep curious" color="lavender"/><Stat icon={MessageCircle} label="Answers & discussions" value={data.discussions.length} change="Learn together" color="mint"/><Stat icon={Users} label="Topics in your school" value={topics.length} change={curriculum?.shortName || 'Explore'} color="peach"/><Stat icon={CalendarDays} label="Live sessions" value={sessions.length} change="Join a session" color="blue"/></div>

    <div className="quick-strip"><span className="quick-label">QUICK ACTIONS</span><Link to="/ask"><span className="quick-icon qi-violet"><CircleHelp size={18}/></span><span><b>Share a doubt</b><small>Get help from your peers</small></span><ChevronRight size={16}/></Link><Link to="/share-learning"><span className="quick-icon qi-peach"><Sparkles size={18}/></span><span><b>Share learning</b><small>Teach others what you learned</small></span><ChevronRight size={16}/></Link><Link to="/discussions/new"><span className="quick-icon qi-violet"><MessageSquare size={18}/></span><span><b>Start a discussion</b><small>Share an idea with everyone</small></span><ChevronRight size={16}/></Link><Link to="/sessions/new"><span className="quick-icon qi-blue"><CalendarDays size={18}/></span><span><b>Create a session</b><small>Learn something together</small></span><ChevronRight size={16}/></Link></div>

    <div className="dashboard-grid"><section className="panel"><SectionHead eyebrow="YOUR COMMUNITY" title="Recent doubts" link="/questions" linkText="See all"/><div className="mini-feed">{questions.map(question => <QuestionCard key={question.id} q={question} compact/>)}{questions.length === 0 && <Empty title="No questions yet"/>}</div></section><section className="panel"><SectionHead eyebrow="HAPPENING NOW" title="Trending discussions" link="/discussions" linkText="See all"/><div className="mini-feed">{discussions.map(discussion => <DiscussionCard key={discussion.id} d={discussion} compact/>)}{discussions.length === 0 && <Empty title="Be the first to start a conversation"/>}</div></section></div>

    <section className="panel upcoming-panel"><SectionHead eyebrow="PUT IT ON YOUR CALENDAR" title="Upcoming live sessions" link="/sessions" linkText="View all sessions"/><div className="session-list">{sessions.map(session => <SessionCard key={session.id} s={session}/>)}</div></section>

    <section className="panel topics-panel"><SectionHead eyebrow="A LITTLE INSPIRATION" title={`Topics in ${curriculum?.shortName || 'your school'}`}/><div className="topic-chips">{topics.slice(0, 9).map((topic, index) => <Link to={`/explore?q=${encodeURIComponent(topic)}`} key={topic}><span className={`topic-dot dot-${index % 4}`}>{index + 1}</span>{topic}<ArrowRight size={14}/></Link>)}</div></section>
  </div>;
}
