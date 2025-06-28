import User from '@/models/user/User.model.js';
import Team from '@/models/shared/Team.model.js';
import { ApiError } from '@/utils/ApiError.js';
import mongoose from 'mongoose';

// The K-factor determines the maximum possible change in rating.
const K_FACTOR = 32;

/**
 * @private
 * @desc    Calculates the expected score of Player A against Player B.
 */
function _getExpectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * @private
 * @desc    Calculates the new Elo ratings for two opponents after a match.
 */
function _calculateNewRatings(winnerRating, loserRating) {
  const expectedWinnerScore = _getExpectedScore(winnerRating, loserRating);
  const expectedLoserScore = _getExpectedScore(loserRating, winnerRating);

  const newWinnerRating = winnerRating + K_FACTOR * (1 - expectedWinnerScore);
  const newLoserRating = loserRating + K_FACTOR * (0 - expectedLoserScore);

  return {
    newWinnerRating: Math.round(newWinnerRating),
    newLoserRating: Math.round(newLoserRating),
  };
}

/**
 * @desc    Updates the Elo ratings for participants after a match is completed.
 * @param {object} match - The completed match document from Mongoose.
 * @param {object} session - The Mongoose session for the transaction.
 */
async function updateEloForMatch(match, session) {
  if (match.participants.length !== 2 || !match.winner) {
    return; // Elo calculation only supported for 1v1 matches.
  }

  const winnerInfo = match.winner;
  const loserInfo = match.participants.find(
    p => p.participantId.toString() !== winnerInfo.participantId.toString()
  );

  if (!loserInfo) {
    throw new ApiError(500, 'Loser could not be determined for Elo calculation.');
  }

  const WinnerModel = winnerInfo.participantModel === 'User' ? User : Team;
  const LoserModel = loserInfo.participantModel === 'User' ? User : Team;

  const [winner, loser] = await Promise.all([
    WinnerModel.findById(winnerInfo.participantId).session(session),
    LoserModel.findById(loserInfo.participantId).session(session)
  ]);

  if (!winner || !loser) {
    throw new ApiError(404, 'One or more participants not found for Elo update.');
  }
  
  const gameId = match.game.toString();
  let currentWinnerRating, currentLoserRating;

  if (winnerInfo.participantModel === 'User') {
    currentWinnerRating = winner.eloRating.find(r => r.game.toString() === gameId)?.rating || 1000;
  } else {
    currentWinnerRating = winner.stats.rankPoints;
  }

  if (loserInfo.participantModel === 'User') {
    currentLoserRating = loser.eloRating.find(r => r.game.toString() === gameId)?.rating || 1000;
  } else {
    currentLoserRating = loser.stats.rankPoints;
  }
  
  const { newWinnerRating, newLoserRating } = _calculateNewRatings(currentWinnerRating, currentLoserRating);
  
  // --- Update ratings using a robust read-modify-save pattern ---
  
  if (winnerInfo.participantModel === 'User') {
    const ratingIndex = winner.eloRating.findIndex(r => r.game.toString() === gameId);
    if (ratingIndex > -1) {
      // If rating for this game exists, update it.
      winner.eloRating[ratingIndex].rating = newWinnerRating;
    } else {
      // If not, create a new rating entry for this game.
      winner.eloRating.push({ game: gameId, rating: newWinnerRating });
    }
    await winner.save({ session });
  } else {
    winner.stats.rankPoints = newWinnerRating;
    winner.stats.wins += 1;
    await winner.save({ session });
  }

  if (loserInfo.participantModel === 'User') {
    const ratingIndex = loser.eloRating.findIndex(r => r.game.toString() === gameId);
     if (ratingIndex > -1) {
      loser.eloRating[ratingIndex].rating = newLoserRating;
    } else {
      loser.eloRating.push({ game: gameId, rating: newLoserRating });
    }
    await loser.save({ session });
  } else {
    loser.stats.rankPoints = newLoserRating;
    loser.stats.losses += 1;
    await loser.save({ session });
  }
}

export default {
  updateEloForMatch,
};
