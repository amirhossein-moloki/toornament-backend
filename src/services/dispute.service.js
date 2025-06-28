// src/api/v1/services/dispute.service.js

import mongoose from 'mongoose';
import Dispute from '#models/tournament/Dispute.model.js';
import Match from '#models/tournament/Match.model.js';
import { ApiError } from '#utils/ApiError.js';

/**
 * @desc    Creates a new dispute for a match transactionally.
 * @param {object} disputeData - Dispute data.
 * @returns {Promise<object>}
 */
async function createDisputeService(disputeData) {
    const { match: matchId, reporter: reporterId } = disputeData;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const match = await Match.findById(matchId).session(session);
        if (!match) {
            throw new ApiError(404, 'Match not found.');
        }

        // 1. Check if the reporter is one of the participants. This is a business rule, not just authorization.
        const isParticipant = match.participants.some(p => p.participantId.toString() === reporterId.toString());
        if (!isParticipant) {
            throw new ApiError(403, 'You are not allowed to create a dispute for this match as you are not a participant.');
        }

        // 2. Check if a dispute already exists for this match.
        const existingDispute = await Dispute.findOne({ match: matchId }).session(session);
        if (existingDispute) {
            throw new ApiError(400, 'A dispute already exists for this match.');
        }

        // 3. Change match status to "disputed".
        match.status = 'disputed';
        await match.save({ session });

        // 4. Create the dispute document.
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
 * @desc    Retrieves dispute information by ID. Authorization handled by middleware.
 * @param {string} disputeId - Dispute ID.
 * @returns {Promise<object>}
 */
async function getDisputeByIdService(disputeId) {
    const dispute = await Dispute.findById(disputeId)
        .populate('match', 'participants')
        .populate('reporter', 'username avatar')
        .populate('comments.author', 'username avatar')
        .lean();

    if (!dispute) {
        throw new ApiError(404, 'Dispute not found.');
    }

    // Authorization (isParticipant or isAdmin) is now handled by a middleware (authorizeDisputeAccess)
    // before this service function is called. The service merely fetches the data.
    return dispute;
}

/**
 * @desc    Adds a comment to a dispute. Authorization handled by middleware.
 * @param {string} disputeId - Dispute ID.
 * @param {string} authorId - Author ID of the comment.
 * @param {string} content - Content of the comment.
 * @returns {Promise<object>}
 */
async function addCommentToDisputeService(disputeId, authorId, content) {
    const dispute = await Dispute.findById(disputeId);
    if (!dispute) throw new ApiError(404, 'Dispute not found.');

    // Authorization (isParticipant or isAdmin) is now handled by a middleware (authorizeDisputeAccess)
    // before this service function is called. The service merely adds the comment.

    dispute.comments.push({ author: authorId, content });
    await dispute.save();
    return dispute;
}

/**
 * @desc    Handles dispute resolution by an admin. Authorization handled by middleware.
 * @param {string} disputeId - Dispute ID.
 * @param {string} adminId - Admin ID resolving the dispute.
 * @param {object} resolutionData - Resolution data (e.g., winner, final match status).
 * @returns {Promise<object>}
 */
async function resolveDisputeService(disputeId, adminId, resolutionData) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const dispute = await Dispute.findById(disputeId).session(session);
        if (!dispute) throw new ApiError(404, 'Dispute not found.');

        if (dispute.status !== 'under_review' && dispute.status !== 'open') {
            throw new ApiError(400, `Cannot resolve a dispute with status '${dispute.status}'.`);
        }

        const match = await Match.findById(dispute.match).session(session);
        if (!match) {
            throw new ApiError(404, 'Match associated with dispute not found.');
        }

        // Apply resolution logic to the match
        if (resolutionData.outcome === 'winner' && resolutionData.winnerId) {
            match.winner = resolutionData.winnerId;
            match.status = 'completed';
            if (resolutionData.score) {
                match.score = resolutionData.score;
            }
        } else if (resolutionData.outcome === 'cancelled') {
            match.status = 'cancelled';
            match.winner = null;
        } else if (resolutionData.outcome === 'reverted') {
            match.status = resolutionData.previousStatus || 'completed';
        }
        // @. add other resolution scenarios

        await match.save({ session });

        dispute.status = 'resolved';
        dispute.assignedTo = adminId;
        dispute.resolution = resolutionData;

        await dispute.save({ session });
        await session.commitTransaction();
        return dispute;

    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}

export {
    createDisputeService,
    getDisputeByIdService,
    addCommentToDisputeService,
    resolveDisputeService
};
