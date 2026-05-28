const express = require('express');
const { redis } = require('../redis');

const router = express.Router();

router.post('/push', async (req, res, next) => {
  try {
    const userId = req.userId;
    const { event } = req.body;

    if (!event) {
      return res.status(400).json({ error: 'event payload is required' });
    }

    const payload = JSON.stringify({
      event,
      ts: Date.now(),
    });

    await redis.lpush(`feed:${userId}`, payload);

    await redis.ltrim(`feed:${userId}`, 0, 99);

    return res.status(200).json({ pushed: true });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId;

    const feedStrings = await redis.lrange(`feed:${userId}`, 0, -1);

    const feed = feedStrings.map((item) => {
      try {
        return JSON.parse(item);
      } catch (err) {
        return { error: 'Invalid feed item data format', raw: item };
      }
    });

    return res.status(200).json(feed);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
