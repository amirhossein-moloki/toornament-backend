import mongoose from 'mongoose';
import Match from '#models/tournament/Match.model.js';
import Tournament from '#models/tournament/Tournament.model.js';
import { ApiError } from '#utils/ApiError.js';
import _ from 'lodash';

/**
 * @desc    دریافت لیست مسابقات با فیلترینگ و صفحه‌بندی (کاملاً بهینه‌سازی شده)
 * @param {object} filter - فیلترهای کوئری (tournamentId, userId)
 * @param {object} options - گزینه‌های صفحه‌بندی (page, limit)
 * @returns {Promise<object>}
 */
async function queryMatches(filter, options) {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  const query = {};
  if (filter.tournamentId) query.tournament = filter.tournamentId;
  if (filter.userId) query['participants.participantId'] = filter.userId;

  // اصلاحیه نهایی: استفاده از متدهای بهینه Mongoose به جای Aggregation Pipeline پیچیده
  const matchesPromise = Match.find(query)
    .populate({
      path: 'participants.participantId',
      select: 'name username avatar' // populate به درستی refPath را مدیریت می‌کند
    })
    .sort({ scheduledTime: 1 })
    .skip(skip)
    .limit(limit)
    .select('tournament status participants scheduledTime') // انتخاب فیلدهای ضروری برای نمای لیست
    .lean();

  const totalResultsPromise = Match.countDocuments(query);

  // اجرای موازی دو کوئری برای افزایش سرعت
  const [matches, totalResults] = await Promise.all([matchesPromise, totalResultsPromise]);

  return {
    results: matches,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(totalResults / limit),
    totalResults,
  };
}

/**
 * @desc    دریافت جزئیات یک مسابقه با شناسه
 * @param {string} matchId - شناسه مسابقه
 * @param {string} requestingUserId - شناسه کاربر درخواست‌دهنده برای بررسی دسترسی
 * @returns {Promise<object>}
 */
async function getMatchById(matchId, requestingUserId) {
  const match = await Match.findById(matchId).populate('participants.participantId', 'name username avatar').lean();
  if (!match) throw new ApiError(404, 'مسابقه یافت نشد.');

  const tournament = await Tournament.findById(match.tournament).select('organizer').lean();
  const isParticipant = match.participants.some(p => p.participantId._id.toString() === requestingUserId.toString());
  const isOrganizer = tournament.organizer.toString() === requestingUserId.toString();

  if (!isParticipant && !isOrganizer) {
    throw new ApiError(403, 'شما اجازه مشاهده این مسابقه را ندارید.');
  }

  return match;
}

/**
 * @desc    ثبت نتیجه یک مسابقه توسط یکی از شرکت‌کنندگان به صورت تراکنشی
 * @param {string} matchId - شناسه مسابقه
 * @param {string} reporterId - شناسه کاربر گزارش‌دهنده
 * @param {object} resultData - داده‌های نتیجه (scores or results)
 */
async function reportResult(matchId, reporterId, resultData) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const match = await Match.findById(matchId).session(session);
    if (!match) throw new ApiError(404, 'مسابقه یافت نشد.');

    const isReporterParticipant = match.participants.some(p => p.participantId.toString() === reporterId);
    if (!isReporterParticipant) throw new ApiError(403, 'شما اجازه ثبت نتیجه برای این مسابقه را ندارید.');

    if (match.status !== 'active') throw new ApiError(400, `نمی‌توان برای مسابقه‌ای با وضعیت '${match.status}' نتیجه ثبت کرد.`);
    if (match.reportedBy) throw new ApiError(400, 'یک نتیجه قبلاً ثبت شده و در انتظار تایید است.');

    const participantIdsInMatch = match.participants.map(p => p.participantId.toString());
    const participantIdsInResult = (resultData.scores || resultData.results).map(r => r.participantId);
    if (!_.isEqual(_.sortBy(participantIdsInMatch), _.sortBy(participantIdsInResult))) {
      throw new ApiError(400, 'شرکت‌کنندگان در نتیجه ثبت شده با شرکت‌کنندگان مسابقه مطابقت ندارند.');
    }

    if (resultData.scores) {
        const [p1Score, p2Score] = resultData.scores;
        if (p1Score.score === p2Score.score) throw new ApiError(400, 'نتیجه مساوی قابل قبول نیست.');
        match.scores = resultData.scores;
    } else if (resultData.results) {
        match.results = resultData.results;
    }

    match.reportedBy = reporterId;
    match.status = 'disputed';

    await match.save({ session });
    await session.commitTransaction();

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export default {
  queryMatches,
  getMatchById,
  reportResult,
};
