import { ArrowDownUp, Search } from 'lucide-react';
import { cats } from '../../data/categories.js';

export default function FilterBar({ search, setSearch, category, setCategory, status, setStatus, sort, setSort, statuses, categories = cats }) {
  return <div className="filterbar"><label className="filter-search"><Search size={16}/><input placeholder="Search questions, topics..." value={search} onChange={e => setSearch(e.target.value)}/></label><select value={category} onChange={e => setCategory(e.target.value)} aria-label="Category">{categories.map(c => <option key={c}>{c}</option>)}</select>{statuses && <select value={status} onChange={e => setStatus(e.target.value)} aria-label="Status">{statuses.map(c => <option key={c}>{c}</option>)}</select>}<select value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort"><option>Latest</option><option>Most Upvoted</option><option>Most Answered</option><option>Most Popular</option></select><ArrowDownUp className="filter-sort-icon" size={16}/></div>;
}
