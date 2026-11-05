import { STORAGE_KEYS } from '../../utils/constants';
import { getStoredItem, setStoredItem, logAdminActivity } from '../../services/storageService';

export const notificationService = {
  getAll: () => {
    return getStoredItem(STORAGE_KEYS.NOTIFICATIONS, []);
  },

  getById: (id) => {
    const notifications = getStoredItem(STORAGE_KEYS.NOTIFICATIONS, []);
    return notifications.find(n => n.id === id) || null;
  },

  create: (data, adminName = 'Vikky Podiyam') => {
    const notifications = getStoredItem(STORAGE_KEYS.NOTIFICATIONS, []);
    const users = getStoredItem(STORAGE_KEYS.USERS, []);

    let estimatedRecipients = users.length * 150; // realistic campus multiplier
    if (data.targetAudience === 'active') {
      estimatedRecipients = Math.floor(estimatedRecipients * 0.8);
    } else if (data.targetAudience === 'selected') {
      estimatedRecipients = 45;
    }

    const newNotification = {
      id: `notif_${Date.now()}`,
      title: data.title,
      message: data.message,
      type: data.type || 'announcement',
      targetAudience: data.targetAudience || 'all',
      sentAt: new Date().toISOString(),
      sentBy: adminName,
      status: 'Sent',
      deliveredCount: estimatedRecipients,
      openRate: '0%',
    };

    const updated = [newNotification, ...notifications];
    setStoredItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    logAdminActivity('Published Announcement', `"${newNotification.title}" to ${data.targetAudience} students`, 'Send', 'indigo');
    return newNotification;
  },

  update: (id, data) => {
    const notifications = getStoredItem(STORAGE_KEYS.NOTIFICATIONS, []);
    let updatedNotif = null;

    const updated = notifications.map(n => {
      if (n.id === id) {
        updatedNotif = { ...n, ...data };
        return updatedNotif;
      }
      return n;
    });

    setStoredItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    if (updatedNotif) {
      logAdminActivity('Updated Announcement', `"${updatedNotif.title}"`, 'Edit', 'indigo');
    }
    return updatedNotif;
  },

  delete: (id) => {
    const notifications = getStoredItem(STORAGE_KEYS.NOTIFICATIONS, []);
    const notifToDelete = notifications.find(n => n.id === id);
    const updated = notifications.filter(n => n.id !== id);

    setStoredItem(STORAGE_KEYS.NOTIFICATIONS, updated);
    if (notifToDelete) {
      logAdminActivity('Deleted Announcement', `"${notifToDelete.title}"`, 'Trash2', 'rose');
    }
    return true;
  },
};

export default notificationService;
