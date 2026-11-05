import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, Circle, ClipboardList, ExternalLink } from 'lucide-react';
import { useApp } from '../state.jsx';
import api from '../api.js';
import { getCurriculum } from '../data/curricula.js';

function AssignmentSubmissionForm({ assignment, schoolCode, existing, onSubmitted }) {
  const { notify } = useApp();
  const [submissionText, setSubmissionText] = useState(existing?.submissionText || '');
  const [submissionUrl, setSubmissionUrl] = useState(existing?.submissionUrl || '');
  const [saving, setSaving] = useState(false);
  const submit = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await api.post('/assignments/submissions', { schoolCode, moduleId: assignment.moduleId, submissionText, submissionUrl });
      onSubmitted(result.data);
      notify('Assignment submitted to your instructor.');
    } catch (error) { notify(error.message || 'Could not submit assignment.'); }
    finally { setSaving(false); }
  };
  return <form className="assignment-submit-form" onSubmit={submit}>
    <label>Your response<textarea required minLength={1} maxLength={10000} rows={5} value={submissionText} onChange={event => setSubmissionText(event.target.value)} placeholder="Write your work, calculations, decisions, and notes here…" /></label>
    <label>Optional project or document link<input type="url" value={submissionUrl} onChange={event => setSubmissionUrl(event.target.value)} placeholder="https://…" /></label>
    {existing && <p className="assignment-submit-status">{existing.status}{existing.score !== null && existing.score !== undefined ? ` · ${existing.score}/100` : ''}{existing.adminFeedback ? ` — ${existing.adminFeedback}` : ''}</p>}
    <button className="assignment-submit-button" type="submit" disabled={saving}>{saving ? 'Saving submission…' : existing ? 'Update submission' : 'Submit assignment'}</button>
  </form>;
}

export default function SchoolItem({ kind }) {
  const { subjectId, moduleId } = useParams();
  const { data, notify } = useApp();
  const navigate = useNavigate();
  const base = getCurriculum(data.profile?.subject);
  const [curriculum, setCurriculum] = useState(base);
  const [progress, setProgress] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [saving, setSaving] = useState('');

  useEffect(() => {
    let active = true;
    if (!base?.code) return undefined;
    Promise.all([api.get(`/curriculum/${base.code}`), api.get('/progress'), api.get('/assignments/submissions')]).then(([result, saved, submitted]) => {
      if (active) { setCurriculum(result.data); setProgress(saved.data || []); setSubmissions(submitted.data || []); }
    }).catch(error => { if (active) notify(error.message || 'Could not load learning content.'); });
    return () => { active = false; };
  }, [base?.code]);

  const item = useMemo(() => kind === 'subject'
    ? curriculum?.subjects?.find(subject => subject.id === subjectId)
    : curriculum?.modules?.find(module => module.id === moduleId), [curriculum, kind, moduleId, subjectId]);
  if (!curriculum || !item) return <section className="panel"><h1>Learning item not found</h1><Link to="/dashboard">Back to dashboard</Link></section>;

  const moduleKey = item.id;
  const topics = kind === 'subject'
    ? item.modules.flatMap(module => module.topics.map((topic, index) => ({ topic, description: module.lessonDetails?.[index], key: `${moduleKey}-${index}` })))
    : item.topics.map((topic, index) => ({ topic, description: item.lessonDetails?.[index], key: `${moduleKey}-${index}` }));
  const assignments = kind === 'subject' ? item.modules.filter(module => module.assignment).map(module => ({ ...module.assignment, moduleId: module.id, moduleName: module.name })) : item.assignment ? [{ ...item.assignment, moduleId: item.id, moduleName: item.name }] : [];
  const resources = item.resources || curriculum.resources || [];
  const completed = new Set(progress.filter(row => row.schoolCode === curriculum.code && row.status === 'completed').map(row => row.topicId));
  const toggle = async topicId => {
    setSaving(topicId);
    const status = completed.has(topicId) ? 'not_started' : 'completed';
    try {
      await api.post('/progress', { schoolCode: curriculum.code, moduleId: moduleKey, topicId, status });
      setProgress(rows => [...rows.filter(row => !(row.schoolCode === curriculum.code && row.moduleId === moduleKey && row.topicId === topicId)), { schoolCode: curriculum.code, moduleId: moduleKey, topicId, status }]);
    } catch (error) { notify(error.message || 'Could not save progress.'); }
    finally { setSaving(''); }
  };

  return <div className="school-detail-page">
    <button type="button" className="subtle-link" onClick={() => navigate('/dashboard')}><ArrowLeft size={15}/> Back to {curriculum.shortName}</button>
    <header className="school-detail-heading"><span className={`school-code school-${curriculum.accent}`}>{curriculum.code}</span><p className="eyebrow">{curriculum.name}</p><h1>{item.name}</h1><p>{item.description || curriculum.description}</p></header>
    <section className="panel school-topic-panel"><div className="school-detail-section-head"><div><BookOpen size={18}/><h2>Topics & learning progress</h2></div><span>{topics.filter(({ key }) => completed.has(key)).length} / {topics.length} completed</span></div>
      <div className="school-topic-list">{topics.map(({ topic, description, key }) => { const done = completed.has(key); return <button type="button" key={key} className={`school-topic-row ${done ? 'is-complete' : ''}`} disabled={saving === key} onClick={() => toggle(key)}><span>{done ? <CheckCircle2 size={19}/> : <Circle size={19}/>}</span><span><b>{topic}</b><small>{description || (done ? 'Completed · click to reset' : 'Mark complete when you finish this topic.')}</small></span></button>; })}</div>
    </section>
    <div className="school-extra-grid">
      <section className="panel"><div className="school-detail-section-head"><div><ExternalLink size={17}/><h2>Learning resources</h2></div></div><div className="school-resource-list">{resources.map(resource => <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer"><b>{resource.title}</b><span>{resource.description}</span><small>Open resource ↗</small></a>)}</div></section>
      <section className="panel"><div className="school-detail-section-head"><div><ClipboardList size={17}/><h2>Assignments & activities</h2></div><span>{assignments.length} practical task{assignments.length === 1 ? '' : 's'}</span></div><div className="school-assignment-list">{assignments.map(assignment => <article className="school-assignment" key={assignment.title}><small>{assignment.moduleName}</small><h3>{assignment.title}</h3><p>{assignment.brief}</p><b>Submit these items</b><ul>{assignment.deliverables.map(deliverable => <li key={deliverable}>{deliverable}</li>)}</ul><b>Evaluation</b><ul>{assignment.evaluation.map(criterion => <li key={criterion}>{criterion}</li>)}</ul><AssignmentSubmissionForm assignment={assignment} schoolCode={curriculum.code} existing={submissions.find(row => row.assignmentId === assignment.moduleId)} onSubmitted={saved => setSubmissions(current => [...current.filter(row => row.assignmentId !== saved.assignmentId), saved])}/></article>)}</div></section>
    </div>
  </div>;
}
