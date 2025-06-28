import userService from '#services/user.service.js';
import { asyncWrapper } from '#utils/async.wrapper.js';
import pick from '#utils/pick.js';

// --- User-Facing Controllers ---

/**
 * @desc    دریافت اطلاعات پروفایل کاربر لاگین‌کرده
 */
const getMe = asyncWrapper(async (req, res) => {
  // اصلاحیه نهایی: استفاده از pick برای جلوگیری از افشای ناخواسته اطلاعات
  // تنها فیلدهای عمومی و امن پروفایل کاربر انتخاب و بازگردانده می‌شوند.
  const publicProfileFields = [
    'id', 'username', 'email', 'avatar', 'role', 'status',
    'gameProfiles', 'eloRating', 'walletBalance', 'teams'
  ];
  const userProfile = pick(req.user, publicProfileFields);

  res.status(200).json(userProfile);
});

/**
 * @desc    به‌روزرسانی پروفایل توسط خود کاربر
 */
const updateMe = asyncWrapper(async (req, res) => {
  const allowedUpdates = ['username', 'email', 'avatar'];
  const updateBody = pick(req.body, allowedUpdates);
  
  const user = await userService.updateUserById(req.user.id, updateBody);
  res.status(200).json(user);
});


// --- Admin-Facing Controllers ---

/**
 * @desc    دریافت لیست تمام کاربران توسط ادمین
 */
const getUsers = asyncWrapper(async (req, res) => {
  const options = pick(req.query, ['page', 'limit']);
  const result = await userService.queryUsers({}, options); // فیلترها می‌توانند در آینده اضافه شوند
  res.status(200).json(result);
});

/**
 * @desc    دریافت اطلاعات یک کاربر خاص توسط ادمین
 */
const getUserById = asyncWrapper(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json(user);
});

/**
 * @desc    به‌روزرسانی اطلاعات یک کاربر توسط ادمین
 */
const updateUser = asyncWrapper(async (req, res) => {
  const allowedAdminUpdates = ['email', 'username', 'role', 'status', 'walletBalance'];
  const updateBody = pick(req.body, allowedAdminUpdates);

  const user = await userService.updateUserById(req.params.id, updateBody);
  res.status(200).json(user);
});

/**
 * @desc    حذف یک کاربر توسط ادمین
 */
const deleteUser = asyncWrapper(async (req, res) => {
  await userService.deleteUserById(req.params.id);
  res.status(204).send();
});


export default {
  getMe,
  updateMe,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
