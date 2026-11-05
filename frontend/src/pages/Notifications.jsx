import React from 'react';
import { Bell, CalendarDays, Check, ClipboardCheck, Heart, MessageCircle, X } from 'lucide-react';
import { useApp } from '../state.jsx';
import { Button, PageHead } from '../components/common/index.jsx';

export default function Notifications() {
  const { data, mutate, notify } = useApp();
  const unread = data.notifications.filter(item => !item.read).length;
  async function act(action, values = {}, message) {
    try { await mutate('notifications', action, values); if (message) notify(message); }
    catch (error) { notify(error.message); }
  }

  return <>
    <PageHead eyebrow="STAY IN THE LOOP" title="Notifications" sub="The latest activity from your learning community." action={unread > 0 && <Button kind="outline" onClick={() => act('markAllRead', {}, 'All caught up!')}><Check size={15}/>Mark all as read</Button>}/>
    <div className="notification-summary"><span className="summary-icon"><Bell size={18}/></span><div><b>{unread ? `${unread} unread notifications` : 'You are all caught up'}</b><small>Here is what has been happening.</small></div><span className="summary-count">{unread}</span></div>
    <div className="notification-list">{data.notifications.map(item => <div className={`notification-row ${!item.read ? 'unread' : ''}`} key={item.id}><span className={`notification-icon notif-${item.icon}`}>{item.icon === 'message' ? <MessageCircle size={17}/> : item.icon === 'heart' ? <Heart size={17}/> : item.icon === 'assignment' ? <ClipboardCheck size={17}/> : <CalendarDays size={17}/>}</span><div className="notification-copy"><b>{item.title}</b><p>{item.detail}</p><small>{item.time}</small></div><div className="notification-actions">{!item.read && <button onClick={() => act('markRead', { id: item.id }, 'Marked as read')} title="Mark as read"><Check size={16}/></button>}<button onClick={() => act('delete', { id: item.id })} title="Delete"><X size={16}/></button></div></div>)}</div>
  </>;
}
