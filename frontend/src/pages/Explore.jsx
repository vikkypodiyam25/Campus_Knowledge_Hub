import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Hash, Search } from 'lucide-react';
import { useApp } from '../state.jsx';
import { DiscussionCard, Empty, PageHead, QuestionCard, SectionHead, cats } from '../components/common/index.jsx';
import { getCurriculum } from '../data/curricula.js';

export default function Explore() {
  const { data } = useApp();
  const curriculum = getCurriculum(data.profile?.subject);
  const categories = ['All topics', ...(curriculum?.categories || (data.categories?.length ? data.categories : cats.slice(1)))];
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') || '');
  const [category, setCategory] = useState('All topics');
  const matches = text => !search || text.toLowerCase().includes(search.toLowerCase());
  const questions = useMemo(() => data.questions.filter(item => matches(`${item.title} ${item.description} ${item.category}`) && (category === 'All topics' || item.category === category)), [data.questions, search, category]);
  const discussions = useMemo(() => data.discussions.filter(item => matches(`${item.title} ${item.description} ${item.tags}`) && (category === 'All topics' || item.category === category)), [data.discussions, search, category]);

  return <>
    <PageHead eyebrow={curriculum?.name.toUpperCase() || 'DISCOVER'} title="Explore ideas & people" sub={curriculum?.description || 'Find helpful answers, thoughtful discussions and new things to learn.'}/>
    <div className="category-row">{categories.slice(0, 9).map((item, index) => <button key={item} className={`category-chip ${category === item ? 'selected' : ''}`} onClick={() => setCategory(item)}>{index === 0 && <Hash size={14}/>} {item}</button>)}</div>
    <div className="filterbar"><label className="filter-search"><Search size={16}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder={`Search ${curriculum?.shortName || 'community'} topics...`}/></label><select value={category} onChange={event => setCategory(event.target.value)}>{categories.map(item => <option key={item}>{item}</option>)}</select></div>
    <section className="panel"><SectionHead eyebrow="TRENDING QUESTIONS" title="Questions to explore" link="/questions" linkText="All questions"/><div className="feed-list">{questions.map(question => <QuestionCard key={question.id} q={question}/>)}{questions.length === 0 && <Empty title="No matching questions" body="Try another topic or share the first question in your school." action={<Link to="/ask" className="btn btn-primary">Ask a doubt <ArrowRight size={15}/></Link>}/>}</div></section>
    <section className="panel explore-panel"><SectionHead eyebrow="POPULAR DISCUSSIONS" title="Conversations to join" link="/discussions" linkText="All discussions"/><div className="feed-list">{discussions.map(discussion => <DiscussionCard key={discussion.id} d={discussion}/>)}{discussions.length === 0 && <Empty title="No matching discussions" body="Start a conversation with other learners in your school." action={<Link to="/discussions/new" className="btn btn-primary">Start a discussion <ArrowRight size={15}/></Link>}/>}</div></section>
    {curriculum && <section className="panel explore-panel curriculum-prompt"><SectionHead eyebrow="KEEP YOUR MOMENTUM" title={`Continue your ${curriculum.shortName} path`} link="/dashboard" linkText="View curriculum"/><div className="curriculum-prompt-row"><span>{curriculum.curriculum?.[0]?.topics?.join(' · ') || curriculum.modules?.[0]?.topics?.slice(0, 3).join(' · ') || curriculum.subjects?.[0]?.name || 'Explore your learning modules'}</span><Link className="subtle-link" to="/dashboard">Open dashboard <ArrowRight size={14}/></Link></div></section>}
  </>;
}
