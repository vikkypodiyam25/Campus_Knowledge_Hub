import api from '../../services/api.js';

export const reportService = {
  async getAll() { return (await api.get('/admin/dashboard')).data.reports || []; },
  async getById(id) { return (await reportService.getAll()).find(report => report.id === id) || null; },
  async updateStatus() { throw new Error('Report moderation is not available until user reports are implemented.'); },
  async removeContentAndResolve() { throw new Error('Report moderation is not available until user reports are implemented.'); },
  async delete() { throw new Error('Report management is not available until user reports are implemented.'); },
};

export default reportService;
