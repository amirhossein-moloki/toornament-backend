import mongoose from 'mongoose';
import Tournament from '../models/tournament/Tournament.model.js';
import Registration from '../models/user/Registration.model.js';
import Match from '../models/tournament/Match.model.js';
import Bracket from '../models/tournament/Bracket.model.js';
import Dispute from '../models/tournament/Dispute.model.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * @desc    دریافت لیست تورنومنت‌ها با صفحه‌بندی (بهینه‌سازی شده)
 * @param {object} options - گزینه‌های صفحه‌بندی { page, limit }
 * @returns {Promise<object>} - نتیجه شامل لیست تورنومنت‌ها و اطلاعات صفحه‌بندی
 */
async function queryTournaments(options) {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  const queryFilter = {
    status: { $in: ['registration_open', 'registration_closed', 'active', 'completed'] },
  };

  const aggregationPipeline = [
    { $match: queryFilter },
    { $sort: { tournamentStartDate: -1 } },
    {
      $facet: {
        metadata: [{ $count: 'totalResults' }],
        data: [
          { $skip: skip },
          { $limit: limit },
          { $lookup: { from: 'games', localField: 'game', foreignField: '_id', as: 'game' } },
          { $unwind: '$game' },
          {
            $project: {
              name: 1,
              status: 1,
              tournamentStartDate: 1,
              entryFee: 1,
              maxParticipants: 1,
              'game.name': 1,
              'game.icon': 1,
            },
          },
        ],
      },
    },
  ];

  const [result] = await Tournament.aggregate(aggregationPipeline);
  const totalResults = result.metadata[0] ? result.metadata[0].totalResults : 0;

  return {
    results: result.data,
    page,
    limit,
    totalPages: Math.ceil(totalResults / limit),
    totalResults,
  };
}

/**
 * @desc    دریافت جزئیات یک تورنومنت با شناسه
 * @param {string} id - شناسه تورنومنت
 * @returns {Promise<object>} - داکیومنت تورنومنت
 */
async function getTournamentById(id) {
  const tournament = await Tournament.findById(id).populate('game organizer', 'name username avatar');
  if (!tournament) {
    throw new ApiError(404, 'تورنومنتی با این شناسه یافت نشد.');
  }
  return tournament;
}

/**
 * @desc    ایجاد یک تورنومنت جدید با اعتبارسنجی منطق کسب‌وکار
 * @param {object} tournamentData - داده‌های تورنومنت
 * @returns {Promise<object>} - داکیومنت تورنومنت ایجاد شده
 */
async function createTournament(tournamentData) {
  if (new Date(tournamentData.registrationEndDate) <= new Date(tournamentData.registrationStartDate)) {
    throw new ApiError(400, 'تاریخ پایان ثبت‌نام باید بعد از تاریخ شروع آن باشد.');
  }
  if (new Date(tournamentData.tournamentStartDate) <= new Date(tournamentData.registrationEndDate)) {
    throw new ApiError(400, 'تاریخ شروع تورنومنت باید بعد از پایان ثبت‌نام باشد.');
  }
  return Tournament.create(tournamentData);
}

/**
 * @desc    به‌روزرسانی یک تورنومنت با شناسه و اعمال قوانین وضعیت
 * @param {string} id - شناسه تورنومنت
 * @param {object} updateBody - داده‌های جدید برای به‌روزرسانی
 * @returns {Promise<object>} - داکیومنت تورنومنت به‌روز شده
 */
async function updateTournamentById(id, updateBody) {
  const tournament = await Tournament.findById(id);
  if (!tournament) {
    throw new ApiError(404, 'تورنومنتی با این شناسه یافت نشد.');
  }

  const nonUpdatableStatuses = ['active', 'completed', 'canceled'];
  const restrictedFields = ['game', 'structure', 'teamSize', 'maxParticipants', 'entryFee', 'prizeStructure'];

  if (nonUpdatableStatuses.includes(tournament.status)) {
    for (const field of restrictedFields) {
      if (updateBody[field] && updateBody[field] !== tournament[field]) {
        throw new ApiError(400, `امکان تغییر فیلد '${field}' برای یک تورنومنت در وضعیت '${tournament.status}' وجود ندارد.`);
      }
    }
  }

  Object.assign(tournament, updateBody);
  await tournament.save({ validateBeforeSave: true });
  return tournament;
}

/**
 * @desc    حذف یک تورنومنت و تمام داده‌های وابسته به آن
 * @param {string} id - شناسه تورنومنت
 * @returns {Promise<void>}
 */
async function deleteTournamentById(id) {
  const tournament = await Tournament.findById(id);
  if (!tournament) {
    throw new ApiError(404, 'تورنومنتی با این شناسه یافت نشد.');
  }
  if (tournament.status === 'active') {
    throw new ApiError(400, 'امکان حذف یک تورنومنت فعال وجود ندارد.');
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Registration.deleteMany({ tournament: id }, { session });
    await Match.deleteMany({ tournament: id }, { session });
    await Bracket.deleteMany({ tournament: id }, { session });
    await Dispute.deleteMany({ tournament: id }, { session });
    await tournament.remove({ session });
    
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw new ApiError(500, 'خطا در حذف تورنومنت و داده‌های وابسته.');
  } finally {
    session.endSession();
  }
}

export default {
  queryTournaments,
  getTournamentById,
  createTournament,
  updateTournamentById,
  deleteTournamentById,
};
