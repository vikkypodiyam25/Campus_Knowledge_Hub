import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Check, CircleHelp, MessageSquare, Plus } from 'lucide-react';
import { useApp } from '../state.jsx';
import { Button, PageHead, cats } from '../components/common/index.jsx';

export default function FormPage({ type }) {
  const { data, mutate, notify } = useApp();
  const categories = [...new Set([...(data.categories?.length ? data.categories : cats.slice(1)), 'Community', 'Learning'])];
  const go = useNavigate();
  const isQuestion = type === 'question';
  const isSession = type === 'session';
  const title = isQuestion ? 'Ask a doubt' : isSession ? 'Create a live session' : 'Start a discussion';
  const [form, setForm] = useState({ title: '', description: '', category: isQuestion ? 'React' : isSession ? 'JavaScript' : 'Community', tags: '', date: '', time: '', duration: '60', link: 'https://meet.google.com/abc-defg-hij' });
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return notify('Please fill in the title and description');
    if (isSession && (!form.date || !form.time)) return notify('Please choose a session date and time');
    const collection = isQuestion ? 'questions' : isSession ? 'sessions' : 'discussions';
    const payload = { ...form, duration: Number(form.duration), tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean) };
    try {
      await mutate(collection, 'create', { payload });
      notify(`${isQuestion ? 'Question' : isSession ? 'Session' : 'Discussion'} created successfully`);
      go(isQuestion ? '/questions' : isSession ? '/sessions' : '/discussions');
    } catch (error) { notify(error.message); }
  }

  return <>
    <button className="back-link" onClick={() => go(-1)}><ArrowLeft size={15}/> Back</button>
    <PageHead eyebrow="MAKE IT HAPPEN" title={title} sub={isQuestion ? 'A clear question helps the community give you a great answer.' : isSession ? 'Bring learners together for a focused, friendly session.' : 'Share an idea, a question or something you have learned.'}/>
    <form className="form-card" onSubmit={submit}>
      <div className="form-intro"><span className="form-icon">{isQuestion ? <CircleHelp size={20}/> : isSession ? <CalendarDays size={20}/> : <MessageSquare size={20}/>}</span><div><b>Tell us more</b><p>Fields marked with * are required.</p></div></div>
      <label className="field-label">{isQuestion ? 'Question' : isSession ? 'Session' : 'Discussion'} title *<input required maxLength="120" value={form.title} onChange={event => set('title', event.target.value)} placeholder="Give your post a clear, descriptive title"/></label>
      <label className="field-label">Description *<textarea required rows="6" value={form.description} onChange={event => set('description', event.target.value)} placeholder="Add details, context and what you have tried so far..."/></label>
      <div className="form-two"><label className="field-label">{isSession ? 'Topic' : 'Category'} *<select value={form.category} onChange={event => set('category', event.target.value)}>{categories.map(category => <option key={category}>{category}</option>)}</select></label>{!isSession && <label className="field-label">Tags<input value={form.tags} onChange={event => set('tags', event.target.value)} placeholder="react, hooks, beginner"/><small>Separate tags with commas</small></label>}</div>
      {isSession && <><div className="form-two"><label className="field-label">Date *<input type="date" required value={form.date} onChange={event => set('date', event.target.value)}/></label><label className="field-label">Time *<input type="time" required value={form.time} onChange={event => set('time', event.target.value)}/></label></div><div className="form-two"><label className="field-label">Duration (minutes)<input type="number" min="15" max="240" value={form.duration} onChange={event => set('duration', event.target.value)}/></label><label className="field-label">Google Meet link<input type="url" value={form.link} onChange={event => set('link', event.target.value)}/></label></div></>}
      <div className="form-footer"><span><Check size={15}/> Saved to your account</span><div><Button kind="outline" type="button" onClick={() => go(-1)}>Cancel</Button><Button type="submit"><Plus size={16}/>{isQuestion ? 'Post question' : isSession ? 'Create session' : 'Publish discussion'}</Button></div></div>
    </form>
  </>;
}
