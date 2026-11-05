import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const seed = {
  profile: { name: 'Vikky Podiyam', username: '@vikky.dev', role: 'Student', bio: 'Curious builder learning in public. I enjoy turning ideas into useful things.', skills: ['HTML', 'CSS', 'JavaScript', 'Node.js', 'Express.js', 'MongoDB'], interests: ['React', 'Open source', 'Web development'], github: 'github.com/vikkypodiyam', linkedin: 'linkedin.com/in/vikky-podiyam' },
  questions: [
    { id: 1, title: 'What is the best way to manage state in a medium-sized React app?', description: 'I am building a project with a few shared views and forms. When should I use Context, and when is a state library worth it?', category: 'React', author: 'Aarav Sharma', initials: 'AS', time: '12 min ago', votes: 18, answers: [{ id: 1, author: 'Meera K.', text: 'Keep local state close to where it is used. Context works well for low-frequency shared state; avoid putting every input in a global store.' }], tags: ['state', 'architecture'], saved: false },
    { id: 2, title: 'Why does my async function return a Promise?', description: 'Trying to understand the value returned from an async function and how await changes the flow.', category: 'JavaScript', author: 'Nisha Patel', initials: 'NP', time: '1 hr ago', votes: 12, answers: [], tags: ['async', 'promises'], saved: true },
    { id: 3, title: 'How to structure Express routes for a growing API?', description: 'Looking for a clean way to separate validation, controllers and route definitions.', category: 'Node.js', author: 'Rohan Verma', initials: 'RV', time: '3 hrs ago', votes: 9, answers: [{ id: 2, author: 'Ishita Rao', text: 'Group routes by resource and move request validation into reusable middleware.' }], tags: ['express', 'api'], saved: false },
    { id: 4, title: 'Explain the two-pointer approach with a simple example', description: 'I know the idea but struggle to spot when a problem can be solved with two pointers.', category: 'DSA', author: 'Kabir Jain', initials: 'KJ', time: 'Yesterday', votes: 24, answers: [], tags: ['arrays', 'algorithms'], saved: false }
  ],
  discussions: [
    { id: 1, title: 'What are you building this week?', description: 'Share a small goal, a side project or one thing you would like feedback on. Tiny progress counts!', category: 'Community', author: 'Meera Kapoor', initials: 'MK', time: '35 min ago', likes: 32, comments: [{ id: 1, author: 'Aarav', text: 'Finishing my first portfolio case study this week.' }], tags: ['weekly-check-in', 'projects'], saved: false },
    { id: 2, title: 'CSS Grid or Flexbox: what is your mental model?', description: 'I use both, but I still pause on choosing. What rule of thumb helps you decide?', category: 'HTML/CSS', author: 'Arjun Nair', initials: 'AN', time: '2 hrs ago', likes: 16, comments: [], tags: ['css', 'frontend'], saved: true },
    { id: 3, title: 'Share a learning resource that actually helped', description: 'A great article, course or video can make a hard topic click. Drop your recommendations here.', category: 'Learning', author: 'Ishita Rao', initials: 'IR', time: 'Yesterday', likes: 41, comments: [], tags: ['resources'], saved: false }
  ],
  sessions: [
    { id: 1, title: 'React Hooks: from basics to patterns', description: 'A friendly walkthrough of useState, useEffect and a few reusable hook patterns.', category: 'React', host: 'Meera Kapoor', initials: 'MK', date: 'Today', time: '6:30 PM', duration: 60, participants: 18, status: 'Upcoming', link: 'https://meet.google.com/abc-defg-hij', registered: false },
    { id: 2, title: 'JavaScript interview problem solving', description: 'Practice breaking down common array and string problems together.', category: 'JavaScript', host: 'Rohan Verma', initials: 'RV', date: 'Tomorrow', time: '5:00 PM', duration: 45, participants: 12, status: 'Upcoming', link: 'https://meet.google.com/abc-defg-hij', registered: true },
    { id: 3, title: 'MongoDB schema design clinic', description: 'Bring your data model questions and get practical feedback.', category: 'MongoDB', host: 'Aarav Sharma', initials: 'AS', date: 'Nov 8', time: '4:00 PM', duration: 50, participants: 24, status: 'Ongoing', link: 'https://meet.google.com/abc-defg-hij', registered: false }
  ],
  notifications: [
    { id: 1, title: 'Meera answered your question', detail: 'A practical note on managing shared React state.', time: '10 min ago', read: false, icon: 'message' },
    { id: 2, title: 'Aarav commented on your discussion', detail: '“Finishing my first portfolio case study this week.”', time: '1 hr ago', read: false, icon: 'message' },
    { id: 3, title: 'Your answer received an upvote', detail: 'Your contribution helped another learner.', time: 'Yesterday', read: true, icon: 'heart' },
    { id: 4, title: 'A new React session is available', detail: 'React Hooks: from basics to patterns · Today at 6:30 PM', time: 'Yesterday', read: true, icon: 'calendar' },
    { id: 5, title: 'You have a new reply', detail: 'Join the CSS Grid vs Flexbox conversation.', time: '2 days ago', read: true, icon: 'message' }
  ],
  preferences: { email: true, answers: true, sessions: false, dark: false }
};

const readStore = () => { try { const saved = JSON.parse(localStorage.getItem('learnconnect-v1')); return saved ? { ...seed, ...saved } : seed; } catch { return seed; } };
const Store = createContext(null);
export function AppProvider({ children }) {
  const [data, setData] = useState(readStore);
  const [toast, setToast] = useState('');
  useEffect(() => { localStorage.setItem('learnconnect-v1', JSON.stringify(data)); document.documentElement.dataset.theme = data.preferences.dark ? 'dark' : 'light'; }, [data]);
  const notify = (msg) => { setToast(msg); window.setTimeout(() => setToast(''), 2800); };
  const update = (key, value) => setData(d => ({ ...d, [key]: typeof value === 'function' ? value(d[key]) : value }));
  const toggle = (key, id, field) => update(key, rows => rows.map(row => row.id === id ? { ...row, [field]: !row[field] } : row));
  const api = axios.create({ baseURL: '/api' });
  return <Store.Provider value={{ data, update, toggle, notify, toast, api }}>{children}</Store.Provider>;
}
export const useApp = () => useContext(Store);
