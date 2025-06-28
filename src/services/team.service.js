// src/services/team.service.js

import mongoose from 'mongoose';
import Team from '@/models/shared/Team.model.js';
import User from '@/models/user/User.model.js';
import Game from '@/models/shared/Game.model.js';
import Registration from '@/models/user/Registration.model.js';
import { ApiError } from '@/utils/ApiError.js';
import redisClient from '@/config/redisClient.js'; // وارد کردن کلاینت Redis
import logger from '@/utils/logger.js'; // وارد کردن لاگر

// تعریف ثابت‌ها برای مدیریت کش
const TEAM_CACHE_PREFIX = 'team:';
const DEFAULT_CACHE_TTL_SECONDS = 5 * 60; // 5 دقیقه

/**
 * @desc    دریافت لیست تیم‌ها با فیلترینگ و صفحه‌بندی
 */
async function queryTeams(filter, options) {
  // @. این تابع بدون تغییر باقی می‌ماند @.
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
 * @desc    دریافت اطلاعات یک تیم با شناسه (با پیاده‌سازی کش)
 */
async function getTeamById(id) {
  const cacheKey = `${TEAM_CACHE_PREFIX}${id}`;

  // ۱. ابتدا کش را بررسی کن
  try {
    const cachedTeam = await redisClient.get(cacheKey);
    if (cachedTeam) {
      logger.debug(`Cache HIT for key: ${cacheKey}`);
      return JSON.parse(cachedTeam);
    }
  } catch (error) {
    logger.error('Redis GET command failed:', error);
    // در صورت خطای Redis، به صورت عادی از پایگاه داده می‌خوانیم
  }

  // ۲. در صورت نبودن در کش (Cache Miss)، از پایگاه داده بخوان
  logger.debug(`Cache MISS for key: ${cacheKey}`);
  const team = await Team.findById(id)
    .populate('members', 'username avatar')
    .populate('game', 'name teamSize')
    .lean(); // از lean() برای افزایش سرعت در خواندن استفاده می‌کنیم

  if (!team) {
    throw new ApiError(404, 'تیم یافت نشد.');
  }

  // ۳. نتیجه را در کش ذخیره کن
  try {
    await redisClient.setex(cacheKey, DEFAULT_CACHE_TTL_SECONDS, JSON.stringify(team));
  } catch (error) {
    logger.error('Redis SETEX command failed:', error);
  }

  return team;
}

/**
 * @desc    به‌روزرسانی اطلاعات تیم (با بی‌اعتبار کردن کش)
 */
async function updateTeamById(teamId, updateBody) {
  const team = await Team.findByIdAndUpdate(teamId, updateBody, { new: true, runValidators: true });
  if (!team) {
    throw new ApiError(404, 'تیم یافت نشد.');
  }

  // ۴. بی‌اعتبار کردن کش پس از به‌روزرسانی
  const cacheKey = `${TEAM_CACHE_PREFIX}${teamId}`;
  try {
    await redisClient.del(cacheKey);
    logger.info(`Cache invalidated for key: ${cacheKey}`);
  } catch (error) {
    logger.error('Redis DEL command failed during update:', error);
  }
  
  return team;
}

/**
 * @desc    منحل کردن یک تیم (با بی‌اعتبار کردن کش)
 */
async function deleteTeamById(teamId) {
    const team = await Team.findById(teamId);
    if (!team) throw new ApiError(404, 'تیم یافت نشد.');

    const activeRegistration = await Registration.findOne({ team: teamId, status: { $in: ['playing', 'active'] } });
    if (activeRegistration) {
        throw new ApiError(400, 'امکان حذف تیمی که در یک تورنومنت فعال است، وجود ندارد.');
    }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        await User.updateMany({ _id: { $in: team.members } }, { $pull: { teams: teamId } }, { session });
        await team.remove({ session });
        
        // ۵. بی‌اعتبار کردن کش پس از حذف
        const cacheKey = `${TEAM_CACHE_PREFIX}${teamId}`;
        try {
            await redisClient.del(cacheKey);
            logger.info(`Cache invalidated for key: ${cacheKey}`);
        } catch (error) {
            logger.error('Redis DEL command failed during delete:', error);
        }

        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw new ApiError(500, 'خطا در حذف تیم.');
    } finally {
        session.endSession();
    }
}


// --- سایر توابع بدون تغییر باقی می‌مانند ---
// @. (createTeam, addMember, removeMember, leaveTeam) @.

// Ensure you export all functions from the service
export default {
  queryTeams,
  getTeamById,
  updateTeamById,
  deleteTeamById,
  // @. include other exported functions here
  // createTeam, addMember, etc.
};