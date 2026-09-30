import { Worker, Job } from 'bullmq';
import { createRedisClient, redis, redisPublisher } from '../config/redis';
import { evaluateNegotiation } from './aiMock.service';
import { database } from '../config/database';
import { broadcastToRoom } from '../sockets/room.socket';

export interface HaggleJobPayload {
  roomId: string;
  userId: string;
  message: string;
  timestamp: number;
}

export class HaggleProcessorService {
  private bullWorker: Worker | null = null;
  private activeOfferTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initBullWorker();
  }

  private initBullWorker() {
    try {
      const bullConnection = createRedisClient('bull-consumer');
      this.bullWorker = new Worker(
        'ai-haggle-queue',
        async (job: Job<HaggleJobPayload>) => {
          console.log(`[HaggleProcessor] Consumed BullMQ job ${job.id} for Room ${job.data.roomId}`);
          await this.executeNegotiation(job.data);
        },
        {
          connection: bullConnection,
          concurrency: 5,
        }
      );

      this.bullWorker.on('completed', (job) => {
        console.log(`[HaggleProcessor] Job ${job.id} completed.`);
      });

      this.bullWorker.on('failed', (job, err) => {
        console.warn(`[HaggleProcessor] Job ${job?.id} failed:`, err.message);
      });

      console.log('[HaggleProcessor] BullMQ worker consumer initialized on ai-haggle-queue.');
    } catch (err: any) {
      console.warn('[HaggleProcessor] BullMQ worker init warning:', err.message);
    }
  }

  /**
   * Challenge 2: Execute 10s negotiation delay, stream tokens, and trigger 3-min TTL offer
   */
  public async executeNegotiation(data: HaggleJobPayload) {
    const { roomId, userId, message } = data;
    console.log(`[HaggleProcessor] Starting mandatory 10-second AI negotiation delay for Room ${roomId}...`);

    // Challenge 2: Mandatory 10-second negotiation delay
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Evaluate keywords (laptop, etc.)
    const result = evaluateNegotiation(message);
    const words = result.responseText.split(' ');
    const messageId = `ai-${Date.now()}`;

    console.log(`[HaggleProcessor] Negotiation delay completed. Streaming response tokens to Room ${roomId}...`);

    let accumulated = '';
    for (let i = 0; i < words.length; i++) {
      accumulated += (i === 0 ? '' : ' ') + words[i];
      const isFinal = i === words.length - 1;

      const streamChunk = {
        roomId,
        messageId,
        chunk: words[i],
        fullText: accumulated,
        isFinal,
      };

      const payloadStr = JSON.stringify(streamChunk);

      // 1. Direct WebSocket emit ensures clients receive stream instantly without delay
      broadcastToRoom(roomId, 'ai_stream_chunk', streamChunk);

      // 2. Publish to Redis pub/sub asynchronously if connected
      if (redisPublisher.status === 'ready') {
        redisPublisher.publish('dealroom:stream', payloadStr).catch(() => {});
        redisPublisher.publish(`room:${roomId}:stream`, payloadStr).catch(() => {});
      }

      if (isFinal) {
        database.addChatMessage(roomId, {
          id: messageId,
          sender: 'ai',
          text: accumulated,
          timestamp: Date.now(),
        });
      }

      // Micro-delay between tokens
      await new Promise((r) => setTimeout(r, 70));
    }

    // Challenge 3: Exploding Offer (Distributed 3-Minute TTL)
    if (result.generateOffer && result.offerDetails) {
      const offerId = `OFFER-${Date.now().toString().slice(-4)}`;
      const durationSeconds = result.offerDetails.durationSeconds || 180;
      const expiresAt = Date.now() + durationSeconds * 1000;

      const offer = {
        offer_id: offerId,
        code: result.offerDetails.code,
        description: result.offerDetails.description,
        discount_percentage: result.offerDetails.discountPercentage,
        required_product_ids: result.offerDetails.requiredProductIds,
        expires_at: expiresAt,
        duration_seconds: durationSeconds,
      };

      database.setOffer(roomId, offer);

      // Broadcast offer to room via WebSocket immediately
      const offerPayload = { roomId, offer };
      broadcastToRoom(roomId, 'offer_generated', offerPayload);
      console.log(`[HaggleProcessor] Exploding Offer ${offer.code} created for Room ${roomId} with 3-minute TTL.`);

      // Set Redis TTL key (Challenge 3: Redis SETEX room:ROOM-9001:offer 180) asynchronously
      if (redis.status === 'ready') {
        redis.setex(`room:${roomId}:offer`, durationSeconds, 'ACTIVE').catch(() => {});
        redis.setex(`offer:${roomId}:${offerId}`, durationSeconds, 'ACTIVE').catch(() => {});
      }
      if (redisPublisher.status === 'ready') {
        redisPublisher.publish('dealroom:offer', JSON.stringify(offerPayload)).catch(() => {});
        redisPublisher.publish(`room:${roomId}:offer`, JSON.stringify(offerPayload)).catch(() => {});
      }

      // Autonomous server-side 180s timer
      if (this.activeOfferTimers.has(roomId)) {
        clearTimeout(this.activeOfferTimers.get(roomId)!);
      }

      const timer = setTimeout(async () => {
        console.log(`[HaggleProcessor] 3-Minute TTL ELAPSED for Room ${roomId}. Forcefully clearing discount.`);

        database.setOffer(roomId, null);

        const sysMsg = {
          id: `sys-expired-${Date.now()}`,
          sender: 'system' as const,
          text: 'Offer_Expired: 3-minute TTL elapsed. The backend server forcefully removed the discount from your cart.',
          timestamp: Date.now(),
        };
        database.addChatMessage(roomId, sysMsg);

        broadcastToRoom(roomId, 'offer_expired', {
          roomId,
          message: sysMsg.text,
        });
        broadcastToRoom(roomId, 'chat_message', sysMsg);

        this.activeOfferTimers.delete(roomId);
      }, durationSeconds * 1000);

      this.activeOfferTimers.set(roomId, timer);
    }
  }
}

export const haggleProcessorService = new HaggleProcessorService();
