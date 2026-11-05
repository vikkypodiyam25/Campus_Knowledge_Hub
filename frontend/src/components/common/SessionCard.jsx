import { ArrowRight, CalendarDays, Users } from 'lucide-react';
import { useApp } from '../../state.jsx';
import Avatar from './Avatar.jsx';
import Button from './Button.jsx';
import Tag from './Tag.jsx';

const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function getSessionDate(value) {
  const today = new Date();
  let date;
  if (value === 'Today') date = today;
  else if (value === 'Tomorrow') date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  else {
    const isoDate = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    const shortDate = String(value || '').match(/^([A-Za-z]{3,})\s+(\d{1,2})(?:,\s*(\d{4}))?$/);
    if (isoDate) date = new Date(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]));
    else if (shortDate) date = new Date(Number(shortDate[3] || today.getFullYear()), new Date(`${shortDate[1]} 1, 2000`).getMonth(), Number(shortDate[2]));
    else date = new Date(value);
  }
  if (!date || Number.isNaN(date.getTime())) return { day: '--', month: 'TBD', label: String(value || 'Date to be confirmed') };
  return {
    day: new Intl.DateTimeFormat('en-US', { day: 'numeric' }).format(date),
    month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date).toUpperCase(),
    label: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date),
  };
}

function formatSessionTime(value) {
  const clockTime = String(value || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!clockTime) return value;
  const date = new Date(2000, 0, 1, Number(clockTime[1]), Number(clockTime[2]));
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
}

export default function SessionCard({ s }) {
  const { mutate, notify } = useApp();
  const date = getSessionDate(s.date);
  const time = formatSessionTime(s.time);
  return <article className="content-card session-card">
    <div className="session-date" aria-label={date.label}><b>{date.day}</b><span>{date.month}</span></div>
    <div className="session-main">
      <div className="session-line"><Tag>{s.category}</Tag><span className={`status status-${slug(s.status)}`}>{s.status === 'Ongoing' && <i/>}{s.status}</span></div>
      <h3>{s.title}</h3>
      <p>{s.description}</p>
      <div className="session-meta">
        <span className="session-host"><Avatar initials={s.initials} size="xs"/><span className="session-host-name">{s.host}</span></span>
        <span><CalendarDays size={14}/>{date.label}{time && ` · ${time}`}</span>
        <span><Users size={14}/>{s.participants} joined</span>
        <span>{s.duration} min</span>
      </div>
    </div>
    <Button kind={s.registered ? 'outline' : 'primary'} onClick={async () => { if (!s.registered) { try { await mutate('sessions', 'register', { id: s.id }); notify('You are registered!'); } catch (error) { notify(error.message); } } else { window.open(s.link, '_blank', 'noopener'); notify('Opening demo Meet link'); } }}>{s.registered ? 'Join session' : 'Register'} <ArrowRight size={15}/></Button>
  </article>;
}
