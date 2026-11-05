import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bookmark, Heart, MessageCircle, Send } from 'lucide-react';
import { useApp } from '../../state.jsx';
import Avatar from './Avatar.jsx';
import Tag from './Tag.jsx';

export default function DiscussionCard({ d }) {
  const { mutate, notify } = useApp();
  const go = useNavigate();
  return <article className="content-card discussion-card"><div className="discussion-top"><Avatar initials={d.initials}/><div className="author-block"><b>{d.author}</b><span>{d.time}</span></div><button className={`save-btn ${d.saved ? 'saved' : ''}`} onClick={async () => { try { await mutate('discussions', 'toggleBookmark', { id: d.id }); notify(d.saved ? 'Bookmark removed' : 'Discussion bookmarked'); } catch (error) { notify(error.message); } }} aria-label="Bookmark"><Bookmark size={17}/></button></div><button className="text-title discussion-title" onClick={() => go(`/discussions/${d.id}`)}>{d.title}</button><p className="card-description">{d.description}</p><div className="card-tags">{d.tags.map(t => <Tag key={t} variant="muted">#{t}</Tag>)}</div><div className="discussion-actions"><button onClick={async () => { try { await mutate('discussions', 'like', { id: d.id }); notify('You liked this discussion'); } catch (error) { notify(error.message); } }}><Heart size={16}/>{d.likes}</button><button onClick={() => go(`/discussions/${d.id}`)} aria-label={`Open ${d.comments.length} comments and write a comment`}><MessageCircle size={16}/>{d.comments.length} comments · Add comment</button><button onClick={() => { navigator.clipboard?.writeText(location.origin + `/discussions/${d.id}`); notify('Discussion link copied'); }}><Send size={15}/>Share</button><button className="view-discussion" onClick={() => go(`/discussions/${d.id}`)}>View discussion <ArrowRight size={14}/></button></div></article>;
}
