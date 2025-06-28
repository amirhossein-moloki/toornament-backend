import registrationService from '#services/registration.service.js';
import { asyncWrapper } from '#utils/async.wrapper.js';
import { ApiResponse } from '#utils/ApiResponse.js';

/**
 * @desc    Handles the logic for registering a user/team for a tournament.
 * @route   POST /api/v1/tournaments/:id/register
 * @access  Private
 */
const registerForTournament = asyncWrapper(async (req, res) => {
  const registrationData = {
    tournamentId: req.params.id,
    userId: req.user.id,
    teamId: req.body.teamId, // Can be undefined for individual tournaments
  };

  const registration = await registrationService.createRegistration(registrationData);

  res.status(201).json(new ApiResponse(201, registration, 'Successfully registered for the tournament.'));
});

export default {
  registerForTournament,
};
