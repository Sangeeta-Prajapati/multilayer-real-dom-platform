import { Worker, Job } from 'bullmq';
import { createRedisClient, redisClient } from './config/redis';
import { processHaggleJob, HaggleJobPayload } from './processors/haggle.processor';

console.log('====================================================');
console.log('  Multiplayer Deal Room - Decoupled AI Worker       ');
console.log('  Offloaded queue processing & TTL Engine           ');
console.log('====================================================');

// 1. Initialize BullMQ Worker
const bullConnection = createRedisClient('bull-worker');

const haggleWorker = new Worker(
  'ai-haggle-queue',
  async (job: Job<HaggleJobPayload>) => {
    console.log(`[Worker] Received BullMQ job ${job.id}:`, job.name);
    await processHaggleJob(job.data);
  },
  {
    connection: bullConnection,
    concurrency: 5,
  }
);

haggleWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully.`);
});

haggleWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

// 2. Fallback polling loop for raw Redis list (raw-haggle-queue)
async function startRawQueuePoller() {
  const pollerClient = createRedisClient('poller');

  while (true) {
    try {
      if (pollerClient.status === 'ready' || pollerClient.status === 'connect') {
        const item = await pollerClient.brpop('raw-haggle-queue', 2);
        if (item && item[1]) {
          const data = JSON.parse(item[1]);
          console.log(`[Worker:Poller] Dequeued raw job from Redis:`, data.jobId);
          await processHaggleJob(data);
        }
      } else {
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (err: any) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

startRawQueuePoller();

console.log('[Worker] Background worker actively waiting for negotiation jobs...');
