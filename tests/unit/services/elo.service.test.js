import mongoose from 'mongoose';
import eloService from '../../../src/services/elo.service.js';
import User from '../../../src/models/user/User.model.js';
import Team from '../../../src/models/shared/Team.model.js';
import { ApiError } from '../../../src/utils/ApiError.js';

// Mock the models to isolate the service logic from the database
jest.mock('../../../src/models/user/User.model.js');
jest.mock('../../../src/models/shared/Team.model.js');

describe('Elo Service', () => {
  describe('updateEloForMatch', () => {
    let mockSession;
    let mockWinnerUser, mockLoserUser, mockWinnerTeam, mockLoserTeam;
    const gameId = new mongoose.Types.ObjectId().toString();

    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();
      
      // Mock mongoose session
      mockSession = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      mongoose.startSession.mockReturnValue(Promise.resolve(mockSession));

      // Mock user and team documents with a save method
      mockWinnerUser = {
        _id: new mongoose.Types.ObjectId(),
        eloRating: [{ game: gameId, rating: 1500 }],
        save: jest.fn().mockResolvedValue(true),
      };
      mockLoserUser = {
        _id: new mongoose.Types.ObjectId(),
        eloRating: [{ game: gameId, rating: 1500 }],
        save: jest.fn().mockResolvedValue(true),
      };
       mockWinnerTeam = {
        _id: new mongoose.Types.ObjectId(),
        stats: { rankPoints: 1600, wins: 5 },
        save: jest.fn().mockResolvedValue(true),
      };
      mockLoserTeam = {
        _id: new mongoose.Types.ObjectId(),
        stats: { rankPoints: 1400, losses: 2 },
        save: jest.fn().mockResolvedValue(true),
      };
    });

    it('should correctly update ratings for two users with equal initial ratings', async () => {
      User.findById.mockImplementation((id) => {
        if (id.equals(mockWinnerUser._id)) return Promise.resolve(mockWinnerUser);
        if (id.equals(mockLoserUser._id)) return Promise.resolve(mockLoserUser);
        return Promise.resolve(null);
      });

      const match = {
        participants: [
          { participantId: mockWinnerUser._id, participantModel: 'User' },
          { participantId: mockLoserUser._id, participantModel: 'User' },
        ],
        winner: { participantId: mockWinnerUser._id, participantModel: 'User' },
        game: gameId,
      };

      await eloService.updateEloForMatch(match, mockSession);

      // Expected new ratings: 1500 + 32 * (1 - 0.5) = 1516
      // 1500 + 32 * (0 - 0.5) = 1484
      expect(mockWinnerUser.eloRating[0].rating).toBe(1516);
      expect(mockLoserUser.eloRating[0].rating).toBe(1484);
      expect(mockWinnerUser.save).toHaveBeenCalledWith({ session: mockSession });
      expect(mockLoserUser.save).toHaveBeenCalledWith({ session: mockSession });
    });

    it('should correctly update ratings when a lower-rated user wins (upset)', async () => {
        mockWinnerUser.eloRating[0].rating = 1400;
        mockLoserUser.eloRating[0].rating = 1600;

        User.findById.mockImplementation((id) => {
            if (id.equals(mockWinnerUser._id)) return Promise.resolve(mockWinnerUser);
            if (id.equals(mockLoserUser._id)) return Promise.resolve(mockLoserUser);
            return Promise.resolve(null);
        });

        const match = {
            participants: [
              { participantId: mockWinnerUser._id, participantModel: 'User' },
              { participantId: mockLoserUser._id, participantModel: 'User' },
            ],
            winner: { participantId: mockWinnerUser._id, participantModel: 'User' },
            game: gameId,
          };

        await eloService.updateEloForMatch(match, mockSession);
        
        // Expected change for winner: 32 * (1 - 0.24) = 24.32 -> 24
        // Expected change for loser: 32 * (0 - 0.76) = -24.32 -> -24
        expect(mockWinnerUser.eloRating[0].rating).toBe(1424);
        expect(mockLoserUser.eloRating[0].rating).toBe(1576);
    });

    it('should create a new rating entry for a user playing their first match in a game', async () => {
        // This user has no prior rating for this game
        const newUser = {
            _id: new mongoose.Types.ObjectId(),
            eloRating: [],
            save: jest.fn().mockResolvedValue(true),
        };
        User.findById.mockImplementation((id) => {
            if (id.equals(newUser._id)) return Promise.resolve(newUser);
            if (id.equals(mockLoserUser._id)) return Promise.resolve(mockLoserUser);
            return Promise.resolve(null);
        });

        const match = {
            participants: [
              { participantId: newUser._id, participantModel: 'User' },
              { participantId: mockLoserUser._id, participantModel: 'User' },
            ],
            winner: { participantId: newUser._id, participantModel: 'User' },
            game: gameId,
          };

        await eloService.updateEloForMatch(match, mockSession);
        
        // Default rating is 1000. Loser is 1500. Expected change for winner: 32 * (1 - 0.05) = 30.4 -> 30
        expect(newUser.eloRating.length).toBe(1);
        expect(newUser.eloRating[0].rating).toBe(1030);
    });

    it('should correctly update ratings for two teams', async () => {
        Team.findById.mockImplementation((id) => {
            if (id.equals(mockWinnerTeam._id)) return Promise.resolve(mockWinnerTeam);
            if (id.equals(mockLoserTeam._id)) return Promise.resolve(mockLoserTeam);
            return Promise.resolve(null);
        });

        const match = {
            participants: [
              { participantId: mockWinnerTeam._id, participantModel: 'Team' },
              { participantId: mockLoserTeam._id, participantModel: 'Team' },
            ],
            winner: { participantId: mockWinnerTeam._id, participantModel: 'Team' },
            game: gameId,
        };

        await eloService.updateEloForMatch(match, mockSession);
        
        // Expected change for winner: 32 * (1 - 0.76) = 7.68 -> 8
        // Expected change for loser: 32 * (0 - 0.24) = -7.68 -> -8
        expect(mockWinnerTeam.stats.rankPoints).toBe(1608);
        expect(mockLoserTeam.stats.rankPoints).toBe(1392);
        expect(mockWinnerTeam.stats.wins).toBe(6);
        expect(mockLoserTeam.stats.losses).toBe(3);
        expect(mockWinnerTeam.save).toHaveBeenCalledWith({ session: mockSession });
        expect(mockLoserTeam.save).toHaveBeenCalledWith({ session: mockSession });
    });
    
    it('should not update Elo for matches with less than 2 participants or no winner', async () => {
        const matchNoWinner = {
            participants: [
              { participantId: mockWinnerUser._id, participantModel: 'User' },
              { participantId: mockLoserUser._id, participantModel: 'User' },
            ],
            winner: null, // No winner
            game: gameId,
        };

        await eloService.updateEloForMatch(matchNoWinner, mockSession);
        expect(User.findById).not.toHaveBeenCalled();
    });

  });
});
