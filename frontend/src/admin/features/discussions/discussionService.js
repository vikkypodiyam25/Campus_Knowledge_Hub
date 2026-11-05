import api from '../../services/api.js';
import { setStoredItem } from '../../services/storageService';
import { STORAGE_KEYS } from '../../utils/constants';

async function list() { const { data } = await api.get('/admin/discussions'); setStoredItem(STORAGE_KEYS.DISCUSSIONS, data); return data; }
async function update(id, data) { const response = await api.put(`/admin/discussions/${encodeURIComponent(id)}`, data); await list(); return response.data; }

export const discussionService = {
  getAll: list,
  async getById(id) { return (await list()).find(item => String(item.id) === String(id)) || null; },
  update,
  async togglePin(id) { const row = (await list()).find(item => String(item.id) === String(id)); return row ? update(id, { isPinned: !row.isPinned }) : null; },
  async toggleHide(id) { const row = (await list()).find(item => String(item.id) === String(id)); return row ? update(id, { isHidden: !row.isHidden }) : null; },
  async delete(id) { await api.delete(`/admin/discussions/${encodeURIComponent(id)}`); await list(); return true; },
};

export default discussionService;
