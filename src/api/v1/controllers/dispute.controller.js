import mongoose from 'mongoose';
import Dispute from '../models/tournament/Dispute.model.js';
import Match from '../models/tournament/Match.model.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * @desc    ایجاد یک اختلاف جدید برای یک مسابقه به صورت تراکنشی
 * @param {object} disputeData - داده‌های اختلاف
 * @returns {Promise<object>}
 */
async function createDispute(disputeData) {
  const { match: matchId, reporter: reporterId } = disputeData;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const match = await Match.findById(matchId).session(session);
    if (!match) {
      throw new ApiError(404, 'مسابقه یافت نشد.');
    }

    // ۱. بررسی اینکه گزارش‌دهنده یکی از شرکت‌کنندگان است
    const isParticipant = match.participants.some(p => p.participantId.toString() === reporterId.toString());
    if (!isParticipant) {
      throw new ApiError(403, 'شما اجازه ایجاد اختلاف برای این مسابقه را ندارید.');
    }

    // ۲. بررسی اینکه آیا برای این مسابقه قبلاً اختلاف ثبت شده است
    const existingDispute = await Dispute.findOne({ match: matchId }).session(session);
    if (existingDispute) {
      throw new ApiError(400, 'برای این مسابقه قبلاً یک اختلاف ثبت شده است.');
    }
    
    // ۳. تغییر وضعیت مسابقه به "مورد اختلاف"
    match.status = 'disputed';
    await match.save({ session });

    // ۴. ایجاد سند اختلاف
    const newDispute = new Dispute(disputeData);
    await newDispute.save({ session });
    
    await session.commitTransaction();
    return newDispute;

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * @desc    دریافت اطلاعات یک اختلاف با شناسه
 * @param {string} disputeId - شناسه اختلاف
 * @param {string} requestingUserId - شناسه کاربر درخواست‌دهنده
 * @returns {Promise<object>}
 */
async function getDisputeById(disputeId, requestingUserId) {
    const dispute = await Dispute.findById(disputeId)
        .populate('match', 'participants')
        .populate('reporter', 'username avatar')
        .populate('comments.author', 'username avatar')
        .lean();

    if (!dispute) {
        throw new ApiError(404, 'اختلاف یافت نشد.');
    }

    // منطق دسترسی: ادمین یا شرکت‌کنندگان مسابقه مربوطه
    const isParticipant = dispute.match.participants.some(
        p => p.participantId.toString() === requestingUserId
    );
    // TODO: افزودن بررسی نقش ادمین
    // const isAdmin = req.user.role === 'admin';

    if (!isParticipant) {
        throw new ApiError(403, 'شما اجازه مشاهده این اختلاف را ندارید.');
    }

    return dispute;
}

/**
 * @desc    افزودن کامنت به یک اختلاف
 */
async function addCommentToDispute(disputeId, authorId, content) {
    const dispute = await Dispute.findById(disputeId);
    if (!dispute) throw new ApiError(404, 'اختلاف یافت نشد.');

    // TODO: بررسی دسترسی کاربر برای کامنت گذاشتن (شرکت‌کننده یا ادمین)
    
    dispute.comments.push({ author: authorId, content });
    await dispute.save();
    return dispute;
}

/**
 * @desc    رسیدگی و حل یک اختلاف توسط ادمین
 */
async function resolveDispute(disputeId, adminId, resolutionData) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const dispute = await Dispute.findById(disputeId).session(session);
        if (!dispute) throw new ApiError(404, 'اختلاف یافت نشد.');

        if (dispute.status !== 'under_review' && dispute.status !== 'open') {
            throw new ApiError(400, `نمی‌توان اختلافی با وضعیت '${dispute.status}' را حل کرد.`);
        }
        
        dispute.status = 'resolved';
        dispute.assignedTo = adminId;
        dispute.resolution = resolutionData;
        
        // TODO: بر اساس تصمیم نهایی ادمین، نتیجه مسابقه را تغییر بده
        // (مثلا برنده را عوض کن، مسابقه را لغو کن و ...)
        // const match = await Match.findById(dispute.match).session(session);
        // ... apply resolution logic to the match ...
        // await match.save({ session });

        await dispute.save({ session });
        await session.commitTransaction();
        return dispute;

    } catch(error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}


export default {
  createDispute,
  getDisputeById,
  addComment,
  resolveDispute
};
