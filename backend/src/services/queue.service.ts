import { Queue } from 'bullmq';
import { redis } from '../config/redis';

export interface HaggleJobData {
  roomId: string;
  userId: string;
  message: string;
  timestamp: number;
}

export class QueueService {
  private haggleQueue: Queue | null = null;

  constructor() {
    this.initQueue();
  }

  private initQueue() {
    try {
      this.haggleQueue = new Queue('ai-haggle-queue', {
        connection: redis,
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: false,
        },
      });
      console.log('[QueueService] BullMQ ai-haggle-queue initialized.');
    } catch (err: any) {
      console.warn('[QueueService] Failed to initialize BullMQ queue:', err.message);
    }
  }

  /**
   * Challenge 2 requirement:
   * "The main API must NOT process this request. It must push the chat payload to a Redis queue."
   */
  public async pushHaggleJob(data: HaggleJobData): Promise<string> {
    const jobId = `haggle-${data.roomId}-${Date.now()}`;

    if (this.haggleQueue) {
      try {
        await this.haggleQueue.add('process-haggle', data, { jobId });
        console.log(`[QueueService] Offloaded chat message to Redis queue. Job ID: ${jobId}`);
        return jobId;
      } catch (err: any) {
        console.warn('[QueueService] BullMQ push failed, falling back to direct Redis list:', err.message);
      }
    }

    // Direct Redis LPUSH fallback
    try {
      await redis.lpush('raw-haggle-queue', JSON.stringify({ jobId, ...data }));
    } catch (e: any) {
      console.warn('[QueueService] Raw Redis push failed:', e.message);
    }

    return jobId;
  }
}

export const queueService = new QueueService();
