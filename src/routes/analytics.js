const express = require('express');
const { redis } = require('../redis');

const router = express.Router();

function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

router.get('/trending', async (req, res, next) => {
  try {
    const result = await redis.zrevrange('trending:channels', 0, 9, 'WITHSCORES');
    
    const trending = [];
    for (let i = 0; i < result.length; i += 2) {
      trending.push({
        channel: result[i],
        score: parseFloat(result[i + 1]),
      });
    }

    return res.status(200).json(trending);
  } catch (error) {
    next(error);
  }
});

router.get('/leaderboard', async (req, res, next) => {
  try {
    const result = await redis.zrevrange('reputation:users', 0, 9, 'WITHSCORES');
    
    const leaderboard = [];
    for (let i = 0; i < result.length; i += 2) {
      leaderboard.push({
        user: result[i],
        score: parseFloat(result[i + 1]),
      });
    }

    return res.status(200).json(leaderboard);
  } catch (error) {
    next(error);
  }
});

router.post('/dau/track', async (req, res, next) => {
  try {
    const userId = req.userId;
    const today = getTodayDateString();
    const key = `analytics:dau:${today}`;

    await redis.pfadd(key, userId);

    await redis.expire(key, 604800);

    return res.status(200).json({ tracked: true });
  } catch (error) {
    next(error);
  }
});

router.get('/dau', async (req, res, next) => {
  try {
    const date = req.query.date || getTodayDateString();
    const key = `analytics:dau:${date}`;

    const approximateCount = await redis.pfcount(key);

    return res.status(200).json({
      date,
      approximate_count: approximateCount,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
