import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from 'app'; // The main Express app
import User from '#models/user/User.model.js';
import authService from '#services/auth.service.js';

// Mock the external SMS service to prevent actual SMS sending during tests
jest.mock('../../../src/services/sms.service.js', () => ({
  sendSms: jest.fn().mockResolvedValue(true),
}));

describe('/api/v1/auth routes', () => {
  let mongoServer;

  // --- Test Lifecycle Hooks ---

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    // Clean up the database after each test
    await User.deleteMany({});
  });


  // --- Test Suites ---

  describe('POST /otp/send', () => {
    it('should send an OTP and return a success message for a valid phone number', async () => {
      const res = await request(app)
        .post('/api/v1/auth/otp/send')
        .send({ phoneNumber: '+989123456789' })
        .expect(200);

      expect(res.body.message).toBe('کد تایید با موفقیت ارسال شد.');
      
      // Verify that a user was created in the DB with a verification code
      const user = await User.findOne({ phoneNumber: '+989123456789' });
      expect(user).not.toBeNull();
      expect(user.verificationCode).toBeDefined();
    });

    it('should return a 400 error for an invalid phone number', async () => {
      await request(app)
        .post('/api/v1/auth/otp/send')
        .send({ phoneNumber: '123' })
        .expect(400);
    });
  });

  describe('POST /otp/verify', () => {
    it('should register a new user, return tokens, and set a refresh token cookie', async () => {
      // Step 1: Send OTP to create the user and get a valid code
      const phoneNumber = '+989121112233';
      await authService.sendOtp(phoneNumber); // Use the service directly to get state
      const user = await User.findOne({ phoneNumber });
      const otp = user.verificationCode;

      // Step 2: Verify the OTP
      const res = await request(app)
        .post('/api/v1/auth/otp/verify')
        .send({ phoneNumber, otp })
        .expect(200);

      // Assertions
      expect(res.body).toHaveProperty('accessToken');
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('refreshToken=');
      expect(res.headers['set-cookie'][0]).toContain('HttpOnly');

      // Check user status in DB
      const verifiedUser = await User.findById(user._id);
      expect(verifiedUser.status).toBe('active');
    });

    it('should return a 400 error for an invalid OTP', async () => {
        const phoneNumber = '+989124445566';
        await authService.sendOtp(phoneNumber);

        await request(app)
            .post('/api/v1/auth/otp/verify')
            .send({ phoneNumber, otp: '000000' }) // Invalid OTP
            .expect(400);
    });
  });
  
});
