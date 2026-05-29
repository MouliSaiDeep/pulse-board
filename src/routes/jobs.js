const express = require('express');
const { redis } = require('../redis');

const router = express.Router();

router.post('/enqueue', async (req, res, next) => {
  try {
    const userId = req.userId;
    const { type, payload } = req.body;

    if (!type || !payload) {
      return res.status(400).json({ error: 'type and payload are required' });
    }

    const jobData = JSON.stringify({
      type,
      payload,
      userId,
      enqueuedAt: Date.now(),
    });

    await redis.lpush('queue:jobs', jobData);

    return res.status(200).json({ enqueued: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
