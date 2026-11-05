import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, BookOpen, CalendarDays, CheckCircle2, CircleHelp, MessageCircle, MessageSquare, Plus, Search, Sparkles, Users } from 'lucide-react';
import { useApp } from '../state.jsx';
import { CURRICULA } from '../data/curricula.js';
import api from '../api.js';
import './Contributions.css';

const activityTypes = ['All activity', 'Questions', 'Answers', 'Discussions', 'Comments', 'Sessions', 'Assignments', 'Progress'];
const typeIcons = { Question: CircleHelp, Answer: MessageCircle, Discussion: Users, Comment: MessageSquare, Session: CalendarDays, Assignment: CheckCircle2, Progress: BookOpen };
const typeLabels = { Questions: 'Question', Answers: 'Answer', Discussions: 'Discussion', Comments: 'Comment', Sessions: 'Session', Assignments: 'Assignment', Progress: 'Progress' };

function authorName(author) {
  return typeof author === 'string' ? author : author?.name || author?.username || '';
}

function formatActivityTime(value) {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const elapsed = Date.now() - date.getTime();
  if (elapsed < 60_000) return 'Just now';
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)} min ago`;
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)} hr ago`;
  if (elapsed < 604_800_000) return `${Math.floor(elapsed / 86_400_000)} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
}

export default function Contributions() {
  const { data } = useApp();
  const [filter, setFilter] = useState('All activity');
  const [search, setSearch] = useState('');
  const [learningRecords, setLearningRecords] = useState({ progress: [], submissions: [] });
  const [recordsLoading, setRecordsLoading] = useState(true);
  const learnerName = data.profile?.name || '';
  const learnerKey = learnerName.trim().toLowerCase();

  useEffect(() => {
    let active = true;
    Promise.allSettled([api.get('/progress'), api.get('/assignments/submissions')]).then(([progress, submissions]) => {
      if (!active) return;
      setLearningRecords({
        progress: progress.status === 'fulfilled' ? progress.value.data || [] : [],
        submissions: submissions.status === 'fulfilled' ? submissions.value.data || [] : [],
      });
      setRecordsLoading(false);
    });
    return () => { active = false; };
  }, []);

  const isOwn = author => authorName(author).trim().toLowerCase() === learnerKey;
  const ownQuestions = data.questions.filter(question => isOwn(question.author));
  const ownAnswers = data.questions.flatMap(question => (question.answers || []).filter(answer => isOwn(answer.author)).map(answer => ({ ...answer, question, questionTitle: question.title })));
  const ownDiscussions = data.discussions.filter(discussion => isOwn(discussion.author));
  const ownComments = data.discussions.flatMap(discussion => (discussion.comments || []).filter(comment => isOwn(comment.author)).map(comment => ({ ...comment, discussion, discussionTitle: discussion.title })));
  const ownSessions = data.sessions.filter(session => isOwn(session.host));
  const joinedSessions = data.sessions.filter(session => session.registered && !isOwn(session.host));
  const completedProgress = learningRecords.progress.filter(item => item.status === 'completed');

  const activities = useMemo(() => [
    ...ownQuestions.map(question => ({ id: `question-${question.id}`, kind: 'Questions', title: `Asked: ${question.title}`, detail: question.description, time: question.createdAt || question.time, to: `/questions/${question.id}` })),
    ...ownAnswers.map(answer => ({ id: `answer-${answer.id}`, kind: 'Answers', title: `Answered: ${answer.questionTitle}`, detail: answer.text || answer.content, time: answer.createdAt || answer.time, to: `/questions/${answer.question.id}` })),
    ...ownDiscussions.map(discussion => ({ id: `discussion-${discussion.id}`, kind: 'Discussions', title: `Started: ${discussion.title}`, detail: discussion.description, time: discussion.createdAt || discussion.time, to: `/discussions/${discussion.id}` })),
    ...ownComments.map(comment => ({ id: `comment-${comment.id}`, kind: 'Comments', title: `Commented on: ${comment.discussionTitle}`, detail: comment.text || comment.content, time: comment.createdAt || comment.time, to: `/discussions/${comment.discussion.id}` })),
    ...ownSessions.map(session => ({ id: `hosted-${session.id}`, kind: 'Sessions', title: `Hosted: ${session.title}`, detail: `${session.date || 'Date to be confirmed'}${session.time ? ` · ${session.time}` : ''}`, time: session.createdAt || session.date, to: '/sessions' })),
    ...joinedSessions.map(session => ({ id: `joined-${session.id}`, kind: 'Sessions', title: `Joined: ${session.title}`, detail: `${session.date || 'Date to be confirmed'}${session.time ? ` · ${session.time}` : ''}`, time: session.date, to: '/sessions' })),
    ...learningRecords.submissions.map(submission => ({ id: `assignment-${submission.id}`, kind: 'Assignments', title: `Submitted: ${submission.assignmentTitle}`, detail: `${submission.moduleName} · ${submission.status}`, time: submission.submittedAt, to: '/assignments' })),
    ...completedProgress.map(item => ({ id: `progress-${item.schoolCode}-${item.moduleId}-${item.topicId}`, kind: 'Progress', title: 'Completed a learning topic', detail: `${CURRICULA[({ SOP: 'programming', SOB: 'business', SOF: 'finance' })[item.schoolCode]]?.shortName || item.schoolCode} curriculum`, time: item.completedAt, to: '/progress' })),
  ].sort((a, b) => (new Date(b.time).getTime() || 0) - (new Date(a.time).getTime() || 0)), [ownQuestions, ownAnswers, ownDiscussions, ownComments, ownSessions, joinedSessions, learningRecords.submissions, completedProgress]);

  const filteredActivities = activities.filter(item => (filter === 'All activity' || item.kind === filter) && (!search || `${item.title} ${item.detail || ''} ${item.kind}`.toLowerCase().includes(search.trim().toLowerCase())));
  const stats = [
    { label: 'Questions asked', value: ownQuestions.length, icon: CircleHelp, tone: 'violet' },
    { label: 'Answers given', value: ownAnswers.length, icon: MessageCircle, tone: 'mint' },
    { label: 'Discussions started', value: ownDiscussions.length, icon: Users, tone: 'amber' },
    { label: 'Comments added', value: ownComments.length, icon: MessageSquare, tone: 'blue' },
    { label: 'Topics completed', value: completedProgress.length, icon: BookOpen, tone: 'mint' },
    { label: 'Assignments submitted', value: learningRecords.submissions.length, icon: CheckCircle2, tone: 'amber' },
    { label: 'Sessions hosted or joined', value: ownSessions.length + joinedSessions.length, icon: CalendarDays, tone: 'blue' },
  ];
  const totalContributions = stats.reduce((total, stat) => total + stat.value, 0);

  return <div className="contributions-page">
    <PageHead eyebrow="YOUR LEARNING JOURNEY" title="My contributions" sub="A record of what you have asked, shared and completed in your campus community." action={<Link to="/ask" className="btn btn-primary"><Plus size={16}/>Share a doubt</Link>}/>

    <section className="contributions-hero">
      <div className="contributions-hero-copy"><span className="contributions-hero-kicker"><Sparkles size={14}/> YOUR CAMPUS IMPACT</span><h2>{totalContributions ? 'Every contribution moves learning forward.' : 'Your learning story starts here.'}</h2><p>{totalContributions ? `${totalContributions} recorded contributions from ${learnerName || 'you'} are bringing the community together.` : 'Ask a question, help someone with an answer, or share an idea to start building your contribution history.'}</p></div>
      <div className="contributions-hero-total"><span>YOUR ACTIVITY</span><b>{totalContributions}</b><small>contributions recorded</small><Activity size={22}/></div>
      <div className="contributions-hero-actions"><Link to="/discussions/new"><MessageSquare size={15}/>Start a discussion<ArrowRight size={14}/></Link><Link to="/share-learning"><BookOpen size={15}/>Share learning<ArrowRight size={14}/></Link></div>
    </section>

    <section className="contributions-stats" aria-label="Your contribution totals">
      {stats.map(({ label, value, icon: Icon, tone }) => <article className={`contribution-stat contribution-stat-${tone}`} key={label}><span><Icon size={17}/></span><div><b>{value}</b><small>{label}</small></div></article>)}
    </section>

    <section className="panel contribution-history">
      <header className="contribution-history-head"><div><p className="eyebrow">YOUR RECENT ACTIVITY</p><h2>Contribution history</h2><span>Questions, replies, learning and progress in one place.</span></div><label className="contribution-search"><Search size={16}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search your activity" aria-label="Search your contributions"/></label></header>
      <div className="contribution-filters" role="tablist" aria-label="Filter contribution activity">{activityTypes.map(type => <button type="button" role="tab" aria-selected={filter === type} className={filter === type ? 'is-active' : ''} key={type} onClick={() => setFilter(type)}>{type}<span>{type === 'All activity' ? activities.length : activities.filter(item => item.kind === type).length}</span></button>)}</div>
      <div className="contribution-activity-list">
        {filteredActivities.map(item => {
          const Icon = typeIcons[typeLabels[item.kind]] || Activity;
          return <Link to={item.to} className="contribution-activity" key={item.id}><span className={`contribution-activity-icon contribution-icon-${item.kind.toLowerCase()}`}><Icon size={17}/></span><span className="contribution-activity-copy"><b>{item.title}</b>{item.detail && <small>{item.detail}</small>}<span>{typeLabels[item.kind]} <i/> {formatActivityTime(item.time)}</span></span><ArrowRight className="contribution-activity-arrow" size={16}/></Link>;
        })}
        {!filteredActivities.length && <div className="contribution-empty"><span><Activity size={21}/></span><h3>{recordsLoading ? 'Loading your learning activity...' : search || filter !== 'All activity' ? 'No matching activity' : 'Your story starts here'}</h3><p>{recordsLoading ? 'We are gathering your saved contributions.' : search || filter !== 'All activity' ? 'Try another filter or search phrase.' : 'Post a question, write an answer, or share learning to see it appear here.'}</p>{!recordsLoading && filter === 'All activity' && <div><Link to="/ask" className="btn btn-primary"><Plus size={15}/>Ask a doubt</Link><Link to="/discussions/new" className="btn btn-outline"><MessageSquare size={15}/>Start a discussion</Link></div>}</div>}
      </div>
      <footer className="contribution-history-foot"><span>Showing {filteredActivities.length} of {activities.length} contributions</span><Link to="/progress">View your learning progress <ArrowRight size={14}/></Link></footer>
    </section>
  </div>;
}
