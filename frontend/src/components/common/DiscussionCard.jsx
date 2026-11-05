import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bookmark, Heart, MessageCircle, Send } from 'lucide-react';
import { useApp } from '../../state.jsx';
import Avatar from './Avatar.jsx';
import Tag from './Tag.jsx';

export default function DiscussionCard({ d }) {
  const { toggle, update, notify } = useApp();
  const go = useNavigate();
  return <article className="content-card discussion-card"><div className="discussion-top"><Avatar initials={d.initials}/><div className="author-block"><b>{d.author}</b><span>{d.time}</span></div><button className={`save-btn ${d.saved ? 'saved' : ''}`} onClick={() => { toggle('discussions', d.id, 'saved'); notify(d.saved ? 'Bookmark removed' : 'Discussion bookmarked'); }} aria-label="Bookmark"><Bookmark size={17}/></button></div><button className="text-title discussion-title" onClick={() => go(`/discussions/${d.id}`)}>{d.title}</button><p className="card-description">{d.description}</p><div className="card-tags">{d.tags.map(t => <Tag key={t} variant="muted">#{t}</Tag>)}</div><div className="discussion-actions"><button onClick={() => { update('discussions', rows => rows.map(row => row.id === d.id ? { ...row, likes: row.likes + 1 } : row)); notify('You liked this discussion'); }}><Heart size={16}/>{d.likes}</button><button onClick={() => go(`/discussions/${d.id}`)}><MessageCircle size={16}/>{d.comments.length} comments</button><button onClick={() => { navigator.clipboard?.writeText(location.origin + `/discussions/${d.id}`); notify('Discussion link copied'); }}><Send size={15}/>Share</button><button className="view-discussion" onClick={() => go(`/discussions/${d.id}`)}>View discussion <ArrowRight size={14}/></button></div></article>;
}
