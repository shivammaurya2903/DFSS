jest.mock('../src/models/User');

const jwt = require('jsonwebtoken');
const config = require('../src/config');
const User = require('../src/models/User');
const authenticateToken = require('../src/middleware/authenticateToken');
const rateLimit = require('../src/middleware/rateLimit');
const { updateMe } = require('../src/controllers/authController');

function mockResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

describe('authenticateToken', () => {
  beforeEach(() => rateLimit.reset());

  test('rejects a token supplied only in the query string', () => {
    const token = jwt.sign({ userId: 'user-1', role: 'user' }, config.jwtSecret);
    const req = { headers: {}, query: { token } };
    const res = mockResponse();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('AUTH_REQUIRED');
  });

  test('accepts a Bearer token and normalizes the user id', () => {
    const token = jwt.sign({ userId: 'user-1', role: 'admin' }, config.jwtSecret);
    const req = { headers: { authorization: `Bearer ${token}` }, query: {} };
    const res = mockResponse();
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user.id).toBe('user-1');
    expect(req.user.userId).toBe('user-1');
    expect(req.requestId).toBeTruthy();
  });
});

describe('rateLimit', () => {
  test('returns 429 after the configured number of requests', () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 2, keyPrefix: 'test' });
    const next = jest.fn();

    const first = mockResponse();
    limiter({ ip: '127.0.0.1', body: {} }, first, next);
    const second = mockResponse();
    limiter({ ip: '127.0.0.1', body: {} }, second, next);
    const third = mockResponse();
    limiter({ ip: '127.0.0.1', body: {} }, third, next);

    expect(next).toHaveBeenCalledTimes(2);
    expect(third.statusCode).toBe(429);
    expect(third.body.code).toBe('RATE_LIMITED');
    expect(third.headers['Retry-After']).toBeDefined();
  });
});

describe('updateMe (ISS-039)', () => {
  test('updates user name and persists profile', async () => {
    const mockUser = {
      _id: 'user-1',
      name: 'Old Name',
      email: 'user@example.com',
      save: jest.fn().mockResolvedValue(true),
    };
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    const req = { user: { userId: 'user-1' }, body: { name: 'New Name' } };
    const res = mockResponse();

    await updateMe(req, res);

    expect(res.statusCode).toBe(200);
    expect(mockUser.name).toBe('New Name');
    expect(mockUser.save).toHaveBeenCalled();
  });

  test('rejects password change if currentPassword is missing or incorrect', async () => {
    const mockUser = {
      _id: 'user-1',
      name: 'User One',
      email: 'user@example.com',
      comparePassword: jest.fn().mockResolvedValue(false),
      save: jest.fn().mockResolvedValue(true),
    };
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });

    // Missing currentPassword
    const req1 = { user: { userId: 'user-1' }, body: { newPassword: 'newSecretPassword123' } };
    const res1 = mockResponse();
    await updateMe(req1, res1);
    expect(res1.statusCode).toBe(400);

    // Incorrect currentPassword
    const req2 = { user: { userId: 'user-1' }, body: { currentPassword: 'wrongPassword', newPassword: 'newSecretPassword123' } };
    const res2 = mockResponse();
    await updateMe(req2, res2);
    expect(res2.statusCode).toBe(401);
  });
});
