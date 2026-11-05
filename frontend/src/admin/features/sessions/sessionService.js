import api from '../../services/api.js';
import { setStoredItem } from '../../services/storageService';
import { STORAGE_KEYS } from '../../utils/constants';

async function list() { const { data } = await api.get('/admin/sessions'); setStoredItem(STORAGE_KEYS.SESSIONS, data); return data; }
async function update(id, payload) { const body = { ...payload }; if (body.scheduledDate) body.scheduledDate = new Date(body.scheduledDate).toISOString(); const { data } = await api.put(`/admin/sessions/${encodeURIComponent(id)}`, body); await list(); return data; }

export const sessionService = {
  getAll: list,
  async getById(id) { return (await list()).find(session => String(session.id) === String(id)) || null; },
  async create(payload) { const date = new Date(payload.scheduledDate); if (Number.isNaN(date.getTime())) throw new Error('Choose a valid session date and time.'); const body = { ...payload, scheduledDate: date.toISOString() }; const { data } = await api.post('/admin/sessions', body); await list(); return data; },
  update,
  updateStatus(id, status) { return update(id, { status }); },
  async delete(id) { await api.delete(`/admin/sessions/${encodeURIComponent(id)}`); await list(); return true; },
};

export default sessionService;
