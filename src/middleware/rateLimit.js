const { redis } = require('../redis');

const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX, 10) || 60;

async function rateLimitMiddleware(req, res, next) {
  try {
    const userId = req.userId;
    if (!userId) {
      return next();
    }

    const minuteTimestamp = Math.floor(Date.now() / 60000);
    const key = `rate_limit:${userId}:${minuteTimestamp}`;

    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, 60);
    }

    if (count > RATE_LIMIT_MAX) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    next();
  } catch (error) {
    console.error('[RateLimitMiddleware] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = rateLimitMiddleware;
