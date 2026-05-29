const express = require('express');
const { redis } = require('../redis');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { type, payload } = req.body;
    const userId = req.userId;

    if (!type || !payload) {
      return res.status(400).json({ error: 'type and payload are required' });
    }

    const entryId = await redis.xadd(
      'stream:events',
      '*',
      'type',
      type,
      'payload',
      JSON.stringify(payload),
      'userId',
      userId
    );

    return res.status(200).json({ id: entryId });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
