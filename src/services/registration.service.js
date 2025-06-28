import mongoose from 'mongoose';
import Registration from '@/models/user/Registration.model.js';
import Tournament from '@/models/tournament/Tournament.model.js';
import Team from '@/models/shared/Team.model.js';
import User from '@/models/user/User.model.js';
import { ApiError } from '@/utils/ApiError.js';

/**
 * @desc Handles the logic for registering a user/team for a tournament with transactional integrity.
 * @param {object} registrationData - Contains userId, tournamentId, and optional teamId.
 * @returns {Promise<object>} The created registration document.
 */
async function createRegistration(registrationData) {
  const { userId, tournamentId, teamId } = registrationData;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // --- Efficiently fetch all necessary data in parallel ---
    const [tournament, user, existingUserRegistration, currentRegistrationCount] = await Promise.all([
      Tournament.findById(tournamentId).session(session),
      User.findById(userId).session(session),
      Registration.findOne({ user: userId, tournament: tournamentId }).session(session),
      Registration.countDocuments({ tournament: tournamentId }).session(session),
    ]);

    // --- Business Logic Validations (inside transaction) ---
    if (!tournament) throw new ApiError(404, 'تورنومنت یافت نشد.');
    if (!user) throw new ApiError(404, 'کاربر یافت نشد.');
    if (tournament.status !== 'registration_open') throw new ApiError(400, 'ثبت‌نام برای این تورنومنت باز نیست.');
    if (currentRegistrationCount >= tournament.maxParticipants) throw new ApiError(400, 'ظرفیت این تورنومنت تکمیل شده است.');
    if (existingUserRegistration) throw new ApiError(400, 'شما قبلاً در این تورنومنت ثبت‌نام کرده‌اید.');
    
    const isTeamTournament = tournament.teamSize > 1;

    // --- Handle Team vs. Individual Registration ---
    if (isTeamTournament) {
      if (!teamId) throw new ApiError(400, 'برای ثبت‌نام در این تورنومنت، ارائه شناسه تیم الزامی است.');
      
      const [team, existingTeamRegistration] = await Promise.all([
          Team.findById(teamId).session(session),
          Registration.findOne({ tournament: tournamentId, team: teamId }).session(session)
      ]);

      if (!team) throw new ApiError(404, 'تیم مورد نظر یافت نشد.');
      // Corrected Logic: Assumes team.members is an array of ObjectIds
      if (!team.members.includes(userId)) throw new ApiError(403, 'شما عضو این تیم نیستید.');
      if (team.members.length !== tournament.teamSize) throw new ApiError(400, `تعداد اعضای تیم باید دقیقاً ${tournament.teamSize} نفر باشد.`);
      if (existingTeamRegistration) throw new ApiError(400, 'این تیم قبلاً در تورنومنت ثبت‌نام کرده است.');

    } else if (teamId) {
      throw new ApiError(400, 'این تورنومنت فردی است و نمی‌توانید با تیم ثبت‌نام کنید.');
    }

    // --- Handle Entry Fee within transaction ---
    if (tournament.entryFee > 0) {
      if (user.walletBalance < tournament.entryFee) throw new ApiError(402, 'موجودی کیف پول شما کافی نیست.');
      user.walletBalance -= tournament.entryFee;
      await user.save({ session });
    }

    // --- Create Registration document ---
    const registration = new Registration({
      user: userId,
      tournament: tournamentId,
      team: isTeamTournament ? teamId : undefined,
      paymentStatus: tournament.entryFee > 0 ? 'paid' : 'not_applicable',
    });
    await registration.save({ session });

    await session.commitTransaction();
    return registration;

  } catch (error) {
    await session.abortTransaction();
    // Re-throw the error to be handled by the global error handler
    throw error;
  } finally {
    session.endSession();
  }
}

export default {
  createRegistration,
};
