const express = require('express');
const { redis } = require('../redis');

const router = express.Router();

router.post('/:id/messages', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    if (!text) {
      return res.status(400).json({ error: 'Message text is required' });
    }

    const payload = JSON.stringify({
      userId,
      text,
      ts: Date.now(),
    });

    await redis.publish(`channel:${id}:messages`, payload);

    return res.status(200).json({ published: true });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/typing', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const payload = JSON.stringify({
      userId,
      ts: Date.now(),
    });

    await redis.publish(`channel:${id}:typing`, payload);

    return res.status(200).json({ published: true });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/activity', async (req, res, next) => {
  try {
    const { id } = req.params;

    const newScore = await redis.zincrby('trending:channels', 1, `channel:${id}`);

    return res.status(200).json({ score: parseFloat(newScore) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
