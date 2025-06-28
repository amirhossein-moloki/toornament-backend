import adminService from '#services/admin.service.js';
import { asyncWrapper } from '#utils/async.wrapper.js';

/**
 * @desc    Controller to get dashboard statistics.
 */
const getDashboardStats = asyncWrapper(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  res.status(200).json(stats);
});

export default {
  getDashboardStats,
};
