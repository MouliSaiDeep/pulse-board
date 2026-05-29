const express = require('express');
const { redis } = require('../redis');

const router = express.Router();

function getCurrentCalendarDetails() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = now.getDate();
  return {
    monthStr: `${year}-${month}`,
    day,
  };
}

router.post('/checkin', async (req, res, next) => {
  try {
    const userId = req.userId;
    const { monthStr, day } = getCurrentCalendarDetails();
    const key = `attendance:${userId}:${monthStr}`;

    await redis.setbit(key, day, 1);

    return res.status(200).json({ checked_in: true });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId;
    const { monthStr } = getCurrentCalendarDetails();
    const month = req.query.month || monthStr;
    const key = `attendance:${userId}:${month}`;

    const activeDays = await redis.bitcount(key);

    return res.status(200).json({
      month,
      active_days: activeDays,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/day', async (req, res, next) => {
  try {
    const userId = req.userId;
    const { monthStr } = getCurrentCalendarDetails();
    const month = req.query.month || monthStr;
    const dayParam = req.query.day;

    if (!dayParam || isNaN(Number(dayParam))) {
      return res.status(400).json({ error: 'Valid day parameter is required' });
    }

    const day = parseInt(dayParam, 10);
    if (day < 1 || day > 31) {
      return res.status(400).json({ error: 'Day must be between 1 and 31' });
    }

    const key = `attendance:${userId}:${month}`;

    const activeBit = await redis.getbit(key, day);

    return res.status(200).json({
      month,
      day,
      active: activeBit === 1,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
