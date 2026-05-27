const express = require('express');
const { redis } = require('../redis');

const router = express.Router();

router.post('/:id/members', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    await redis.sadd(`workspace:${id}:members`, userId);
    await redis.sadd(`user:${userId}:workspaces`, id);

    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/members/:userId', async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    await redis.srem(`workspace:${id}:members`, userId);
    await redis.srem(`user:${userId}:workspaces`, id);

    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/members', async (req, res, next) => {
  try {
    const { id } = req.params;

    const members = await redis.smembers(`workspace:${id}:members`);

    return res.status(200).json(members);
  } catch (error) {
    next(error);
  }
});

router.get('/common/:userId1/:userId2', async (req, res, next) => {
  try {
    const { userId1, userId2 } = req.params;

    const commonWorkspaces = await redis.sinter(
      `user:${userId1}:workspaces`,
      `user:${userId2}:workspaces`
    );

    return res.status(200).json(commonWorkspaces);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/join', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const eventPayload = JSON.stringify({
      event: 'joined_workspace',
      workspaceId: id,
      ts: Date.now(),
    });

    await redis.multi()
      .sadd(`workspace:${id}:members`, userId)
      .sadd(`user:${userId}:workspaces`, id)
      .lpush(`feed:${userId}`, eventPayload)
      .ltrim(`feed:${userId}`, 0, 99)
      .exec();

    return res.status(200).json({ joined: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
