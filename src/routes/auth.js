const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { redis } = require('../redis');

const SESSION_TTL = parseInt(process.env.SESSION_TTL, 10) || 3600;

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userId = uuidv4();
    const sessionToken = uuidv4();

    await redis.setex(`session:${sessionToken}`, SESSION_TTL, userId);

    return res.status(200).json({
      session_token: sessionToken,
      user_id: userId,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const token = req.token;

    await redis.del(`session:${token}`);

    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/session', async (req, res, next) => {
  try {
    const token = req.token;

    const ttl = await redis.ttl(`session:${token}`);

    if (ttl === -2) {
      return res.status(401).json({ error: 'Session not found or already expired' });
    }

    return res.status(200).json({
      user_id: req.userId,
      ttl_seconds: ttl,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
