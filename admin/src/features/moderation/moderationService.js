import { reportService } from '../reports/reportService';
import { userService } from '../users/userService';
import { USER_STATUS } from '../../utils/constants';

export const moderationService = {
  ...reportService,

  suspendUser: (userId, reason = 'Account suspended for policy violations') => {
    return userService.updateStatus(userId, USER_STATUS.SUSPENDED);
  },
};

export default moderationService;
