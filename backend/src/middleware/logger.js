function redactUrl(url) {
  try {
    const parsed = new URL(url, 'http://localhost');
    for (const key of ['token', 'access_token', 'authorization', 'secret']) {
      if (parsed.searchParams.has(key)) {
        parsed.searchParams.set(key, '[REDACTED]');
      }
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch (_) {
    return url.split('?')[0];
  }
}

function requestLogger(req, res, next) {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${redactUrl(req.originalUrl)}`
  );
  next();
}

module.exports = requestLogger;