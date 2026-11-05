import React, { useEffect, useState } from 'react';
import { BookOpen, ClipboardList, ExternalLink } from 'lucide-react';
import { useApp } from '../state.jsx';
import { getCurriculum, getSchoolAssignments, getSchoolModules, getSchoolResources } from '../data/curricula.js';
import api from '../api.js';

export default function LearningOverview({ type }) {
  const { data, notify } = useApp();
  const curriculum = getCurriculum(data.profile?.subject);
  const [progress, setProgress] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  useEffect(() => {
    if (!['progress', 'assignments'].includes(type)) return undefined;
    let active = true;
    api.get(type === 'progress' ? '/progress' : '/assignments/submissions').then(result => { if (active && type === 'progress') setProgress(result.data || []); if (active && type === 'assignments') setSubmissions(result.data || []); }).catch(() => {});
    return () => { active = false; };
  }, [type]);
  const title = type === 'resources' ? 'Learning Resources' : type === 'assignments' ? 'Assignments' : 'My Progress';
  const Icon = type === 'resources' ? ExternalLink : type === 'assignments' ? ClipboardList : BookOpen;
  const rows = progress.filter(row => row.schoolCode === curriculum?.code && row.status === 'completed');
  const assignments = getSchoolAssignments(curriculum);
  const modules = getSchoolModules(curriculum);
  const resources = getSchoolResources(curriculum);
  const submitAssignment = async (event, assignment) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await api.post('/assignments/submissions', { schoolCode: curriculum.code, moduleId: assignment.moduleId, submissionText: form.get('submissionText'), submissionUrl: form.get('submissionUrl') });
      setSubmissions(current => [...current.filter(row => row.assignmentId !== assignment.moduleId), result.data]);
      notify('Assignment submitted to your instructor.');
    } catch (error) { notify(error.message || 'Could not submit assignment.'); }
  };
  return <div className="school-detail-page"><header className="school-detail-heading"><span className="school-code">{curriculum?.code || 'LEARN'}</span><p className="eyebrow">{curriculum?.name || 'Your learning space'}</p><h1>{title}</h1><p>{type === 'progress' ? `You have completed ${rows.length} topics in your current school. Progress is saved separately for each school.` : `${title} for ${curriculum?.shortName || 'your school'}.`}</p></header><section className="panel"><div className="school-detail-section-head"><div><Icon size={18}/><h2>{type === 'progress' ? 'Topic completion' : title}</h2></div>{type === 'progress' && <span>{rows.length} completed</span>}</div>{type === 'progress' ? <div className="school-topic-list">{rows.map(row => { const module = modules.find(item => item.id === row.moduleId || item.parentId === row.moduleId); const index = Number(row.topicId.match(/-(\d+)$/)?.[1]); const topic = Number.isInteger(index) ? module?.topics[index] : row.topicId; return <div className="school-topic-row is-complete" key={`${row.moduleId}-${row.topicId}`}><BookOpen size={18}/><span><b>{topic || row.topicId}</b><small>{module?.name || row.moduleId} · Completed</small></span></div>; })}{!rows.length && <p className="school-empty-note">Complete topics from your curriculum to track progress here.</p>}</div> : type === 'resources' ? <div className="school-resource-list">{resources.map(resource => <a key={resource.url} href={resource.url} target="_blank" rel="noreferrer"><b>{resource.title}</b><span>{resource.description}</span><small>Open resource ↗</small></a>)}</div> : <div className="school-assignment-list">{assignments.map(assignment => { const existing = submissions.find(row => row.assignmentId === assignment.moduleId); return <article className="school-assignment" key={assignment.title}><small>{assignment.subjectName || assignment.moduleName}</small><h3>{assignment.title}</h3><p>{assignment.brief}</p><b>Submit</b><ul>{assignment.deliverables.map(item => <li key={item}>{item}</li>)}</ul><b>Evaluation</b><ul>{assignment.evaluation.map(item => <li key={item}>{item}</li>)}</ul><form className="assignment-submit-form" onSubmit={event => submitAssignment(event, assignment)}><label>Your response<textarea required maxLength={10000} rows={4} name="submissionText" defaultValue={existing?.submissionText || ''} placeholder="Write your work and explain your decisions…"/></label><label>Optional project link<input name="submissionUrl" type="url" defaultValue={existing?.submissionUrl || ''} placeholder="https://…"/></label>{existing && <p className="assignment-submit-status">Status: {existing.status}{existing.score != null ? ` · ${existing.score}/100` : ''}{existing.adminFeedback ? ` — ${existing.adminFeedback}` : ''}</p>}<button className="assignment-submit-button" type="submit">{existing ? 'Update submission' : 'Submit assignment'}</button></form></article>; })}</div>}</section></div>;
}
