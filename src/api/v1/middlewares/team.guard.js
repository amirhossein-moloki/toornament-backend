import Team from '../../models/shared/Team.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncWrapper } from '../utils/async.wrapper.js';

/**
 * Middleware to check if the authenticated user is the captain of the team.
 * The team ID is expected to be in `req.params.id`.
 * This guard must run *after* the authGuard.
 */
const isCaptainGuard = asyncWrapper(async (req, res, next) => {
  const teamId = req.params.id;
  const userId = req.user.id;

  // Find the team by its ID, selecting only the captain field for efficiency.
  const team = await Team.findById(teamId).select('captain').lean();

  // If the team doesn't exist, throw a 404 error.
  if (!team) {
    throw new ApiError(404, 'تیم مورد نظر یافت نشد.');
  }

  // Check if the authenticated user's ID matches the team's captain ID.
  if (team.captain.toString() !== userId) {
    throw new ApiError(403, 'شما اجازه انجام این عملیات را ندارید. تنها کاپیتان تیم دسترسی دارد.');
  }

  // If the user is the captain, proceed to the next middleware or controller.
  next();
});

export { isCaptainGuard };
