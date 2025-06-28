// src/api/v1/controllers/dispute.controller.js

import {
    createDisputeService,
    getDisputeByIdService,
    addCommentToDisputeService,
    resolveDisputeService
} from '#services/dispute.service.js';
import { ApiResponse } from '#utils/ApiResponse.js';
import { ApiError } from '#utils/ApiError.js'; // Keep ApiError for specific business logic errors if needed
import { asyncHandler } from '#utils/asyncHandler.js'; // Assuming you have an asyncHandler utility

/**
 * @desc    Controller handler for creating a new dispute.
 * @route   POST /api/v1/disputes
 * @access  Protected (Participant) - Authorization is handled by middleware
 * @description This controller extracts dispute data and reporter ID from the request and
 * calls the dispute service to create a new dispute.
 */
const createDispute = asyncHandler(async (req, res) => {
    // Extract dispute data from request body and add reporter ID from authenticated user
    const disputeData = {
        ...req.body,
        reporter: req.user._id // req.user is set by verifyJWT middleware
    };

    // Call the service layer to handle the business logic and database operations
    const newDispute = await createDisputeService(disputeData);

    // Send back the appropriate HTTP response
    res.status(201).json(new ApiResponse(201, newDispute, 'اختلاف با موفقیت ایجاد شد.'));
});

/**
 * @desc    Controller handler for fetching a dispute by ID.
 * @route   GET /api/v1/disputes/:id
 * @access  Protected (Participant or Admin) - Authorization is handled by authorizeDisputeAccess middleware
 * @description This controller extracts dispute ID from params and calls the dispute service
 * to retrieve the dispute. Access is guaranteed by preceding middleware.
 */
const getDisputeById = asyncHandler(async (req, res) => {
    // Extract dispute ID from request parameters
    const { id: disputeId } = req.params;

    // Call the service layer to retrieve the dispute. Access has already been authorized.
    const dispute = await getDisputeByIdService(disputeId);

    // Send back the appropriate HTTP response
    res.status(200).json(new ApiResponse(200, dispute, 'اختلاف با موفقیت بازیابی شد.'));
});

/**
 * @desc    Controller handler for adding a comment to a dispute.
 * @route   POST /api/v1/disputes/:id/comments
 * @access  Protected (Participant or Admin) - Authorization is handled by authorizeDisputeAccess middleware
 * @description This controller extracts dispute ID, comment content, and author ID from the request,
 * and calls the dispute service to add the comment. Access is guaranteed by preceding middleware.
 */
const addCommentToDispute = asyncHandler(async (req, res) => {
    // Extract dispute ID from request parameters
    const { id: disputeId } = req.params;
    // Extract comment content from request body
    const { content } = req.body;
    // Extract author ID from authenticated user
    const authorId = req.user._id; // req.user is set by verifyJWT middleware

    // Call the service layer to handle adding the comment. Access has already been authorized.
    const updatedDispute = await addCommentToDisputeService(disputeId, authorId, content);

    // Send back the appropriate HTTP response
    res.status(200).json(new ApiResponse(200, updatedDispute, 'کامنت با موفقیت افزوده شد.'));
});

/**
 * @desc    Controller handler for resolving a dispute by an admin.
 * @route   PUT /api/v1/disputes/:id/resolve
 * @access  Admin Protected - Authorization is handled by rbacGuard('admin') middleware
 * @description This controller extracts dispute ID and resolution data, and calls the dispute
 * service to resolve it. Admin role is guaranteed by preceding middleware.
 */
const resolveDispute = asyncHandler(async (req, res) => {
    // Admin role check is now handled entirely by the rbacGuard middleware in the routes.
    // No manual check (if req.user.role !== 'admin') is needed here.

    // Extract dispute ID from request parameters
    const { id: disputeId } = req.params;
    // Extract resolution data from request body
    const resolutionData = req.body;
    // Extract admin ID from authenticated user
    const adminId = req.user._id; // req.user is set by verifyJWT middleware

    // Call the service layer to handle resolving the dispute
    const resolvedDispute = await resolveDisputeService(disputeId, adminId, resolutionData);

    // Send back the appropriate HTTP response
    res.status(200).json(new ApiResponse(200, resolvedDispute, 'اختلاف با موفقیت حل شد.'));
});

export {
    createDispute,
    getDisputeById,
    addCommentToDispute,
    resolveDispute
};
