import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import userRoutes from '../src/routes/users';
import { errorHandler, ApiError } from '../src/middleware/errorHandler';
import { userService } from '../src/services/userService';
import { UserActivity } from '@bookshelf/shared';

jest.mock('../src/services/userService');

const app = express();
app.use(express.json());
app.use('/api', userRoutes);
app.use(errorHandler);

const mockedService = userService as jest.Mocked<typeof userService>;

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const userId = 'user_abc123';

const userFixture = {
  id: userId,
  displayName: 'Ada Lovelace',
  avatarUrl: 'https://example.com/ada.jpg',
  favoriteGenres: ['Fiction', 'Science'],
  readingStats: { totalBooks: 3, finishedBooks: 0, reviewedBooks: 1 },
  createdAt: '2026-06-05T00:00:00.000Z',
  updatedAt: '2026-06-05T00:00:00.000Z',
};

const activityFixture: UserActivity[] = [
  { type: 'review', message: 'Reviewed "Dune"', createdAt: '2026-06-05T00:00:00.000Z' },
  { type: 'shelf', message: 'Created shelf "Want to Read"', createdAt: '2026-06-04T00:00:00.000Z' },
];

// ---------------------------------------------------------------------------
// POST /api/users
// ---------------------------------------------------------------------------

describe('POST /api/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a user and return 201', async () => {
    mockedService.createUser.mockReturnValue(userFixture);

    const res = await request(app)
      .post('/api/users')
      .send({ displayName: 'Ada Lovelace', avatarUrl: 'https://example.com/ada.jpg', favoriteGenres: ['Fiction'] });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(userFixture);
    expect(mockedService.createUser).toHaveBeenCalledWith({
      displayName: 'Ada Lovelace',
      avatarUrl: 'https://example.com/ada.jpg',
      favoriteGenres: ['Fiction'],
    });
  });

  it('should create a user with only displayName and return 201', async () => {
    const minimal = { ...userFixture, avatarUrl: '', favoriteGenres: [] };
    mockedService.createUser.mockReturnValue(minimal);

    const res = await request(app)
      .post('/api/users')
      .send({ displayName: 'Ada Lovelace' });

    expect(res.status).toBe(201);
    expect(mockedService.createUser).toHaveBeenCalledWith({ displayName: 'Ada Lovelace' });
  });

  it('should return 400 when displayName is missing', async () => {
    const res = await request(app).post('/api/users').send({ avatarUrl: 'x' });

    expect(res.status).toBe(400);
    expect(res.body.error.status).toBe(400);
    expect(res.body.error.details).toEqual(expect.arrayContaining(['"displayName" is required']));
  });

  it('should return 400 when displayName is empty', async () => {
    const res = await request(app).post('/api/users').send({ displayName: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error.status).toBe(400);
  });

  it('should return 400 when favoriteGenres is not an array', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ displayName: 'Ada', favoriteGenres: 'Fiction' });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual(
      expect.arrayContaining(['"favoriteGenres" must be an array when provided']),
    );
  });

  it('should return 500 when service throws', async () => {
    mockedService.createUser.mockImplementation(() => {
      throw new ApiError(500, 'Failed to save user');
    });

    const res = await request(app).post('/api/users').send({ displayName: 'Ada' });

    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// GET /api/users/:id
// ---------------------------------------------------------------------------

describe('GET /api/users/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the user profile with status 200', async () => {
    mockedService.getUserById.mockReturnValue(userFixture);

    const res = await request(app).get(`/api/users/${userId}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(userFixture);
    expect(mockedService.getUserById).toHaveBeenCalledWith(userId);
  });

  it('should return 404 when user does not exist', async () => {
    mockedService.getUserById.mockReturnValue(null);

    const res = await request(app).get('/api/users/user_unknown');

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('User not found');
  });
});

// ---------------------------------------------------------------------------
// PUT /api/users/:id
// ---------------------------------------------------------------------------

describe('PUT /api/users/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update a user and return 200', async () => {
    const updated = { ...userFixture, displayName: 'Ada B.' };
    mockedService.updateUser.mockReturnValue(updated);

    const res = await request(app)
      .put(`/api/users/${userId}`)
      .send({ displayName: 'Ada B.' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
    expect(mockedService.updateUser).toHaveBeenCalledWith(userId, { displayName: 'Ada B.' });
  });

  it('should return 404 when user does not exist', async () => {
    mockedService.updateUser.mockReturnValue(null);

    const res = await request(app)
      .put('/api/users/user_unknown')
      .send({ displayName: 'Ghost' });

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('User not found');
  });

  it('should return 400 when displayName is missing', async () => {
    const res = await request(app).put(`/api/users/${userId}`).send({});

    expect(res.status).toBe(400);
    expect(res.body.error.status).toBe(400);
  });

  it('should return 500 when service throws', async () => {
    mockedService.updateUser.mockImplementation(() => {
      throw new ApiError(500, 'Failed to save user');
    });

    const res = await request(app)
      .put(`/api/users/${userId}`)
      .send({ displayName: 'Ada' });

    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// GET /api/users/:id/activity
// ---------------------------------------------------------------------------

describe('GET /api/users/:id/activity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return activity list with status 200', async () => {
    mockedService.getActivity.mockReturnValue(activityFixture);

    const res = await request(app).get(`/api/users/${userId}/activity`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: activityFixture });
    expect(mockedService.getActivity).toHaveBeenCalledWith(userId);
  });

  it('should return an empty data array when user has no activity', async () => {
    mockedService.getActivity.mockReturnValue([]);

    const res = await request(app).get(`/api/users/${userId}/activity`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: [] });
  });

  it('should return 404 when user does not exist', async () => {
    mockedService.getActivity.mockReturnValue(null);

    const res = await request(app).get('/api/users/user_unknown/activity');

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('User not found');
  });
});
