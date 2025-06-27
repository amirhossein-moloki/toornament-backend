import mongoose from 'mongoose';
import Team from '../models/shared/Team.model.js';
import User from '../models/user/User.model.js';
import Game from '../models/shared/Game.model.js'; // برای بررسی ظرفیت تیم
import Registration from '../models/user/Registration.model.js'; // برای بررسی تورنومنت فعال
import { ApiError } from '../utils/ApiError.js';

/**
 * @desc    دریافت لیست تیم‌ها با فیلترینگ و صفحه‌بندی
 */
async function queryTeams(filter, options) {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  const query = {};
  if (filter.game) {
    query.game = filter.game;
  }

  const [teams, totalResults] = await Promise.all([
    Team.find(query)
      .populate('game', 'name icon')
      .populate('captain', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Team.countDocuments(query)
  ]);

  return {
    results: teams,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(totalResults / limit),
    totalResults,
  };
}

/**
 * @desc    دریافت اطلاعات یک تیم با شناسه
 */
async function getTeamById(id) {
  // Populate game info to access teamSize later if needed
  const team = await Team.findById(id).populate('members', 'username avatar').populate('game', 'name teamSize');
  if (!team) {
    throw new ApiError(404, 'تیم یافت نشد.');
  }
  return team;
}

/**
 * @desc    ایجاد یک تیم جدید به صورت تراکنشی
 */
async function createTeam(teamData) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const newTeam = new Team(teamData);
    await newTeam.save({ session });
    
    await User.findByIdAndUpdate(
      teamData.captain,
      { $push: { teams: newTeam._id } },
      { session }
    );
    
    await session.commitTransaction();
    return newTeam;
  } catch (error) {
    await session.abortTransaction();
    if (error.code === 11000) { // Duplicate key error
        throw new ApiError(400, 'نام یا تگ تیم تکراری است.');
    }
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * @desc    به‌روزرسانی اطلاعات تیم
 */
async function updateTeamById(teamId, updateBody) {
  const team = await Team.findByIdAndUpdate(teamId, updateBody, { new: true, runValidators: true });
  if (!team) {
    throw new ApiError(404, 'تیم یافت نشد.');
  }
  return team;
}

/**
 * @desc    منحل کردن یک تیم به صورت تراکنشی
 */
async function deleteTeamById(teamId) {
    const team = await Team.findById(teamId);
    if (!team) throw new ApiError(404, 'تیم یافت نشد.');

    // بررسی اینکه آیا تیم در تورنومنت فعالی ثبت‌نام کرده است
    const activeRegistration = await Registration.findOne({ team: teamId, status: { $in: ['playing', 'active'] } });
    if (activeRegistration) {
        throw new ApiError(400, 'امکان حذف تیمی که در یک تورنومنت فعال است، وجود ندارد.');
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // حذف تیم از لیست تیم‌های تمام اعضا
        await User.updateMany(
            { _id: { $in: team.members } },
            { $pull: { teams: teamId } },
            { session }
        );
        // حذف خود تیم
        await team.remove({ session });
        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw new ApiError(500, 'خطا در حذف تیم.');
    } finally {
        session.endSession();
    }
}


// --- Member Management ---

/**
 * @desc    افزودن عضو به تیم به صورت تراکنشی
 */
async function addMember(teamId, userIdToAdd) {
    const team = await getTeamById(teamId); // Fetches team and populates game

    if (team.members.some(member => member._id.toString() === userIdToAdd)) {
        throw new ApiError(400, 'این کاربر قبلاً عضو تیم است.');
    }
    // Assuming Game model has a teamSize property
    if (team.game && team.members.length >= team.game.teamSize) {
        throw new ApiError(400, `ظرفیت تیم برای بازی ${team.game.name} تکمیل است.`);
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        // Use findByIdAndUpdate for atomic updates
        await Team.findByIdAndUpdate(teamId, { $push: { members: userIdToAdd } }, { session });
        await User.findByIdAndUpdate(userIdToAdd, { $push: { teams: teamId } }, { session });
        await session.commitTransaction();
        
        // Return the updated team document
        return getTeamById(teamId);
    } catch (error) {
        await session.abortTransaction();
        throw new ApiError(500, 'خطا در افزودن عضو به تیم.');
    } finally {
        session.endSession();
    }
}

/**
 * @desc    حذف عضو از تیم به صورت تراکنشی
 */
async function removeMember(teamId, userIdToRemove) {
    const team = await getTeamById(teamId);

    if (team.captain.toString() === userIdToRemove) {
        throw new ApiError(400, 'کاپیتان تیم نمی‌تواند خودش را حذف کند.');
    }
    if (!team.members.some(member => member._id.toString() === userIdToRemove)) {
        throw new ApiError(400, 'این کاربر عضو تیم نیست.');
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        await Team.findByIdAndUpdate(teamId, { $pull: { members: userIdToRemove } }, { session });
        await User.findByIdAndUpdate(userIdToRemove, { $pull: { teams: teamId } }, { session });
        await session.commitTransaction();

        return getTeamById(teamId);
    } catch (error) {
        await session.abortTransaction();
        throw new ApiError(500, 'خطا در حذف عضو از تیم.');
    } finally {
        session.endSession();
    }
}

/**
 * @desc    ترک تیم توسط یک عضو به صورت تراکنشی
 */
async function leaveTeam(teamId, userId) {
    const team = await getTeamById(teamId);

    if (team.captain.toString() === userId) {
        throw new ApiError(400, 'کاپیتان نمی‌تواند تیم را ترک کند. ابتدا تیم را منحل کرده یا کاپیتانی را واگذار کنید.');
    }
    if (!team.members.some(member => member._id.toString() === userId)) {
        throw new ApiError(400, 'شما عضو این تیم نیستید.');
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        await Team.findByIdAndUpdate(teamId, { $pull: { members: userId } }, { session });
        await User.findByIdAndUpdate(userId, { $pull: { teams: teamId } }, { session });
        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw new ApiError(500, 'خطا در ترک تیم.');
    }
}


export default {
  queryTeams,
  getTeamById,
  createTeam,
  updateTeamById,
  deleteTeamById,
  addMember,
  removeMember,
  leaveTeam
};
