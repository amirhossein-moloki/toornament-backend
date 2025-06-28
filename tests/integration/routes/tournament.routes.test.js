import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '~/app.js';
import User from '@/models/user/User.model.js';
import Game from '@/models/shared/Game.model.js';
import Tournament from '@/models/tournament/Tournament.model.js';
import Registration from '@/models/user/Registration.model.js';
import config from '@/config/server.config.js';

describe('/api/v1/tournaments routes', () => {
  let mongoServer;
  let adminUser, regularUser, game;
  let adminToken;

  // Helper function to create a user and get a token
  const createUserAndToken = async (role = 'user') => {
    const userData = {
      username: `${role}user${Date.now()}`,
      phoneNumber: `+98912000000${Math.floor(Math.random() * 10)}`,
      password: 'password123',
      role,
      status: 'active',
    };
    const user = await User.create(userData);
    const token = jwt.sign({ id: user._id, role: user.role }, config.jwt.accessSecret);
    return { user, token };
  };

  // --- Test Lifecycle Hooks ---

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create necessary seed data
    const adminData = await createUserAndToken('admin');
    adminUser = adminData.user;
    adminToken = adminData.token;

    const userData = await createUserAndToken('user');
    regularUser = userData.user;

    game = await Game.create({ name: 'Test Game', platform: 'PC', teamSize: 1 });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    // Clean up created documents after each test
    await Tournament.deleteMany({});
    await Registration.deleteMany({});
  });


  // --- Test Suites ---

  describe('POST /', () => {
    it('should return 403 if a non-admin user tries to create a tournament', async () => {
      const regularUserToken = jwt.sign({ id: regularUser._id, role: 'user' }, config.jwt.accessSecret);
      await request(app)
        .post('/api/v1/tournaments')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({ name: 'Unauthorized Tournament', game: game._id })
        .expect(403);
    });

    it('should return 201 and the new tournament if data is valid and user is admin', async () => {
      const tournamentData = {
        name: 'Official Admin Tournament',
        game: game._id.toString(),
        structure: 'single_elimination',
        teamSize: 1,
        maxParticipants: 16,
        rules: 'Standard rules apply.',
        registrationStartDate: new Date(),
        registrationEndDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        checkInStartDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        tournamentStartDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      };

      const res = await request(app)
        .post('/api/v1/tournaments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(tournamentData)
        .expect(201);
      
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe('Official Admin Tournament');
      expect(res.body.organizer).toBe(adminUser._id.toString());
    });
  });

  describe('POST /:id/register', () => {
    let openTournament;

    beforeEach(async () => {
      // Create a tournament that is open for registration
      openTournament = await Tournament.create({
        name: 'Open Reg Tournament',
        game: game._id,
        organizer: adminUser._id,
        status: 'registration_open',
        structure: 'single_elimination',
        teamSize: 1,
        maxParticipants: 16,
        rules: '...',
        registrationStartDate: new Date(Date.now() - 100000), // In the past
        registrationEndDate: new Date(Date.now() + 100000), // In the future
        tournamentStartDate: new Date(Date.now() + 200000),
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      await request(app)
        .post(`/api/v1/tournaments/${openTournament._id}/register`)
        .send()
        .expect(401);
    });

    it('should allow an authenticated user to register for an open tournament', async () => {
      const userToken = jwt.sign({ id: regularUser._id, role: 'user' }, config.jwt.accessSecret);

      const res = await request(app)
        .post(`/api/v1/tournaments/${openTournament._id}/register`)
        .set('Authorization', `Bearer ${userToken}`)
        .send()
        .expect(201);
      
      expect(res.body).toHaveProperty('_id');
      expect(res.body.user).toBe(regularUser._id.toString());
      expect(res.body.tournament).toBe(openTournament._id.toString());

      const registration = await Registration.findById(res.body._id);
      expect(registration).not.toBeNull();
    });

    it('should return 400 if registration is not open', async () => {
        openTournament.status = 'registration_closed';
        await openTournament.save();

        const userToken = jwt.sign({ id: regularUser._id, role: 'user' }, config.jwt.accessSecret);

        await request(app)
            .post(`/api/v1/tournaments/${openTournament._id}/register`)
            .set('Authorization', `Bearer ${userToken}`)
            .send()
            .expect(400);
    });

  });
});
