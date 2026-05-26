require('dotenv').config();
const express = require('express');
const { redis, subClient } = require('./redis');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

const authMiddleware = require('./middleware/auth');
const rateLimitMiddleware = require('./middleware/rateLimit');

app.use((req, res, next) => {
  const isHealth = req.path === '/health';
  const isLogin = req.path === '/auth/login' && req.method === 'POST';
  
  if (isHealth || isLogin) {
    return next();
  }

  authMiddleware(req, res, (err) => {
    if (err) return next(err);
    rateLimitMiddleware(req, res, next);
  });
});

app.get('/health', async (req, res) => {
  try {
    const pong = await redis.ping();
    if (pong === 'PONG') {
      return res.json({
        status: 'ok',
        redis: 'connected',
        uptime: process.uptime(),
      });
    }
    throw new Error('Redis ping response invalid');
  } catch (error) {
    console.error('[HealthCheck] Redis connection failed:', error.message);
    return res.status(500).json({
      status: 'error',
      redis: 'disconnected',
      error: 'Internal server error',
      uptime: process.uptime(),
    });
  }
});

const authRouter = require('./routes/auth');
const workspacesRouter = require('./routes/workspaces');
const channelsRouter = require('./routes/channels');
const usersRouter = require('./routes/users');
const analyticsRouter = require('./routes/analytics');
const presenceRouter = require('./routes/presence');
const feedRouter = require('./routes/feed');
const locksRouter = require('./routes/locks');
const geoRouter = require('./routes/geo');
const eventsRouter = require('./routes/events');
const attendanceRouter = require('./routes/attendance');
const jobsRouter = require('./routes/jobs');

app.use('/auth', authRouter);
app.use('/workspaces', workspacesRouter);
app.use('/channels', channelsRouter);
app.use('/users', usersRouter);
app.use('/analytics', analyticsRouter);
app.use('/presence', presenceRouter);
app.use('/feed', feedRouter);
app.use('/locks', locksRouter);
app.use('/geo', geoRouter);
app.use('/events', eventsRouter);
app.use('/attendance', attendanceRouter);
app.use('/jobs', jobsRouter);

subClient.psubscribe('channel:*:messages', 'channel:*:typing', (err, count) => {
  if (err) {
    console.error('[PubSub] Subscription to channels pattern failed:', err.message);
  } else {
    console.log(`[PubSub] Subscribed to patterns successfully. Subscriber pattern count: ${count}`);
  }
});

subClient.on('pmessage', (pattern, channel, message) => {
  console.log(`[PubSub] channel=${channel} message=${message}`);
});

app.use((err, req, res, next) => {
  console.error('[Global Error Handler] Caught exception:', err);

  if (err.name && err.name.includes('Redis')) {
    return res.status(500).json({ error: 'Internal server error' });
  }

  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  return res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`[API Server] PulseBoard running on port ${PORT}`);
});
