const { redis } = require('../redis');

async function startJobWorker() {
  console.log('[JobWorker] Background job processor started.');

  while (true) {
    try {
      const result = await redis.brpop('queue:jobs', 5);

      if (result) {
        const [_, rawJob] = result;
        const job = JSON.parse(rawJob);

        console.log(`[JobWorker] Processing job: type=${job.type} payload=${JSON.stringify(job.payload)}`);

        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('[JobWorker] Connection or parsing error occurred:', error.message);
      
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

startJobWorker();
