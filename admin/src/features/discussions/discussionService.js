import { STORAGE_KEYS } from '../../utils/constants';
import { getStoredItem, setStoredItem, logAdminActivity } from '../../services/storageService';

export const discussionService = {
  getAll: () => {
    return getStoredItem(STORAGE_KEYS.DISCUSSIONS, []);
  },

  getById: (id) => {
    const discussions = getStoredItem(STORAGE_KEYS.DISCUSSIONS, []);
    return discussions.find(d => d.id === id) || null;
  },

  update: (id, data) => {
    const discussions = getStoredItem(STORAGE_KEYS.DISCUSSIONS, []);
    let updatedDisc = null;

    const updated = discussions.map(d => {
      if (d.id === id) {
        updatedDisc = { ...d, ...data };
        return updatedDisc;
      }
      return d;
    });

    setStoredItem(STORAGE_KEYS.DISCUSSIONS, updated);
    if (updatedDisc) {
      logAdminActivity('Updated Discussion', `"${updatedDisc.title}"`, 'MessageSquare', 'indigo');
    }
    return updatedDisc;
  },

  togglePin: (id) => {
    const discussions = getStoredItem(STORAGE_KEYS.DISCUSSIONS, []);
    let updatedDisc = null;

    const updated = discussions.map(d => {
      if (d.id === id) {
        const nextPinned = !d.isPinned;
        updatedDisc = { ...d, isPinned: nextPinned };
        return updatedDisc;
      }
      return d;
    });

    setStoredItem(STORAGE_KEYS.DISCUSSIONS, updated);
    if (updatedDisc) {
      logAdminActivity(
        updatedDisc.isPinned ? 'Pinned Discussion' : 'Unpinned Discussion',
        `"${updatedDisc.title}"`,
        'Pin',
        'amber'
      );
    }
    return updatedDisc;
  },

  toggleHide: (id) => {
    const discussions = getStoredItem(STORAGE_KEYS.DISCUSSIONS, []);
    let updatedDisc = null;

    const updated = discussions.map(d => {
      if (d.id === id) {
        const nextHidden = !d.isHidden;
        updatedDisc = { ...d, isHidden: nextHidden };
        return updatedDisc;
      }
      return d;
    });

    setStoredItem(STORAGE_KEYS.DISCUSSIONS, updated);
    if (updatedDisc) {
      logAdminActivity(
        updatedDisc.isHidden ? 'Hid Discussion from Students' : 'Unhid Discussion',
        `"${updatedDisc.title}"`,
        'EyeOff',
        'purple'
      );
    }
    return updatedDisc;
  },

  delete: (id) => {
    const discussions = getStoredItem(STORAGE_KEYS.DISCUSSIONS, []);
    const discToDelete = discussions.find(d => d.id === id);
    const updated = discussions.filter(d => d.id !== id);

    setStoredItem(STORAGE_KEYS.DISCUSSIONS, updated);
    if (discToDelete) {
      logAdminActivity('Deleted Discussion', `"${discToDelete.title}"`, 'Trash2', 'rose');
    }
    return true;
  },
};

export default discussionService;
