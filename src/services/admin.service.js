import User from '@/models/user/User.model.js';
import Tournament from '@/models/tournament/Tournament.model.js';
import Transaction from '@/models/shared/Transaction.model.js';
import { ApiError } from '@/utils/ApiError.js';

/**
 * @desc    Fetches and aggregates key statistics for the admin dashboard.
 * @returns {Promise<object>} An object containing dashboard stats.
 */
async function getDashboardStats() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Use Promise.all to run all queries concurrently for better performance
  const [
    totalUsers,
    newUsersLast7Days,
    activeTournaments,
    totalRevenueResult,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Tournament.countDocuments({ status: 'active' }),
    Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          type: 'wallet_charge', // Sum only from wallet charges
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]),
  ]);

  const totalRevenue = totalRevenueResult[0]?.total || 0;

  return {
    users: {
      total: totalUsers,
      newLast7Days: newUsersLast7Days,
    },
    tournaments: {
      active: activeTournaments,
    },
    revenue: {
      total: totalRevenue, // Amount in Rials
    },
  };
}


export default {
  getDashboardStats,
};
