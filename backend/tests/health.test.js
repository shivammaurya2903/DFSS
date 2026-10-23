const request = require('supertest');
const createApp = require('../src/config/app');
const config = require('../src/config');

const app = createApp();

describe('HTTP app baseline', () => {
  test('serves the real health endpoint', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      service: 'distributed-file-storage-backend',
      status: 'healthy',
    });
  });

  test('sets security headers and hides the server fingerprint', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
  });

  test('allows configured CORS origins and rejects unknown ones', async () => {
    const allowedOrigin = config.corsOrigins[0];

    const allowed = await request(app)
      .get('/api/health')
      .set('Origin', allowedOrigin);
    expect(allowed.headers['access-control-allow-origin']).toBe(allowedOrigin);

    const rejected = await request(app)
      .get('/api/health')
      .set('Origin', 'https://untrusted.example');
    expect(rejected.headers['access-control-allow-origin']).toBeUndefined();
  });
});
