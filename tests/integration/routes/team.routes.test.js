// tests/integration/routes/team.routes.test.js

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '~/app.js'; // The main Express app
import User from '@/models/user/User.model.js';
import Game from '@/models/shared/Game.model.js';
import Team from '@/models/shared/Team.model.js';
import config from '@/config/server.config.js'; // For JWT secret

describe('/api/v1/teams routes', () => {
    let mongoServer;
    let captainUser, regularUser, game;
    let captainToken, regularUserToken;

    // Helper function to create a user and get a token
    const createUserAndToken = async (userData) => {
        const user = await User.create(userData);
        // Create a token that matches the authGuard logic
        const token = jwt.sign({ id: user._id, role: user.role }, config.jwt.accessSecret, { expiresIn: '1h' });
        return { user, token };
    };

    // --- Test Lifecycle Hooks ---

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        // Create necessary seed data for tests
        const captainData = await createUserAndToken({
            username: 'team_captain',
            phoneNumber: '+989120000001',
            password: 'Password123!',
            role: 'user',
            status: 'active',
        });
        captainUser = captainData.user;
        captainToken = captainData.token;

        const regularUserData = await createUserAndToken({
            username: 'regular_user',
            phoneNumber: '+989120000002',
            password: 'Password123!',
            role: 'user',
            status: 'active',
        });
        regularUser = regularUserData.user;
        regularUserToken = regularUserData.token;

        game = await Game.create({ name: 'Test Game For Teams', platforms: ['PC'], supportedModes: ['5v5'] });
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    afterEach(async () => {
        // Clean up the Team collection after each test to ensure isolation
        await Team.deleteMany({});
    });


    // --- Test Suites ---

    describe('POST /', () => {
        it('should return 401 if user is not authenticated', async () => {
            await request(app)
                .post('/api/v1/teams')
                .send({ name: 'My New Team', tag: 'TNT', game: game._id })
                .expect(401);
        });

        it('should return 201 and the new team if data is valid and user is authenticated', async () => {
            const res = await request(app)
                .post('/api/v1/teams')
                .set('Authorization', `Bearer ${captainToken}`)
                .send({ name: 'My Awesome Team', tag: 'MAT', game: game._id })
                .expect(201);

            expect(res.body).toHaveProperty('_id');
            expect(res.body.name).toBe('My Awesome Team');
            expect(res.body.captain).toBe(captainUser._id.toString());
            expect(res.body.members).toContain(captainUser._id.toString());
        });

        it('should return 400 for invalid data (e.g., missing name)', async () => {
             await request(app)
                .post('/api/v1/teams')
                .set('Authorization', `Bearer ${captainToken}`)
                .send({ tag: 'BAD', game: game._id }) // Missing 'name'
                .expect(400);
        });
    });

    describe('PATCH /:id', () => {
        let team;

        beforeEach(async () => {
            // Create a team before each test in this suite
            team = await Team.create({
                name: 'Original Name',
                tag: 'OGN',
                game: game._id,
                captain: captainUser._id,
                members: [captainUser._id],
            });
        });

        it('should return 403 if a non-captain member tries to update the team', async () => {
            await request(app)
                .patch(`/api/v1/teams/${team._id}`)
                .set('Authorization', `Bearer ${regularUserToken}`) // Using regular user's token
                .send({ name: 'Hacker Attempt' })
                .expect(403);
        });
        
        it('should return 200 and the updated team if the captain updates it', async () => {
            const res = await request(app)
                .patch(`/api/v1/teams/${team._id}`)
                .set('Authorization', `Bearer ${captainToken}`) // Using captain's token
                .send({ name: 'Updated Awesome Name' })
                .expect(200);

            expect(res.body.name).toBe('Updated Awesome Name');
        });
    });
    
    describe('DELETE /:id', () => {
        let team;

         beforeEach(async () => {
            team = await Team.create({
                name: 'Team To Delete',
                tag: 'TTD',
                game: game._id,
                captain: captainUser._id,
                members: [captainUser._id, regularUser._id], // Add another member
            });
        });

        it('should return 403 if a non-captain tries to delete the team', async () => {
            await request(app)
                .delete(`/api/v1/teams/${team._id}`)
                .set('Authorization', `Bearer ${regularUserToken}`)
                .expect(403);
        });

        it('should return 204 if the captain deletes the team', async () => {
            await request(app)
                .delete(`/api/v1/teams/${team._id}`)
                .set('Authorization', `Bearer ${captainToken}`)
                .expect(204);

            // Verify the team is actually deleted
            const deletedTeam = await Team.findById(team._id);
            expect(deletedTeam).toBeNull();
        });
    });
});