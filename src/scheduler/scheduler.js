const { redis } = require('../redis');

async function enqueueDailyDigest() {
  try {
    const jobPayload = JSON.stringify({
      type: 'daily_digest',
      payload: { scheduled: true },
      enqueuedAt: Date.now(),
    });

    await redis.lpush('queue:jobs', jobPayload);
    
    console.log('[Scheduler] Enqueued daily_digest job');
  } catch (error) {
    console.error('[Scheduler] Error enqueuing scheduled job:', error.message);
  }
}

console.log('[Scheduler] Scheduler service started.');

enqueueDailyDigest();
setInterval(enqueueDailyDigest, 60000);
