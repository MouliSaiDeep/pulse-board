const express = require('express');
const { redis } = require('../redis');

const router = express.Router();

router.post('/profile', async (req, res, next) => {
  try {
    const userId = req.userId;
    const { name, email, role, avatar } = req.body;

    if (!name || !email || !role || !avatar) {
      return res.status(400).json({ error: 'name, email, role, and avatar are required' });
    }

    await redis.hset(`user:${userId}`, {
      name,
      email,
      role,
      avatar,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/profile', async (req, res, next) => {
  try {
    const userId = req.userId;

    const profile = await redis.hgetall(`user:${userId}`);

    if (!profile || Object.keys(profile).length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
});

router.get('/profile/fields', async (req, res, next) => {
  try {
    const userId = req.userId;
    const fields = req.query.fields;

    if (!fields) {
      return res.status(400).json({ error: 'fields query parameter is required (comma-separated)' });
    }

    const fieldList = fields.split(',').map(f => f.trim()).filter(Boolean);

    if (fieldList.length === 0) {
      return res.status(400).json({ error: 'At least one field name must be provided' });
    }

    const values = await redis.hmget(`user:${userId}`, ...fieldList);

    const result = {};
    fieldList.forEach((field, index) => {
      result[field] = values[index];
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/profile/:field', async (req, res, next) => {
  try {
    const userId = req.userId;
    const { field } = req.params;

    const value = await redis.hget(`user:${userId}`, field);

    if (value === null) {
      return res.status(404).json({ error: `Field '${field}' not found or profile does not exist` });
    }

    return res.status(200).json({ field, value });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/exists', async (req, res, next) => {
  try {
    const { id } = req.params;

    const exists = await redis.exists(`user:${id}`);

    return res.status(200).json({ exists: exists === 1 });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/reputation', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { delta } = req.body;

    if (delta === undefined || isNaN(Number(delta))) {
      return res.status(400).json({ error: 'Valid numerical delta is required' });
    }

    const newScore = await redis.zincrby('reputation:users', Number(delta), `user:${id}`);

    return res.status(200).json({ score: parseFloat(newScore) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
