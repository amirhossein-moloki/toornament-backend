// src/api/v1/routes/dispute.routes.js

import { Router } from 'express';
import {
    createDispute,
    getDisputeById,
    addCommentToDispute,
    resolveDispute
} from '../controllers/dispute.controller.js';
import { verifyJWT } from '@/middlewares/auth.middleware.js'; // Import authentication middleware
import { rbacGuard } from '@/middlewares/rbac.guard.js'; // Import RBAC guard middleware
import { authorizeDisputeAccess } from '@/middlewares/dispute.middleware.js'; // Import custom dispute authorization middleware

const router = Router();

// Apply JWT verification to all dispute routes
router.use(verifyJWT);

// Route to create a new dispute
// Accessible by any authenticated user who is a participant of the match
router.route('/').post(createDispute);

// Route to get a dispute by ID
// Accessible by admins OR participants of the specific dispute's match
router.route('/:id').get(authorizeDisputeAccess, getDisputeById);

// Route to add a comment to a dispute
// Accessible by admins OR participants of the specific dispute's match
router.route('/:id/comments').post(authorizeDisputeAccess, addCommentToDispute);

// Route to resolve a dispute (admin only)
router.route('/:id/resolve').put(rbacGuard('admin'), resolveDispute);

export default router;
