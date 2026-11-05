import { useNavigate } from 'react-router-dom';
import { Bookmark, MessageCircle, ThumbsUp } from 'lucide-react';
import { useApp } from '../../state.jsx';
import Avatar from './Avatar.jsx';
import Tag from './Tag.jsx';

export default function QuestionCard({ q }) {
  const { toggle, update, notify } = useApp();
  const go = useNavigate();
  return <article className="content-card question-card"><div className="card-main"><button className="vote-box" onClick={() => { update('questions', rows => rows.map(row => row.id === q.id ? { ...row, votes: row.votes + 1 } : row)); notify('Upvote added'); }} aria-label="Upvote"><ThumbsUp size={16}/><b>{q.votes}</b></button><div className="card-copy"><div className="card-title-row"><button className="text-title" onClick={() => go(`/questions/${q.id}`)}>{q.title}</button><button className={`save-btn ${q.saved ? 'saved' : ''}`} onClick={() => { toggle('questions', q.id, 'saved'); notify(q.saved ? 'Bookmark removed' : 'Question saved to bookmarks'); }} aria-label="Bookmark"><Bookmark size={17}/></button></div><p className="card-description">{q.description}</p><div className="card-tags"><Tag>{q.category}</Tag>{q.tags.slice(0, 2).map(t => <Tag key={t} variant="muted">#{t}</Tag>)}</div><div className="card-meta"><span><Avatar initials={q.initials} size="xs"/>{q.author}</span><span className="meta-dot"/><span>{q.time}</span><span className="meta-spacer"/><span className="answer-count"><MessageCircle size={15}/>{q.answers.length} answers</span></div></div></div></article>;
}
