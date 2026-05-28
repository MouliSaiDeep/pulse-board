const express = require('express');
const { redis } = require('../redis');

const router = express.Router();

router.post('/online', async (req, res, next) => {
  try {
    const userId = req.userId;

    await redis.sadd('online_users', userId);

    return res.status(200).json({ status: 'online' });
  } catch (error) {
    next(error);
  }
});

router.post('/offline', async (req, res, next) => {
  try {
    const userId = req.userId;

    await redis.srem('online_users', userId);

    return res.status(200).json({ status: 'offline' });
  } catch (error) {
    next(error);
  }
});

router.get('/online', async (req, res, next) => {
  try {
    const onlineUsers = await redis.smembers('online_users');

    return res.status(200).json(onlineUsers);
  } catch (error) {
    next(error);
  }
});

router.get('/check/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const isOnline = await redis.sismember('online_users', userId);

    return res.status(200).json({ online: isOnline === 1 });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
