import { STORAGE_KEYS } from '../../utils/constants';
import { getStoredItem, setStoredItem, logAdminActivity } from '../../services/storageService';

export const categoryService = {
  getAll: () => {
    return getStoredItem(STORAGE_KEYS.CATEGORIES, []);
  },

  getById: (id) => {
    const categories = getStoredItem(STORAGE_KEYS.CATEGORIES, []);
    return categories.find(c => c.id === id) || null;
  },

  create: (data) => {
    const categories = getStoredItem(STORAGE_KEYS.CATEGORIES, []);
    const newCategory = {
      id: `cat_${Date.now()}`,
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      count: 0,
      active: data.active !== undefined ? data.active : true,
      description: data.description || 'Topic discussions and doubt solving track.',
      color: data.color || 'indigo',
    };

    const updated = [...categories, newCategory];
    setStoredItem(STORAGE_KEYS.CATEGORIES, updated);
    logAdminActivity('Created Category', `Topic: "${newCategory.name}"`, 'FolderPlus', 'emerald');
    return newCategory;
  },

  update: (id, data) => {
    const categories = getStoredItem(STORAGE_KEYS.CATEGORIES, []);
    let updatedCat = null;

    const updated = categories.map(c => {
      if (c.id === id) {
        updatedCat = {
          ...c,
          ...data,
          slug: data.name ? data.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : c.slug,
        };
        return updatedCat;
      }
      return c;
    });

    setStoredItem(STORAGE_KEYS.CATEGORIES, updated);
    if (updatedCat) {
      logAdminActivity('Updated Category', `Topic: "${updatedCat.name}"`, 'Edit', 'indigo');
    }
    return updatedCat;
  },

  toggleActive: (id) => {
    const categories = getStoredItem(STORAGE_KEYS.CATEGORIES, []);
    let updatedCat = null;

    const updated = categories.map(c => {
      if (c.id === id) {
        updatedCat = { ...c, active: !c.active };
        return updatedCat;
      }
      return c;
    });

    setStoredItem(STORAGE_KEYS.CATEGORIES, updated);
    if (updatedCat) {
      logAdminActivity(
        updatedCat.active ? 'Activated Category' : 'Deactivated Category',
        `Topic: "${updatedCat.name}"`,
        updatedCat.active ? 'CheckCircle' : 'XCircle',
        updatedCat.active ? 'emerald' : 'amber'
      );
    }
    return updatedCat;
  },

  delete: (id) => {
    const categories = getStoredItem(STORAGE_KEYS.CATEGORIES, []);
    const catToDelete = categories.find(c => c.id === id);
    const updated = categories.filter(c => c.id !== id);

    setStoredItem(STORAGE_KEYS.CATEGORIES, updated);
    if (catToDelete) {
      logAdminActivity('Deleted Category', `Topic: "${catToDelete.name}"`, 'Trash2', 'rose');
    }
    return true;
  },
};

export default categoryService;
