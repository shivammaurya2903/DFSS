const jwt = require('jsonwebtoken');
const config = require('../src/config');
const authenticateToken = require('../src/middleware/authenticateToken');
const rateLimit = require('../src/middleware/rateLimit');

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
