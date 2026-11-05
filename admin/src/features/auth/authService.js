import { STORAGE_KEYS } from '../../utils/constants';
import { INITIAL_ADMIN_PROFILE } from '../../data/mockData';
import { setStoredItem } from '../../services/storageService';

export const authService = {
  login: async (email, password) => {
    // Simulate realistic async network delay
    await new Promise(r => setTimeout(r, 400));

    if (!email || !password) {
      throw new Error('Please fill in both email and password.');
    }

    if (password.length < 5) {
      throw new Error('Password must be at least 6 characters.');
    }

    const adminUser = {
      ...INITIAL_ADMIN_PROFILE,
      email,
      lastLogin: new Date().toISOString(),
    };

    const authPayload = {
      isAuthenticated: true,
      user: adminUser,
      token: `demo_jwt_${Date.now()}`,
    };

    setStoredItem(STORAGE_KEYS.AUTH_ADMIN, authPayload);
    return authPayload;
  },

  logout: () => {
    const cleared = {
      isAuthenticated: false,
      user: null,
      token: null,
    };
    setStoredItem(STORAGE_KEYS.AUTH_ADMIN, cleared);
    return true;
  },
};

export default authService;
