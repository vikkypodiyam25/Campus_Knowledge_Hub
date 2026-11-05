import api from '../../services/api.js';
import { setStoredItem } from '../../services/storageService';
import { STORAGE_KEYS } from '../../utils/constants';

export const userService = {
  async getAll() { const { data } = await api.get('/admin/users'); setStoredItem(STORAGE_KEYS.USERS, data); return data; },
  async getById(id) { return (await userService.getAll()).find(user => user.id === id) || null; },
  async create() { throw new Error('Users must register through the student account flow.'); },
  async update(id, userData) { const skills = typeof userData.skills === 'string' ? userData.skills.split(',').map(value => value.trim()).filter(Boolean) : userData.skills; await api.put(`/admin/users/${encodeURIComponent(id)}`, { name: userData.name, profile: { bio: userData.bio, skills } }); return userService.getById(id); },
  async delete(id) { await api.delete(`/admin/users/${encodeURIComponent(id)}`); await userService.getAll(); return true; },
  async updateStatus(id, status) { const next = status === 'Inactive' ? 'Suspended' : status; await api.put(`/admin/users/${encodeURIComponent(id)}/status`, { status: next }); await userService.getAll(); return true; },
};

export default userService;
