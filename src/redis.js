const Redis = require('ioredis');
require('dotenv').config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const retryStrategy = (times) => {
  const delay = Math.min(times * 100, 3000);
  console.warn(`[Redis] Connection lost. Retry attempt ${times}. Retrying in ${delay}ms...`);
  return delay;
};

const redis = new Redis(redisUrl, {
  retryStrategy,
  maxRetriesPerRequest: null, // Crucial for blocking operations (like BRPOP/XREADGROUP) so they don't throw on connection drops
});

const subClient = new Redis(redisUrl, {
  retryStrategy,
  maxRetriesPerRequest: null, // Crucial for Pub/Sub subscription blocking operations
});

redis.on('connect', () => {
  console.log(`[Redis] Connected to primary client at ${redisUrl}`);
});

subClient.on('connect', () => {
  console.log(`[Redis] Connected to Pub/Sub subClient at ${redisUrl}`);
});

redis.on('error', (err) => {
  console.error('[Redis] Primary client error:', err.message);
});

subClient.on('error', (err) => {
  console.error('[Redis] Pub/Sub subClient error:', err.message);
});

module.exports = {
  redis,
  subClient,
};
