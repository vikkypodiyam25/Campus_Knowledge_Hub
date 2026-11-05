import { STORAGE_KEYS, QUESTION_STATUS } from '../../utils/constants';
import { getStoredItem, setStoredItem, logAdminActivity } from '../../services/storageService';

export const questionService = {
  getAll: () => {
    return getStoredItem(STORAGE_KEYS.QUESTIONS, []);
  },

  getById: (id) => {
    const questions = getStoredItem(STORAGE_KEYS.QUESTIONS, []);
    return questions.find(q => q.id === id) || null;
  },

  update: (id, data) => {
    const questions = getStoredItem(STORAGE_KEYS.QUESTIONS, []);
    let updatedQuestion = null;

    const updated = questions.map(q => {
      if (q.id === id) {
        updatedQuestion = { ...q, ...data };
        return updatedQuestion;
      }
      return q;
    });

    setStoredItem(STORAGE_KEYS.QUESTIONS, updated);
    if (updatedQuestion) {
      logAdminActivity('Updated Question', `"${updatedQuestion.title}"`, 'HelpCircle', 'indigo');
    }
    return updatedQuestion;
  },

  resolve: (id) => {
    const questions = getStoredItem(STORAGE_KEYS.QUESTIONS, []);
    let updatedQuestion = null;

    const updated = questions.map(q => {
      if (q.id === id) {
        updatedQuestion = { ...q, status: QUESTION_STATUS.RESOLVED };
        return updatedQuestion;
      }
      return q;
    });

    setStoredItem(STORAGE_KEYS.QUESTIONS, updated);
    if (updatedQuestion) {
      logAdminActivity('Marked Question Resolved', `"${updatedQuestion.title}"`, 'CheckCircle', 'emerald');
    }
    return updatedQuestion;
  },

  removeInappropriate: (id, reason = 'Violates community guidelines') => {
    const questions = getStoredItem(STORAGE_KEYS.QUESTIONS, []);
    let removedQ = null;

    const updated = questions.map(q => {
      if (q.id === id) {
        removedQ = { ...q, status: QUESTION_STATUS.REMOVED, moderationReason: reason };
        return removedQ;
      }
      return q;
    });

    setStoredItem(STORAGE_KEYS.QUESTIONS, updated);
    if (removedQ) {
      logAdminActivity('Moderated Doubt / Question', `Removed "${removedQ.title}"`, 'ShieldAlert', 'rose');
    }
    return removedQ;
  },

  delete: (id) => {
    const questions = getStoredItem(STORAGE_KEYS.QUESTIONS, []);
    const questionToDelete = questions.find(q => q.id === id);
    const updated = questions.filter(q => q.id !== id);

    setStoredItem(STORAGE_KEYS.QUESTIONS, updated);
    if (questionToDelete) {
      logAdminActivity('Deleted Question', `"${questionToDelete.title}"`, 'Trash2', 'rose');
    }
    return true;
  },
};

export default questionService;
