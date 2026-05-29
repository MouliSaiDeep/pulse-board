const express = require('express');
const { redis } = require('../redis');

const router = express.Router();

router.post('/location', async (req, res, next) => {
  try {
    const userId = req.userId;
    const { longitude, latitude } = req.body;

    if (longitude === undefined || latitude === undefined) {
      return res.status(400).json({ error: 'longitude and latitude are required' });
    }

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);

    if (isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({ error: 'longitude and latitude must be valid numbers' });
    }

    await redis.geoadd('geo:active_users', lng, lat, `user:${userId}`);

    return res.status(200).json({ updated: true });
  } catch (error) {
    next(error);
  }
});

router.get('/nearby', async (req, res, next) => {
  try {
    const { longitude, latitude, radius, unit } = req.query;

    if (longitude === undefined || latitude === undefined) {
      return res.status(400).json({ error: 'longitude and latitude query parameters are required' });
    }

    const lng = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const rad = parseFloat(radius) || 10;
    const unt = unit || 'km';

    if (isNaN(lng) || isNaN(lat)) {
      return res.status(400).json({ error: 'longitude and latitude must be valid numbers' });
    }

    if (!['m', 'km', 'mi', 'ft'].includes(unt)) {
      return res.status(400).json({ error: "Invalid unit. Must be 'm', 'km', 'mi', or 'ft'" });
    }

    const results = await redis.call(
      'GEOSEARCH',
      'geo:active_users',
      'FROMPNT',
      lng,
      lat,
      'BYRADIUS',
      rad,
      unt,
      'ASC'
    );

    const userIds = results.map((member) => member.replace(/^user:/, ''));

    return res.status(200).json(userIds);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
