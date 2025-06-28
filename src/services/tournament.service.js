import mongoose from 'mongoose';
import Tournament from '@/models/tournament/Tournament.model.js';
import Registration from '@/models/user/Registration.model.js';
import Match from '@/models/tournament/Match.model.js';
import Bracket from '@/models/tournament/Bracket.model.js';
import Dispute from '@/models/tournament/Dispute.model.js';
import { ApiError } from '@/utils/ApiError.js';
import _ from 'lodash'; // A utility library for array manipulation

/**
 * @private
 * @desc    Generates matches for a single-elimination bracket, correctly handling byes.
 * @param {string} tournamentId - The ID of the tournament.
 * @param {string} bracketId - The ID of the bracket.
 * @param {Array} registrations - The array of registration documents.
 * @param {boolean} isTeamTournament - Flag indicating if it's a team tournament.
 * @returns {Array<Match>} An array of match documents to be created.
 */
function _generateSingleEliminationMatches(tournamentId, bracketId, registrations, isTeamTournament) {
    // Shuffle participants for random pairings
    const participants = _.shuffle(registrations.map(r => ({
        // Explicitly determine participant type based on tournament settings
        participantId: isTeamTournament ? r.team : r.user,
        participantModel: isTeamTournament ? 'Team' : 'User'
    })));

    const matches = [];
    const round = 1;

    for (let i = 0; i < participants.length; i += 2) {
        if (participants[i + 1]) { // If there's a direct opponent
            const match = new Match({
                tournament: tournamentId,
                bracket: bracketId,
                round: round,
                participants: [participants[i], participants[i + 1]]
            });
            matches.push(match);
        } else { // Handle a "bye" for the last participant if the count is odd
            const match = new Match({
                tournament: tournamentId,
                bracket: bracketId,
                round: round,
                participants: [participants[i]],
                status: 'completed', // The match is auto-completed
                winner: participants[i], // The participant with the bye is the winner
            });
            matches.push(match);
        }
    }
    return matches;
}


/**
 * @desc    دریافت لیست تورنومنت‌ها با صفحه‌بندی (بهینه‌سازی شده)
 */
async function queryTournaments(options) {
  // @. (کد این تابع بدون تغییر باقی می‌ماند)
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
 * @desc    شروع تورنومنت، ساخت براکت و مسابقات اولیه
 * @param {string} id - شناسه تورنومنت
 */
async function startTournamentAndGenerateBrackets(id) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const tournament = await Tournament.findById(id).session(session);
        if (!tournament) throw new ApiError(404, 'تورنومنت یافت نشد.');

        // 1. Business Logic Validation
        if (tournament.status !== 'registration_closed') {
            throw new ApiError(400, 'تورنومنت باید در وضعیت "پایان ثبت‌نام" باشد تا شروع شود.');
        }

        const registrations = await Registration.find({ tournament: id }).lean().session(session);
        if (registrations.length < 2) {
            throw new ApiError(400, 'برای شروع تورنومنت حداقل به ۲ شرکت‌کننده نیاز است.');
        }

        // 2. Update tournament status
        tournament.status = 'active';

        // 3. Generate Bracket and Matches based on structure
        const bracket = new Bracket({
            tournament: id,
            name: 'Main Bracket',
        });
        
        let matches = [];
        const isTeamTournament = tournament.teamSize > 1;

        if (tournament.structure === 'single_elimination') {
            matches = _generateSingleEliminationMatches(id, bracket._id, registrations, isTeamTournament);
        } else {
            // Fulfill the contract by explicitly rejecting unsupported structures
            throw new ApiError(501, `ساختار تورنومنت '${tournament.structure}' هنوز پیاده‌سازی نشده است.`);
        }
        
        await Bracket.create([bracket], { session });
        await Match.create(matches, { session });
        
        tournament.brackets.push(bracket._id);
        
        await tournament.save({ session });
        await session.commitTransaction();
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}


// @. (سایر توابع سرویس مانند getTournamentById, createTournament و @.)

async function getTournamentById(id) {
    const tournament = await Tournament.findById(id).populate('game organizer', 'name username avatar');
    if (!tournament) {
      throw new ApiError(404, 'تورنومنتی با این شناسه یافت نشد.');
    }
    return tournament;
}
  
async function createTournament(tournamentData) {
    if (new Date(tournamentData.registrationEndDate) <= new Date(tournamentData.registrationStartDate)) {
        throw new ApiError(400, 'تاریخ پایان ثبت‌نام باید بعد از تاریخ شروع آن باشد.');
      }
      if (new Date(tournamentData.tournamentStartDate) <= new Date(tournamentData.registrationEndDate)) {
        throw new ApiError(400, 'تاریخ شروع تورنومنت باید بعد از پایان ثبت‌نام باشد.');
      }
      return Tournament.create(tournamentData);
}

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
  startTournamentAndGenerateBrackets,
};
