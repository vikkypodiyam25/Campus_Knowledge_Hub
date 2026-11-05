import { Sparkles } from 'lucide-react';

export default function Empty({ title = 'Nothing here yet', body = 'Try changing your filters or create something new.', action }) {
  return <div className="empty"><span className="empty-icon"><Sparkles size={20}/></span><b>{title}</b><p>{body}</p>{action}</div>;
}
