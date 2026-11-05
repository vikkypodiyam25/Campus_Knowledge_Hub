import api from '../../services/api.js';
import { setStoredItem } from '../../services/storageService';
import { STORAGE_KEYS, QUESTION_STATUS } from '../../utils/constants';

async function list() { const { data } = await api.get('/admin/questions'); setStoredItem(STORAGE_KEYS.QUESTIONS, data); return data; }
async function update(id, data) { const response = await api.put(`/admin/questions/${encodeURIComponent(id)}`, data); await list(); return response.data; }

export const questionService = {
  getAll: list,
  async getById(id) { return (await list()).find(item => String(item.id) === String(id)) || null; },
  update,
  resolve(id) { return update(id, { status: QUESTION_STATUS.RESOLVED }); },
  removeInappropriate(id, reason = 'Violates community guidelines') { return update(id, { status: QUESTION_STATUS.REMOVED, moderationReason: reason }); },
  async delete(id) { await api.delete(`/admin/questions/${encodeURIComponent(id)}`); await list(); return true; },
};

export default questionService;
