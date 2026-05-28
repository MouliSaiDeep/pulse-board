const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { redis } = require('../redis');

const router = express.Router();

router.post('/acquire', async (req, res, next) => {
  try {
    const { resource } = req.body;

    if (!resource) {
      return res.status(400).json({ error: 'resource identifier is required' });
    }

    const token = uuidv4();

    const result = await redis.set(`lock:${resource}`, token, 'NX', 'EX', 30);

    if (result === 'OK') {
      return res.status(200).json({ acquired: true, token });
    }

    return res.status(409).json({ acquired: false });
  } catch (error) {
    next(error);
  }
});

router.post('/release', async (req, res, next) => {
  try {
    const { resource, token } = req.body;

    if (!resource || !token) {
      return res.status(400).json({ error: 'resource and token are required' });
    }

    // Lua script executes atomically inside Redis to verify that the token
    // currently holding the lock is the one trying to release it.
    // This prevents a client from releasing a lock acquired by another client after a TTL expiry.
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    const result = await redis.eval(luaScript, 1, `lock:${resource}`, token);

    const released = result === 1;

    return res.status(200).json({ released });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
