import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, BookOpen, Check, Download, LogOut, Moon, RotateCcw, Sparkles, Sun, UserRound } from 'lucide-react';
import { useApp } from '../state.jsx';
import { Avatar, PageHead } from '../components/common/index.jsx';
import { getCurriculum } from '../data/curricula.js';

function Toggle({ label, description, value, disabled, onChange }) {
  return <div className="setting-option"><span><b>{label}</b><small>{description}</small></span><button type="button" role="switch" aria-checked={Boolean(value)} aria-label={label} disabled={disabled} onClick={() => onChange(!value)} className={`setting-switch ${value ? 'is-on' : ''}`}><i/></button></div>;
}

function SettingsSection({ icon: Icon, title, description, children, accent = '' }) {
  return <section className="panel settings-card"><header className="settings-card-heading"><span className={`settings-card-icon ${accent}`}><Icon size={18}/></span><div><h2>{title}</h2><p>{description}</p></div></header><div className="settings-card-content">{children}</div></section>;
}

export default function SettingsPage() {
  const { data, auth, mutate, notify, api, clearUserSession } = useApp();
  const [preferences, setPreferences] = useState(data.preferences);
  const [saving, setSaving] = useState('');
  const navigate = useNavigate();
  const currentSchool = getCurriculum(data.profile.subject);

  useEffect(() => setPreferences(data.preferences), [data.preferences]);

  const savePreference = async (key, value) => {
    const previous = preferences;
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    setSaving(key);
    try {
      await mutate('preferences', 'updatePreferences', { payload: { [key]: value } });
      notify('Setting saved');
    } catch (error) {
      setPreferences(previous);
      notify(error.message || 'Could not save this setting.');
    } finally { setSaving(''); }
  };

  const resetPreferences = async () => {
    const defaults = { email: true, answers: true, sessions: false, assignmentUpdates: true, studyReminders: false, dark: false, reducedMotion: false };
    setPreferences(defaults);
    setSaving('reset');
    try { await mutate('preferences', 'updatePreferences', { payload: defaults }); notify('Settings restored to defaults'); }
    catch (error) { setPreferences(data.preferences); notify(error.message || 'Could not reset settings.'); }
    finally { setSaving(''); }
  };

  const downloadData = () => {
    const file = new Blob([JSON.stringify({ profile: data.profile, preferences: data.preferences, questions: data.questions, discussions: data.discussions, sessions: data.sessions }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `learnconnect-data-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    notify('Your data download is ready');
  };

  const signOut = async () => {
    try { await api.post('/auth/logout'); } catch { /* The local session must still be cleared if the server is offline. */ }
    localStorage.removeItem('learnconnect-user-session');
    sessionStorage.removeItem('learnconnect-user-session');
    clearUserSession();
    navigate('/login', { replace: true });
  };

  return <div className="settings-page">
    <PageHead eyebrow="MAKE IT YOURS" title="Settings" sub="Manage your account, learning preferences and notifications."/>

    <div className="settings-layout">
      <SettingsSection icon={UserRound} title="Account" description="Your account details and current learning school.">
        <div className="settings-account-row"><Avatar initials={(data.profile.name || 'Student').split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()}/><div className="settings-account-copy"><b>{data.profile.name || 'Student'}</b><small>{auth.user?.email || data.profile.username} · {data.profile.role || 'Student'}</small></div><Link to="/profile" className="settings-action-link">Edit profile <ArrowRight size={14}/></Link></div>
        <div className="settings-school-row"><span><BookOpen size={16}/><b>{currentSchool ? `Selected school: ${currentSchool.name}` : 'No school selected'}</b></span><Link to="/choose-subject">Change school <ArrowRight size={14}/></Link></div>
      </SettingsSection>

      <SettingsSection icon={Bell} title="Notifications" description="Choose which learning updates you want to receive." accent="settings-blue">
        <Toggle label="Weekly learning digest" description="A summary preference for your weekly activity updates." value={preferences.email} disabled={Boolean(saving)} onChange={value => savePreference('email', value)}/>
        <Toggle label="Answers to my questions" description="Keep this preference on for replies to your questions." value={preferences.answers} disabled={Boolean(saving)} onChange={value => savePreference('answers', value)}/>
        <Toggle label="Live session reminders" description="Keep this preference on for reminders about sessions you join." value={preferences.sessions} disabled={Boolean(saving)} onChange={value => savePreference('sessions', value)}/>
        <Toggle label="Assignment review updates" description="Track when an instructor reviews or comments on your submission." value={preferences.assignmentUpdates ?? true} disabled={Boolean(saving)} onChange={value => savePreference('assignmentUpdates', value)}/>
        <Toggle label="Study reminders" description="Opt in to study reminder notifications when available." value={preferences.studyReminders ?? false} disabled={Boolean(saving)} onChange={value => savePreference('studyReminders', value)}/>
      </SettingsSection>

      <SettingsSection icon={preferences.dark ? Sun : Moon} title="Appearance" description="Choose a comfortable, accessible way to view LearnConnect." accent="settings-purple">
        <Toggle label="Dark appearance" description="Use the dark color palette across the student workspace." value={preferences.dark} disabled={Boolean(saving)} onChange={value => savePreference('dark', value)}/>
        <Toggle label="Reduce motion" description="Reduce interface animation and transition effects." value={preferences.reducedMotion ?? false} disabled={Boolean(saving)} onChange={value => savePreference('reducedMotion', value)}/>
      </SettingsSection>

      <SettingsSection icon={Sparkles} title="Your learning space" description="Quick links to settings that shape your student workspace." accent="settings-green">
        <div className="settings-link-row"><span><BookOpen size={16}/><b>Curriculum and school</b></span><Link to="/choose-subject">Manage <ArrowRight size={14}/></Link></div>
        <div className="settings-link-row"><span><Check size={16}/><b>Assignments and progress</b></span><Link to="/assignments">View assignments <ArrowRight size={14}/></Link></div>
      </SettingsSection>

      <SettingsSection icon={Download} title="Your data" description="Download a copy of the profile and learning activity currently saved to your account." accent="settings-green">
        <button type="button" className="settings-outline-button" onClick={downloadData}><Download size={15}/>Download my data</button>
      </SettingsSection>

      <SettingsSection icon={RotateCcw} title="Reset preferences" description="Restore notification and appearance options to their defaults." accent="settings-red">
        <button type="button" className="settings-outline-button" disabled={Boolean(saving)} onClick={resetPreferences}>{saving === 'reset' ? 'Resetting…' : 'Restore default settings'}</button>
      </SettingsSection>

      <SettingsSection icon={LogOut} title="Sign out" description="End this signed-in session on this device." accent="settings-red">
        <button type="button" className="settings-danger-button" onClick={signOut}><LogOut size={15}/>Sign out of this device</button>
      </SettingsSection>
    </div>
  </div>;
}
