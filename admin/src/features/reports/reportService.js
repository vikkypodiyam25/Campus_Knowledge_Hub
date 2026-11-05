import { STORAGE_KEYS, REPORT_STATUS } from '../../utils/constants';
import { getStoredItem, setStoredItem, logAdminActivity } from '../../services/storageService';

export const reportService = {
  getAll: () => {
    return getStoredItem(STORAGE_KEYS.REPORTS, []);
  },

  getById: (id) => {
    const reports = getStoredItem(STORAGE_KEYS.REPORTS, []);
    return reports.find(r => r.id === id) || null;
  },

  updateStatus: (id, newStatus, notes = '') => {
    const reports = getStoredItem(STORAGE_KEYS.REPORTS, []);
    let updatedReport = null;

    const updated = reports.map(r => {
      if (r.id === id) {
        updatedReport = {
          ...r,
          status: newStatus,
          resolutionNotes: notes,
          resolvedAt: newStatus === REPORT_STATUS.RESOLVED || newStatus === REPORT_STATUS.REJECTED ? new Date().toISOString() : r.resolvedAt,
        };
        return updatedReport;
      }
      return r;
    });

    setStoredItem(STORAGE_KEYS.REPORTS, updated);
    if (updatedReport) {
      logAdminActivity(`Marked Report as ${newStatus}`, `#${id}: ${updatedReport.title}`, 'ShieldCheck', 'indigo');
    }
    return updatedReport;
  },

  removeContentAndResolve: (reportId, reason = '') => {
    const reports = getStoredItem(STORAGE_KEYS.REPORTS, []);
    const report = reports.find(r => r.id === reportId);
    if (!report) return false;

    // If report was on a question, mark the question as removed
    if (report.itemType === 'Question' || report.itemType === 'doubt') {
      const questions = getStoredItem(STORAGE_KEYS.QUESTIONS, []);
      const updatedQuestions = questions.map(q => {
        if (q.id === report.itemId) {
          return { ...q, status: 'Removed', isModerated: true };
        }
        return q;
      });
      setStoredItem(STORAGE_KEYS.QUESTIONS, updatedQuestions);
    } else if (report.itemType === 'Discussion') {
      const discussions = getStoredItem(STORAGE_KEYS.DISCUSSIONS, []);
      const updatedDiscussions = discussions.map(d => {
        if (d.id === report.itemId) {
          return { ...d, isHidden: true, isModerated: true };
        }
        return d;
      });
      setStoredItem(STORAGE_KEYS.DISCUSSIONS, updatedDiscussions);
    }

    // Resolve report
    return reportService.updateStatus(reportId, REPORT_STATUS.RESOLVED, reason || 'Content removed per moderation guidelines.');
  },

  delete: (id) => {
    const reports = getStoredItem(STORAGE_KEYS.REPORTS, []);
    const updated = reports.filter(r => r.id !== id);
    setStoredItem(STORAGE_KEYS.REPORTS, updated);
    return true;
  },
};

export default reportService;
