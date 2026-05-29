const { redis } = require('../redis');

async function startEventConsumer() {
  console.log('[EventConsumer] Event stream consumer started.');

  try {
    await redis.xgroup('CREATE', 'stream:events', 'workers', '$', 'MKSTREAM');
    console.log('[EventConsumer] Consumer group "workers" created.');
  } catch (error) {
    // If consumer group already exists, Redis throws a BUSYGROUP error which we handle silently.
    if (error.message && error.message.includes('BUSYGROUP')) {
      console.log('[EventConsumer] Consumer group "workers" already exists. Attaching...');
    } else {
      console.error('[EventConsumer] Failed to create or verify consumer group:', error.message);
    }
  }

  while (true) {
    try {
      const result = await redis.xreadgroup(
        'GROUP',
        'workers',
        'worker-1',
        'COUNT',
        '10',
        'BLOCK',
        '2000',
        'STREAMS',
        'stream:events',
        '>'
      );

      if (result && result.length > 0) {
        const streamData = result[0];
        const messages = streamData[1];

        for (const message of messages) {
          const messageId = message[0];
          const fields = message[1];

          const data = {};
          for (let i = 0; i < fields.length; i += 2) {
            data[fields[i]] = fields[i + 1];
          }

          console.log(`[EventConsumer] Processing: ${data.type} - ${data.payload}`);

          await redis.xack('stream:events', 'workers', messageId);
        }
      }
    } catch (error) {
      console.error('[EventConsumer] Error during event streaming read:', error.message);
      
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

startEventConsumer();
