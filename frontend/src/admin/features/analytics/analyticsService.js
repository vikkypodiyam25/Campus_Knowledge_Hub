import { ANALYTICS_DATA } from '../../data/mockData';
import { STORAGE_KEYS } from '../../utils/constants';
import { getStoredItem } from '../../services/storageService';

export const analyticsService = {
  getDataByRange: (rangeKey = '7d') => {
    let growthSeries = ANALYTICS_DATA.growth7d;

    switch (rangeKey) {
      case '30d':
        growthSeries = ANALYTICS_DATA.growth30d;
        break;
      case '90d':
        growthSeries = ANALYTICS_DATA.growth90d;
        break;
      case 'year':
        growthSeries = ANALYTICS_DATA.growthYear;
        break;
      default:
        growthSeries = ANALYTICS_DATA.growth7d;
    }

    const users = getStoredItem(STORAGE_KEYS.USERS, []);
    const topActiveStudents = [...users]
      .sort((a, b) => (b.stats?.answers || 0) + (b.stats?.questions || 0) - ((a.stats?.answers || 0) + (a.stats?.questions || 0)))
      .slice(0, 5);

    return {
      growthSeries,
      metrics: ANALYTICS_DATA.metrics,
      userDistribution: ANALYTICS_DATA.userDistribution,
      weeklyActivity: ANALYTICS_DATA.weeklyActivity,
      categoryBreakdown: ANALYTICS_DATA.categoryBreakdown,
      topStudents: topActiveStudents,
    };
  },
};

export default analyticsService;
