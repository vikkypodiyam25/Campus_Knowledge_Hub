import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDownUp, Hash, Plus, Search } from 'lucide-react';
import { useApp } from '../state.jsx';
import { Empty, PageHead, QuestionCard, cats } from '../components/common/index.jsx';
import { getCurriculum } from '../data/curricula.js';

export default function Questions({ explore = false }) {
  const { data } = useApp();
  const curriculum = getCurriculum(data.profile?.subject);
  const categories = ['All topics', ...(curriculum?.categories || (data.categories?.length ? data.categories : cats.slice(1)))];
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') || '');
  const [category, setCategory] = useState('All topics');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState('Latest');
  const items = useMemo(() => data.questions.filter(question => (!search || `${question.title} ${question.description} ${question.category}`.toLowerCase().includes(search.toLowerCase())) && (category === 'All topics' || question.category === category) && (status === 'All' || (status === 'Answered' ? question.answers.length > 0 : question.answers.length === 0))).sort((a, b) => sort === 'Most Upvoted' ? b.votes - a.votes : sort === 'Most Answered' ? b.answers.length - a.answers.length : new Date(b.createdAt || 0) - new Date(a.createdAt || 0)), [data.questions, search, category, status, sort]);

  return <>
    <PageHead eyebrow={explore ? 'DISCOVER' : curriculum?.name.toUpperCase() || 'YOUR LEARNING COMMUNITY'} title="Questions & answers" sub={explore ? 'Find helpful answers, thoughtful discussions and new things to learn.' : `Get unstuck together with learners in ${curriculum?.shortName || 'your school'}.`} action={<Link to="/ask" className="btn btn-primary"><Plus size={16}/>Ask a doubt</Link>}/>
    <div className="category-row">{categories.slice(0, 9).map((item, index) => <button key={item} className={`category-chip ${category === item ? 'selected' : ''}`} onClick={() => setCategory(item)}>{index === 0 && <Hash size={14}/>} {item}</button>)}</div>
    <div className="filterbar"><label className="filter-search"><Search size={16}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder={`Search ${curriculum?.shortName || 'questions'}...`}/></label><select value={category} onChange={event => setCategory(event.target.value)}>{categories.map(item => <option key={item}>{item}</option>)}</select><select value={status} onChange={event => setStatus(event.target.value)}><option>All</option><option>Unanswered</option><option>Answered</option></select><select value={sort} onChange={event => setSort(event.target.value)}><option>Latest</option><option>Most Upvoted</option><option>Most Answered</option></select><ArrowDownUp className="filter-sort-icon" size={15}/></div>
    <div className="results-label">{items.length} {items.length === 1 ? 'question' : 'questions'} <span>·</span> {status === 'All' ? `Topics in ${curriculum?.shortName || 'your school'}` : status}</div>
    <div className="feed-list">{items.map(question => <QuestionCard key={question.id} q={question}/>)}{items.length === 0 && <Empty title="No matching questions" body="Try another topic or ask the first question for this subject." action={<Link className="btn btn-primary" to="/ask"><Plus size={15}/>Ask a doubt</Link>}/>}</div>
  </>;
}
