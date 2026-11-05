import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, MessageCircle, Send, ThumbsUp } from 'lucide-react';
import { useApp } from '../state.jsx';
import { Avatar, Button, Empty, SectionHead, Tag } from '../components/common/index.jsx';

export default function Detail({ kind }) {
  const { data, mutate, notify } = useApp();
  const { id } = useParams();
  const go = useNavigate();
  const isQuestion = kind === 'question';
  const collection = isQuestion ? 'questions' : 'discussions';
  const item = data[collection].find(row => String(row.id) === String(id));
  const [reply, setReply] = useState('');

  if (!item) return <Empty title="We couldn't find that post" action={<Button onClick={() => go(isQuestion ? '/questions' : '/discussions')}>Back to feed</Button>}/>;
  const replies = isQuestion ? item.answers : item.comments;
  async function act(action, payload = {}, successMessage) {
    try { await mutate(collection, action, { id: item.id, payload }); if (successMessage) notify(successMessage); }
    catch (error) { notify(error.message); }
  }
  async function postReply() {
    if (!reply.trim()) return;
    try {
      await mutate(collection, 'reply', { id: item.id, payload: { text: reply } });
      setReply('');
      notify(isQuestion ? 'Answer posted' : 'Comment added');
    } catch (error) { notify(error.message); }
  }

  return <>
    <button className="back-link" onClick={() => go(isQuestion ? '/questions' : '/discussions')}><ArrowLeft size={15}/> Back to {isQuestion ? 'questions' : 'discussions'}</button>
    <div className="detail-wrap">
      <article className="content-card detail-card">
        <div className="detail-author"><Avatar initials={item.initials}/><div className="author-block"><b>{item.author}</b><span>{item.time}</span></div><button className={`save-btn ${item.saved ? 'saved' : ''}`} onClick={() => act('toggleBookmark', {}, item.saved ? 'Bookmark removed' : 'Saved to bookmarks')}><Bookmark size={17}/></button></div>
        <Tag>{item.category}</Tag><h1>{item.title}</h1><p className="detail-description">{item.description}</p>
        <div className="card-tags">{(item.tags || []).map(tag => <Tag variant="muted" key={tag}>#{tag}</Tag>)}</div>
        <div className="detail-actions"><button onClick={() => act(isQuestion ? 'upvote' : 'like', {}, 'Thanks for contributing')}><ThumbsUp size={16}/> {isQuestion ? item.votes : item.likes} helpful</button><span><MessageCircle size={16}/>{replies.length} {isQuestion ? 'answers' : 'comments'}</span></div>
      </article>
      <section className="panel answer-panel"><SectionHead eyebrow={isQuestion ? 'HELP SOMEONE LEARN' : 'KEEP IT GOING'} title={isQuestion ? 'Answers' : 'Comments'}/>
        {replies.map(answer => <div className="reply-item" key={answer.id}><Avatar initials={answer.author.split(' ').map(part => part[0]).join('').slice(0, 2)}/><div><b>{answer.author}</b><p>{answer.text}</p></div></div>)}
        {!replies.length && <Empty title={isQuestion ? 'No answers yet' : 'No comments yet'} body="Be the first to add something helpful."/>}
        <div className="reply-form"><textarea value={reply} onChange={event => setReply(event.target.value)} placeholder={isQuestion ? 'Share a clear, helpful answer...' : 'Add to the conversation...'} rows="3"/><Button onClick={postReply}><Send size={15}/>{isQuestion ? 'Post answer' : 'Post comment'}</Button></div>
      </section>
    </div>
  </>;
}
