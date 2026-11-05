import React, { useState } from 'react';
import { ArrowRight, BookOpen, BriefcaseBusiness, Code2, Landmark, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CURRICULA } from '../data/curricula.js';
import { useApp } from '../state.jsx';
import api from '../api.js';

const icons = { programming: Code2, business: BriefcaseBusiness, finance: Landmark };

export default function ChooseSubject() {
  const { data, mutate, notify } = useApp();
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const choose = async id => {
    setSaving(true);
    try {
      // Keep school selection working against a server that has not yet been restarted
      // with the dedicated endpoint; the existing profile action also validates IDs.
      try { await api.post('/schools/select', { schoolCode: CURRICULA[id].code }); } catch { /* Fall back to the established profile action. */ }
      await mutate('profile', 'updateProfile', { payload: { subject: id } });
      notify(`${CURRICULA[id].shortName} curriculum selected`);
      navigate('/dashboard', { replace: true });
    } catch (error) { notify(error.message || 'Could not save your learning path.'); }
    finally { setSaving(false); }
  };

  return <main className="choose-subject-page">
    <header className="choose-subject-heading">
      <span className="choose-subject-mark"><Sparkles size={20}/></span>
      <p className="eyebrow">YOUR LEARNING, YOUR WAY</p>
      <h1>Welcome to Campus Knowledge Hub</h1>
      <p>Choose your school and start your learning journey.</p>
    </header>
    <section className="subject-grid" aria-label="Available schools">
      {['programming', 'business', 'finance'].map((schoolId, index) => {
        const course = CURRICULA[schoolId];
        const Icon = icons[course.id];
        const selected = data.profile.subject === course.id;
        return <article className={`subject-card subject-${course.accent} ${selected ? 'subject-selected' : ''}`} key={course.id} style={{ '--subject-index': index }}>
          <div className="subject-card-top"><span className="subject-icon"><Icon size={22}/></span><span className="subject-current">{course.code}</span></div>
          <h2>{course.name}</h2>
          <p>{course.description}</p>
          <div className="subject-topics"><span>CURRICULUM PREVIEW</span><div>{course.categories.slice(0, 4).map(topic => <i key={topic}>{topic}</i>)}</div></div>
          <button type="button" onClick={() => choose(course.id)} disabled={saving} className="subject-choose">{saving ? 'Saving…' : selected ? 'Continue learning' : `Explore ${course.code}`}<ArrowRight size={16}/></button>
        </article>;
      })}
    </section>
    <p className="choose-subject-foot"><BookOpen size={15}/> You can change your school any time from the workspace sidebar.</p>
  </main>;
}
