import { STORAGE_KEYS, SESSION_STATUS } from '../../utils/constants';
import { getStoredItem, setStoredItem, logAdminActivity } from '../../services/storageService';

export const sessionService = {
  getAll: () => {
    return getStoredItem(STORAGE_KEYS.SESSIONS, []);
  },

  getById: (id) => {
    const sessions = getStoredItem(STORAGE_KEYS.SESSIONS, []);
    return sessions.find(s => s.id === id) || null;
  },

  create: (sessionData) => {
    const sessions = getStoredItem(STORAGE_KEYS.SESSIONS, []);
    const newSession = {
      id: `sess_${Date.now()}`,
      title: sessionData.title,
      host: {
        name: sessionData.hostName || 'Vikky Podiyam',
        role: sessionData.hostRole || 'Super Admin',
        avatar: sessionData.hostAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        email: sessionData.hostEmail || 'vikkypodiyam25@navgurukul.org',
      },
      category: sessionData.category || 'React.js',
      status: sessionData.status || SESSION_STATUS.UPCOMING,
      scheduledDate: sessionData.scheduledDate || new Date(Date.now() + 86400000 * 3).toISOString(),
      duration: sessionData.duration || '60 mins',
      participantsCount: 0,
      maxCapacity: Number(sessionData.maxCapacity) || 100,
      meetingLink: sessionData.meetingLink || 'https://meet.learnconnect.edu/live-hub',
      description: sessionData.description || 'Interactive live learning cohort.',
      participants: [],
    };

    const updated = [newSession, ...sessions];
    setStoredItem(STORAGE_KEYS.SESSIONS, updated);
    logAdminActivity('Created Live Session', `"${newSession.title}"`, 'Video', 'indigo');
    return newSession;
  },

  update: (id, sessionData) => {
    const sessions = getStoredItem(STORAGE_KEYS.SESSIONS, []);
    let updatedSession = null;

    const updated = sessions.map(s => {
      if (s.id === id) {
        updatedSession = { ...s, ...sessionData };
        return updatedSession;
      }
      return s;
    });

    setStoredItem(STORAGE_KEYS.SESSIONS, updated);
    if (updatedSession) {
      logAdminActivity('Updated Session Details', `"${updatedSession.title}"`, 'Video', 'indigo');
    }
    return updatedSession;
  },

  updateStatus: (id, newStatus) => {
    const sessions = getStoredItem(STORAGE_KEYS.SESSIONS, []);
    let updatedSession = null;

    const updated = sessions.map(s => {
      if (s.id === id) {
        updatedSession = { ...s, status: newStatus };
        return updatedSession;
      }
      return s;
    });

    setStoredItem(STORAGE_KEYS.SESSIONS, updated);
    if (updatedSession) {
      logAdminActivity(
        `Session Status Changed to ${newStatus}`,
        `"${updatedSession.title}"`,
        newStatus === SESSION_STATUS.CANCELLED ? 'XCircle' : 'CheckCircle',
        newStatus === SESSION_STATUS.CANCELLED ? 'rose' : 'emerald'
      );
    }
    return updatedSession;
  },

  delete: (id) => {
    const sessions = getStoredItem(STORAGE_KEYS.SESSIONS, []);
    const sessionToDelete = sessions.find(s => s.id === id);
    const updated = sessions.filter(s => s.id !== id);

    setStoredItem(STORAGE_KEYS.SESSIONS, updated);
    if (sessionToDelete) {
      logAdminActivity('Deleted Live Session', `"${sessionToDelete.title}"`, 'Trash2', 'rose');
    }
    return true;
  },
};

export default sessionService;
