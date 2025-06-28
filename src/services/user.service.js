import mongoose from 'mongoose';
import User from '#models/user/User.model.js';
import Registration from '#models/user/Registration.model.js';
import Team from '#models/shared/Team.model.js';
import Dispute from '#models/tournament/Dispute.model.js';
import { ApiError } from '#utils/ApiError.js';

/**
 * @desc    دریافت لیست کاربران با صفحه‌بندی (بهینه‌سازی شده)
 * @param {object} filter - فیلترهای کوئری
 * @param {object} options - گزینه‌های صفحه‌بندی { page, limit }
 * @returns {Promise<object>}
 */
async function queryUsers(filter, options) {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  const aggregationPipeline = [
    { $match: filter },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        metadata: [{ $count: 'totalResults' }],
        data: [{ $skip: skip }, { $limit: limit }, { $project: { username: 1, email: 1, role: 1, status: 1, createdAt: 1 } }],
      },
    },
  ];

  const [result] = await User.aggregate(aggregationPipeline);
  const totalResults = result.metadata[0] ? result.metadata[0].totalResults : 0;
  
  return {
    results: result.data,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(totalResults / limit),
    totalResults,
  };
}

/**
 * @desc    دریافت اطلاعات یک کاربر با شناسه
 * @param {string} id - شناسه کاربر
 * @returns {Promise<object>}
 */
async function getUserById(id) {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, 'کاربر یافت نشد.');
  }
  return user;
}

/**
 * @desc    به‌روزرسانی اطلاعات یک کاربر با شناسه
 * @param {string} userId - شناسه کاربر برای به‌روزرسانی
 * @param {object} updateBody - داده‌های جدید
 * @returns {Promise<object>}
 */
async function updateUserById(userId, updateBody) {
  const user = await getUserById(userId);

  if (updateBody.phoneNumber) {
    throw new ApiError(400, 'امکان تغییر شماره تلفن وجود ندارد.');
  }

  // استفاده از متدهای استاتیک موجود در مدل برای بررسی یکتایی
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(400, 'این ایمیل قبلاً توسط کاربر دیگری استفاده شده است.');
  }
  if (updateBody.username && (await User.isUsernameTaken(updateBody.username, userId))) {
    throw new ApiError(400, 'این نام کاربری قبلاً استفاده شده است.');
  }

  Object.assign(user, updateBody);
  await user.save();
  
  return user;
}

/**
 * @desc    حذف یک کاربر و تمام داده‌های وابسته به او به صورت تراکنشی
 * @param {string} userId - شناسه کاربر
 * @returns {Promise<void>}
 */
async function deleteUserById(userId) {
  const user = await getUserById(userId);
  const userIdObject = new mongoose.Types.ObjectId(userId);

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // بررسی تیم‌هایی که کاربر در آن‌ها کاپیتان است
    const captainedTeams = await Team.find({ captain: userIdObject }).session(session);
    for (const team of captainedTeams) {
      if (team.members.length > 1) {
        throw new ApiError(400, `امکان حذف کاربر وجود ندارد. او کاپیتان تیم "${team.name}" است. ابتدا کاپیتانی را واگذار کنید.`);
      }
    }
    
    // ۱. حذف تمام داده‌های مستقیمی که کاربر ایجاد کرده
    await Registration.deleteMany({ user: userIdObject }, { session });
    await Dispute.deleteMany({ reporter: userIdObject }, { session });
    
    // ۲. حذف تیم‌هایی که کاربر تنها عضو و کاپیتان آن‌ها بوده
    const teamsToDelete = captainedTeams.filter(t => t.members.length === 1).map(t => t._id);
    if (teamsToDelete.length > 0) {
      await Team.deleteMany({ _id: { $in: teamsToDelete } }, { session });
    }
    
    // ۳. حذف کاربر از لیست اعضای سایر تیم‌ها
    await Team.updateMany(
      { members: userIdObject }, 
      { $pull: { members: userIdObject } }, 
      { session }
    );

    // ۴. در نهایت حذف خود کاربر
    await user.remove({ session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof ApiError) throw error; // Re-throw business logic errors
    throw new ApiError(500, 'خطا در حذف کاربر و داده‌های وابسته.');
  } finally {
    session.endSession();
  }
}

export default {
  queryUsers,
  getUserById,
  updateUserById,
  deleteUserById,
};
