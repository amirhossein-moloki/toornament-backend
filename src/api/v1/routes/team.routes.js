import { Router } from 'express';
import teamController from '#controllers/team.controller.js';
import { validate } from '#middlewares/validate.middleware.js';
import { teamValidators } from '#validators/team.validator.js';
import { authGuard } from '#middlewares/auth.guard.js';
import { isCaptainGuard } from '#middlewares/team.guard.js';

const router = Router();

/**
 * @openapi
 * tags:
 * name: Teams
 * description: Team management and operations
 */

// ===================================
// Public Routes
// ===================================

/**
 * @openapi
 * /api/v1/teams:
 * get:
 * tags: [Teams]
 * summary: Get a paginated list of teams
 * description: Retrieves a list of all teams, with optional filtering by game and pagination. This endpoint is public.
 * parameters:
 * - in: query
 * name: game
 * schema:
 * type: string
 * description: The ID of the game to filter teams by.
 * - in: query
 * name: page
 * schema:
 * type: integer
 * default: 1
 * description: The page number for pagination.
 * - in: query
 * name: limit
 * schema:
 * type: integer
 * default: 10
 * description: The number of teams to return per page.
 * responses:
 * 200:
 * description: A successful response with a list of teams.
 * 400:
 * description: Bad request for invalid query parameters.
 */
router.get('/', validate(teamValidators.getTeams), teamController.getTeams);

/**
 * @openapi
 * /api/v1/teams/{id}:
 * get:
 * tags: [Teams]
 * summary: Get a single team by its ID
 * description: Retrieves detailed public information about a specific team. This endpoint is public.
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: The unique ID of the team.
 * responses:
 * 200:
 * description: Successful response with team details.
 * 404:
 * description: Team not found.
 */
router.get('/:id', validate(teamValidators.getById), teamController.getTeamById);


// ===================================
// Private, User-Facing Routes
// ===================================

/**
 * @openapi
 * /api/v1/teams:
 * post:
 * tags: [Teams]
 * summary: Create a new team
 * description: Allows an authenticated user to create a new team. The creator automatically becomes the captain.
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - name
 * - tag
 * - game
 * properties:
 * name:
 * type: string
 * example: 'The Conquerors'
 * tag:
 * type: string
 * example: 'TC'
 * game:
 * type: string
 * description: The MongoDB ObjectId of the game.
 * example: '60c72b2f9b1d8e001f8e8b8c'
 * responses:
 * 201:
 * description: Team created successfully.
 * 400:
 * description: Bad request due to invalid data (e.g., name/tag already taken).
 * 401:
 * description: Unauthorized if the user is not authenticated.
 */
router.post('/', authGuard, validate(teamValidators.createTeam), teamController.createTeam);

/**
 * @openapi
 * /api/v1/teams/{id}:
 * patch:
 * tags: [Teams]
 * summary: Update team details (Captain only)
 * description: Allows the captain of a team to update its details, such as name and avatar.
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: The ID of the team to update.
 * requestBody:
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * name:
 * type: string
 * example: 'The Ultimate Conquerors'
 * avatar:
 * type: string
 * format: uri
 * example: 'https://example.com/new-avatar.png'
 * responses:
 * 200:
 * description: Team updated successfully.
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. User is not the captain of this team.
 * 404:
 * description: Team not found.
 */
router.patch('/:id', authGuard, isCaptainGuard, validate([...teamValidators.getById, ...teamValidators.updateTeam]), teamController.updateTeam);

/**
 * @openapi
 * /api/v1/teams/{id}:
 * delete:
 * tags: [Teams]
 * summary: Disband a team (Captain only)
 * description: Allows the captain to permanently delete a team. This action cannot be undone.
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: The ID of the team to delete.
 * responses:
 * 204:
 * description: Team deleted successfully. No content.
 * 401:
 * description: Unauthorized.
 * 403:
 * description: Forbidden. User is not the captain.
 * 404:
 * description: Team not found.
 */
router.delete('/:id', authGuard, isCaptainGuard, validate(teamValidators.getById), teamController.deleteTeam);


// ===================================
// Member Management Routes
// ===================================

/**
 * @openapi
 * /api/v1/teams/{id}/members:
 * post:
 * tags: [Teams]
 * summary: Add a member to the team (Captain only)
 * description: Allows the team captain to add a new user to the team.
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: The ID of the team.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - userId
 * properties:
 * userId:
 * type: string
 * description: The ID of the user to add.
 * responses:
 * 200:
 * description: Member added successfully.
 * 403:
 * description: Forbidden. User is not the captain.
 */
router.post('/:id/members', authGuard, isCaptainGuard, validate([...teamValidators.getById, ...teamValidators.manageMember]), teamController.addMember);

/**
 * @openapi
 * /api/v1/teams/{id}/members/{userId}:
 * delete:
 * tags: [Teams]
 * summary: Remove a member from the team (Captain only)
 * description: Allows the team captain to remove a member from the team.
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: The ID of the team.
 * - in: path
 * name: userId
 * required: true
 * schema:
 * type: string
 * description: The ID of the user to remove.
 * responses:
 * 200:
 * description: Member removed successfully.
 * 403:
 * description: Forbidden. User is not the captain.
 */
router.delete('/:id/members/:userId', authGuard, isCaptainGuard, validate([...teamValidators.getById, ...teamValidators.getMemberById]), teamController.removeMember);

/**
 * @openapi
 * /api/v1/teams/{id}/leave:
 * post:
 * tags: [Teams]
 * summary: Leave a team
 * description: Allows an authenticated member (who is not the captain) to leave a team.
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * description: The ID of the team to leave.
 * responses:
 * 204:
 * description: Successfully left the team. No content.
 * 400:
 * description: Bad request (e.g., captain trying to leave).
 * 401:
 * description: Unauthorized.
 */
router.post('/:id/leave', authGuard, validate(teamValidators.getById), teamController.leaveTeam);


export default router;