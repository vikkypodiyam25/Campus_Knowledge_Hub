import { STORAGE_KEYS, USER_STATUS } from '../../utils/constants';
import { getStoredItem, setStoredItem, logAdminActivity } from '../../services/storageService';

export const userService = {
  getAll: () => {
    return getStoredItem(STORAGE_KEYS.USERS, []);
  },

  getById: (id) => {
    const users = getStoredItem(STORAGE_KEYS.USERS, []);
    return users.find(u => u.id === id) || null;
  },

  create: (userData) => {
    const users = getStoredItem(STORAGE_KEYS.USERS, []);
    const newUser = {
      id: `usr_${Date.now()}`,
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar || `https://images.unsplash.com/photo-${1534528741775 + (users.length % 5)}?w=150&auto=format&fit=crop&q=80`,
      role: userData.role || 'Student',
      status: userData.status || USER_STATUS.ACTIVE,
      batch: userData.batch || 'Batch 2024-B',
      joinedDate: new Date().toISOString(),
      bio: userData.bio || 'New student on LearnConnect platform.',
      skills: Array.isArray(userData.skills) ? userData.skills : (userData.skills ? userData.skills.split(',').map(s => s.trim()) : ['React.js']),
      stats: { questions: 0, answers: 0, discussions: 0, sessionsJoined: 0 },
    };

    const updated = [newUser, ...users];
    setStoredItem(STORAGE_KEYS.USERS, updated);
    logAdminActivity('Created Student Profile', `${newUser.name} (${newUser.email})`, 'UserPlus', 'emerald');
    return newUser;
  },

  update: (id, userData) => {
    const users = getStoredItem(STORAGE_KEYS.USERS, []);
    let updatedUser = null;

    const updated = users.map(u => {
      if (u.id === id) {
        const skills = Array.isArray(userData.skills)
          ? userData.skills
          : typeof userData.skills === 'string'
          ? userData.skills.split(',').map(s => s.trim()).filter(Boolean)
          : u.skills;

        updatedUser = {
          ...u,
          ...userData,
          skills,
        };
        return updatedUser;
      }
      return u;
    });

    setStoredItem(STORAGE_KEYS.USERS, updated);
    if (updatedUser) {
      logAdminActivity('Updated Student Details', `${updatedUser.name} (${updatedUser.email})`, 'UserCheck', 'indigo');
    }
    return updatedUser;
  },

  delete: (id) => {
    const users = getStoredItem(STORAGE_KEYS.USERS, []);
    const userToDelete = users.find(u => u.id === id);
    const updated = users.filter(u => u.id !== id);

    setStoredItem(STORAGE_KEYS.USERS, updated);
    if (userToDelete) {
      logAdminActivity('Deleted Student Account', `${userToDelete.name} (${userToDelete.email})`, 'UserMinus', 'rose');
    }
    return true;
  },

  updateStatus: (id, newStatus) => {
    const users = getStoredItem(STORAGE_KEYS.USERS, []);
    let updatedUser = null;

    const updated = users.map(u => {
      if (u.id === id) {
        updatedUser = { ...u, status: newStatus };
        return updatedUser;
      }
      return u;
    });

    setStoredItem(STORAGE_KEYS.USERS, updated);
    if (updatedUser) {
      logAdminActivity(
        `Changed Status to ${newStatus}`,
        `${updatedUser.name} (${updatedUser.email})`,
        newStatus === USER_STATUS.ACTIVE ? 'CheckCircle' : 'AlertCircle',
        newStatus === USER_STATUS.ACTIVE ? 'emerald' : 'amber'
      );
    }
    return updatedUser;
  },
};

export default userService;
