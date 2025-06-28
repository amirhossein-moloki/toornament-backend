import { body, query, param } from 'express-validator';
import { MATCH_STATUSES, PARTICIPANT_MODELS } from '#config/constants.js';

export const matchValidators = {
  getMatches: [
    query('tournamentId').optional().isMongoId().withMessage('INVALID_TOURNAMENT_ID'),
    query('userId').optional().isMongoId().withMessage('INVALID_USER_ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('PAGE_MUST_BE_POSITIVE_INTEGER'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('LIMIT_MUST_BE_BETWEEN_1_AND_100'),
  ],

  getById: [
    param('id').isMongoId().withMessage('INVALID_MATCH_ID'),
  ],

  reportResult: [
    body().custom((value, { req }) => {
      const hasScores = req.body.scores !== undefined;
      const hasResults = req.body.results !== undefined;
      if (hasScores && hasResults) {
        throw new Error('ONLY_ONE_OF_SCORES_OR_RESULTS_SHOULD_BE_PROVIDED');
      }
      if (!hasScores && !hasResults) {
        throw new Error('EITHER_SCORES_OR_RESULTS_IS_REQUIRED');
      }
      return true;
    }),

    // Validation for standard 'scores' format
    body('scores')
      .if(body('scores').exists())
      .isArray({ min: 2, max: 2 }).withMessage('SCORES_ARRAY_MUST_CONTAIN_EXACTLY_2_PARTICIPANTS')
      .custom((scores = []) => {
        const participantIds = scores.map(s => s.participantId);
        const uniqueParticipantIds = new Set(participantIds);
        if (uniqueParticipantIds.size !== participantIds.length) {
          throw new Error('PARTICIPANT_IDS_IN_SCORES_MUST_BE_UNIQUE');
        }
        return true;
      }),
    body('scores.*.participantId').if(body('scores').exists()).isMongoId().withMessage('INVALID_PARTICIPANT_ID_IN_SCORES'),
    body('scores.*.score').if(body('scores').exists()).isInt({ min: 0 }).withMessage('SCORE_MUST_BE_A_NON_NEGATIVE_INTEGER'),

    // Validation for battle-royale 'results' format
    body('results').if(body('results').exists()).isArray({ min: 1 }).withMessage('RESULTS_MUST_BE_AN_ARRAY'),
    body('results.*.participantId').if(body('results').exists()).isMongoId().withMessage('INVALID_PARTICIPANT_ID_IN_RESULTS'),
    body('results.*.rank').if(body('results').exists()).isInt({ min: 1 }).withMessage('RANK_MUST_BE_A_POSITIVE_INTEGER'),
    body('results.*.kills').if(body('results').exists()).isInt({ min: 0 }).withMessage('KILLS_MUST_BE_A_NON_NEGATIVE_INTEGER'),
  ],

  updateLobby: [
      body('code').optional().trim().isString().withMessage('LOBBY_CODE_MUST_BE_A_STRING'),
      body('password').optional().trim().isString().withMessage('LOBBY_PASSWORD_MUST_BE_A_STRING'),
      body('isPublished').optional().isBoolean().withMessage('IS_PUBLISHED_MUST_BE_A_BOOLEAN'),
  ]
};
