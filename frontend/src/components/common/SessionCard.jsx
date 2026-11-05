import { ArrowRight, CalendarDays, Users } from 'lucide-react';
import { useApp } from '../../state.jsx';
import Avatar from './Avatar.jsx';
import Button from './Button.jsx';
import Tag from './Tag.jsx';

const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
export default function SessionCard({ s }) {
  const { mutate, notify } = useApp();
  return <article className="content-card session-card"><div className="session-date"><b>{s.date === 'Today' ? '06' : s.date === 'Tomorrow' ? '07' : s.date.replace(/\D/g, '') || '08'}</b><span>NOV</span></div><div className="session-main"><div className="session-line"><Tag>{s.category}</Tag><span className={`status status-${slug(s.status)}`}>{s.status === 'Ongoing' && <i/>}{s.status}</span></div><h3>{s.title}</h3><p>{s.description}</p><div className="session-meta"><span><Avatar initials={s.initials} size="xs"/>{s.host}</span><span><CalendarDays size={14}/>{s.date} · {s.time}</span><span><Users size={14}/>{s.participants} joined</span><span>{s.duration} min</span></div></div><Button kind={s.registered ? 'outline' : 'primary'} onClick={async () => { if (!s.registered) { try { await mutate('sessions', 'register', { id: s.id }); notify('You are registered!'); } catch (error) { notify(error.message); } } else { window.open(s.link, '_blank', 'noopener'); notify('Opening demo Meet link'); } }}>{s.registered ? 'Join session' : 'Register'} <ArrowRight size={15}/></Button></article>;
}
