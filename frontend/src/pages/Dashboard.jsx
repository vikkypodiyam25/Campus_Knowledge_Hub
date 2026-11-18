import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, CheckCircle2, ChevronRight, CircleHelp, GraduationCap, MessageCircle, MessageSquare, Plus, Sparkles, Users, Zap, Timer, Target } from 'lucide-react';
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
  const [sprintDone, setSprintDone] = useState(false);
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
  const nextModule = schoolModules.find(module => module.topics.some(topic => !learningRecords.progress.some(row => row.schoolCode === curriculum?.code && row.moduleId === module.id && row.topicId === topic))) || schoolModules[0];
  const sprintTopicIndex = Math.max(0, nextModule?.topics.findIndex(topic => !learningRecords.progress.some(row => row.schoolCode === curriculum?.code && row.moduleId === nextModule.id && row.topicId === topic)) ?? 0);
  const sprintTopic = nextModule?.topics[sprintTopicIndex] || curriculum?.shortName || 'Explore a new topic';
  const sprintLesson = nextModule?.lessonDetails?.[sprintTopicIndex] || `Spend a few minutes exploring ${sprintTopic}, then write down one idea you want to remember.`;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const sprintStorageKey = `campus-learning-sprint:${curriculum?.code || 'school'}:${todayKey}`;
  useEffect(() => { setSprintDone(localStorage.getItem(sprintStorageKey) === 'done'); }, [sprintStorageKey]);
  const learningWeek = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() - (6 - index));
    const dateKey = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    const completed = learningRecords.progress.filter(row => row.schoolCode === curriculum?.code && row.status === 'completed' && row.completedAt && new Date(row.completedAt).toDateString() === day.toDateString()).length;
    const sprint = localStorage.getItem(`campus-learning-sprint:${curriculum?.code || 'school'}:${dateKey}`) === 'done';
    return { dateKey, label: day.toLocaleDateString(undefined, { weekday: 'short' }), completed, sprint, value: completed + (sprint ? 1 : 0), today: index === 6 };
  });
  const activeLearningDays = learningWeek.filter(day => day.value > 0).length;
  const weeklyTopics = learningWeek.reduce((total, day) => total + day.completed, 0);
  let learningStreak = 0;
  for (let dayIndex = learningWeek.length - (learningWeek[6]?.value ? 1 : 2); dayIndex >= 0 && learningWeek[dayIndex]?.value; dayIndex -= 1) learningStreak += 1;
  const finishSprint = () => {
    const nextDone = !sprintDone;
    setSprintDone(nextDone);
    if (nextDone) localStorage.setItem(sprintStorageKey, 'done');
    else localStorage.removeItem(sprintStorageKey);
  };

  if (!curriculum) return <ChooseSubject/>;

  return <div className={`student-dashboard school-theme-${curriculum.accent}`}>
    <div className="dashboard-greeting"><div><span className="dashboard-date"><Sparkles size={14}/> YOUR CAMPUS, YOUR CLASSROOM</span><h1>Good to see you, {(data.profile?.name || 'Learner').trim().split(/\s+/)[0]} <span>✦</span></h1><p>A little progress today adds up to something great.</p></div><Link className="dashboard-profile-link" to="/profile"><span>{(data.profile?.name || 'L').trim().split(/\s+/).map(part => part[0]).slice(0,2).join('')}</span><div><b>{data.profile?.name || 'Learner'}</b><small>{curriculum.shortName} student</small></div><ArrowUpRight size={16}/></Link></div>
    <div className="welcome-banner student-welcome-banner">
      <div className="welcome-copy">
        <div className="welcome-pill"><span/> {curriculum.code} - {curriculum.name}</div>
        <h2>Your next big idea starts here.</h2>
        <p>{curriculum.description} Learn at your pace, find your people, and make every new skill count.</p>
        <div className="welcome-actions"><Link to={nextModule ? `/modules/${nextModule.id}` : continuePath} className="btn btn-white"><BookOpen size={16}/>Continue learning<ArrowRight size={15}/></Link><Link to="/choose-subject" className="banner-link">Explore your school <ArrowRight size={15}/></Link></div>
      </div>
      <div className="welcome-art student-hero-art" aria-hidden="true"><div className="hero-orbit hero-orbit-one"/><div className="hero-orbit hero-orbit-two"/><div className="hero-course-card"><span className="hero-course-label"><GraduationCap size={14}/> YOUR SCHOOL</span><b>{curriculum.shortName}</b><small>{schoolModules.length} learning modules</small><div className="hero-course-line"><i style={{ width: `${progressPercent}%` }}/></div><span className="hero-course-progress">{completedTopics} of {totalTopics} topics completed</span></div><div className="hero-course-float hero-float-top"><BookOpen size={15}/><span>{schoolAssignments.length} practical assignments</span></div><div className="hero-course-float hero-float-bottom"><CheckCircle2 size={15}/><span>{submittedAssignments} submitted</span></div></div>
    </div>

    <section className="dashboard-next-step"><div className="next-step-icon"><Zap size={20}/></div><div className="next-step-copy"><span>UP NEXT · {nextModule?.name.replace(/^Module \d+: /, '') || 'YOUR LEARNING PATH'}</span><b>{sprintTopic}</b><small>{nextModule ? `A focused 15-minute session · ${nextModule.topics.length} topics in this module` : 'Your learning path is ready when you are.'}</small></div><Link to={nextModule ? `/modules/${nextModule.id}` : continuePath}>Open learning path <ArrowRight size={15}/></Link></section>

    <section className={`daily-learning-sprint${sprintDone ? ' is-complete' : ''}`} aria-labelledby="daily-sprint-title">
      <div className="sprint-icon"><Target size={20}/></div>
      <div className="sprint-main"><div className="sprint-eyebrow"><span>YOUR DAILY LEARNING SPRINT</span><span><Timer size={13}/> 15 MIN</span></div><h2 id="daily-sprint-title">One small step today</h2><b className="sprint-topic">{sprintTopic}</b><p>{sprintLesson}</p><div className="sprint-plan"><span><i>1</i> Read the idea</span><span><i>2</i> Try a small example</span><span><i>3</i> Note what you learned</span></div></div>
      <div className="sprint-actions"><Link to={nextModule ? `/modules/${nextModule.id}` : continuePath}>{sprintDone ? 'Review topic' : 'Start this sprint'} <ArrowRight size={15}/></Link><button type="button" onClick={finishSprint} aria-pressed={sprintDone}>{sprintDone ? <CheckCircle2 size={16}/> : <CheckCircle2 size={16}/>} {sprintDone ? 'Done today' : 'Mark done'}</button></div>
    </section>

    <section className="learning-rhythm" aria-labelledby="learning-rhythm-title">
      <div className="rhythm-heading"><div><p className="eyebrow">YOUR LEARNING RHYTHM</p><h2 id="learning-rhythm-title">Small steps, steady progress</h2><p>Celebrate the days you showed up this week.</p></div><Link to="/progress">View all progress <ArrowUpRight size={14}/></Link></div>
      <div className="rhythm-content"><div className="rhythm-bars" role="img" aria-label={`${activeLearningDays} active learning days and ${weeklyTopics} completed topics in the last seven days`}>{learningWeek.map(day => <div className={`rhythm-day${day.today ? ' is-today' : ''}${day.value ? ' has-activity' : ''}`} key={day.dateKey} title={`${day.label}: ${day.completed} topic${day.completed === 1 ? '' : 's'} completed${day.sprint ? ', daily sprint done' : ''}`}><div className="rhythm-bar-track"><i style={{ '--bar-level': `${day.value ? Math.min(100, 34 + day.value * 24) : 8}%` }}/>{day.sprint && <span aria-hidden="true">✦</span>}</div><small>{day.label}</small></div>)}</div><div className="rhythm-stats"><article><span className="rhythm-stat-icon"><Zap size={16}/></span><b>{activeLearningDays}<small>/ 7</small></b><span>days active</span></article><article><span className="rhythm-stat-icon rhythm-check"><CheckCircle2 size={16}/></span><b>{weeklyTopics}</b><span>topics completed</span></article><article className="rhythm-streak"><span className="rhythm-stat-icon rhythm-flame">✦</span><b>{learningStreak}</b><span>day learning streak</span></article></div></div>
    </section>

    <section className="student-learning-overview" aria-label="Your learning overview">
      <div className="student-overview-heading"><div><p className="eyebrow">YOUR LEARNING AT A GLANCE</p><h2>Keep your momentum</h2></div><Link to="/progress">View progress <ArrowUpRight size={14}/></Link></div>
      <div className="student-overview-grid">
        <article className="student-progress-feature"><div className="student-progress-top"><span className="student-progress-icon"><BookOpen size={17}/></span><span className="student-progress-rate" style={{ '--progress': `${progressPercent}%` }}><span>{progressPercent}%</span></span></div><div><h3>Topic progress</h3><p>{completedTopics} completed <span>of {totalTopics} topics</span></p></div><div className="student-progress-track"><i style={{ width: `${progressPercent}%` }}/></div><Link to="/progress">See completed topics <ArrowRight size={14}/></Link></article>
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

    <section className="dashboard-quick-section"><div className="dashboard-section-title"><div><span>MAKE SOMETHING HAPPEN</span><h2>Your community is one click away</h2></div><Link to="/explore">Explore all <ArrowRight size={15}/></Link></div><div className="quick-strip"><span className="quick-label">QUICK ACTIONS</span><Link to="/ask"><span className="quick-icon qi-violet"><CircleHelp size={18}/></span><span><b>Ask a question</b><small>Get unstuck together</small></span><ChevronRight size={16}/></Link><Link to="/share-learning"><span className="quick-icon qi-peach"><Sparkles size={18}/></span><span><b>Share what you know</b><small>Turn learning into impact</small></span><ChevronRight size={16}/></Link><Link to="/discussions/new"><span className="quick-icon qi-violet"><MessageSquare size={18}/></span><span><b>Start a conversation</b><small>Bring your idea to campus</small></span><ChevronRight size={16}/></Link><Link to="/sessions/new"><span className="quick-icon qi-blue"><CalendarDays size={18}/></span><span><b>Host a study session</b><small>Learn better, together</small></span><ChevronRight size={16}/></Link></div></section>

    <div className="dashboard-grid"><section className="panel"><SectionHead eyebrow="YOUR COMMUNITY" title="Recent doubts" link="/questions" linkText="See all"/><div className="mini-feed">{questions.map(question => <QuestionCard key={question.id} q={question} compact/>)}{questions.length === 0 && <Empty title="No questions yet"/>}</div></section><section className="panel"><SectionHead eyebrow="HAPPENING NOW" title="Trending discussions" link="/discussions" linkText="See all"/><div className="mini-feed">{discussions.map(discussion => <DiscussionCard key={discussion.id} d={discussion} compact/>)}{discussions.length === 0 && <Empty title="Be the first to start a conversation"/>}</div></section></div>

    <section className="panel upcoming-panel"><SectionHead eyebrow="PUT IT ON YOUR CALENDAR" title="Upcoming live sessions" link="/sessions" linkText="View all sessions"/><div className="session-list">{sessions.map(session => <SessionCard key={session.id} s={session}/>)}</div></section>

    <section className="panel topics-panel"><SectionHead eyebrow="A LITTLE INSPIRATION" title={`Topics in ${curriculum?.shortName || 'your school'}`}/><div className="topic-chips">{topics.slice(0, 9).map((topic, index) => <Link to={`/explore?q=${encodeURIComponent(topic)}`} key={topic}><span className={`topic-dot dot-${index % 4}`}>{index + 1}</span>{topic}<ArrowRight size={14}/></Link>)}</div></section>
  </div>;
}
