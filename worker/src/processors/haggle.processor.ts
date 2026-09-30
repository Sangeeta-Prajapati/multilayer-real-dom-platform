import { redisPublisher } from '../config/redis';
import { evaluateNegotiation } from '../services/aiMock.service';
import { offerTtlManager } from './offerTtl.processor';

export interface HaggleJobPayload {
  roomId: string;
  userId: string;
  message: string;
  timestamp: number;
}

export async function processHaggleJob(data: HaggleJobPayload) {
  const { roomId, userId, message } = data;
  console.log(`[HaggleWorker] Consumed negotiation job for Room: ${roomId} from User: ${userId}`);

  // Challenge 2: "simulates a 10-second 'AI Negotiation' delay"
  console.log(`[HaggleWorker] Simulating mandatory 10-second AI negotiation delay...`);
  await new Promise((resolve) => setTimeout(resolve, 10000));

  // Evaluate message keywords (laptop, etc.)
  const result = evaluateNegotiation(message);
  const words = result.responseText.split(' ');
  const messageId = `ai-${Date.now()}`;

  console.log(`[HaggleWorker] Negotiation complete. Streaming response chunks to room ${roomId}...`);

  // Challenge 2: "streams the response back to both users in the room simultaneously"
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
    try {
      // Broadcast to both generic channel and room-specific channel (matches sequence diagram)
      await redisPublisher.publish('dealroom:stream', payloadStr);
      await redisPublisher.publish(`room:${roomId}:stream`, payloadStr);
    } catch (e: any) {
      console.warn('[HaggleWorker] Failed to publish stream chunk:', e.message);
    }

    // Micro-delay between tokens to simulate authentic streaming
    await new Promise((r) => setTimeout(r, 70));
  }

  // Challenge 3: "The Exploding Offer (Distributed TTL)"
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

    console.log(`[HaggleWorker] Exploding Offer created: ${offer.code} (-${offer.discount_percentage}%) with 3-minute TTL.`);

    // 1. Publish offer to Deal Room channels
    const offerPayload = JSON.stringify({ roomId, offer });
    await redisPublisher.publish('dealroom:offer', offerPayload);
    await redisPublisher.publish(`room:${roomId}:offer`, offerPayload);

    // 2. Schedule server-side 3-minute distributed TTL expiry (Redis SETEX + autonomous timer)
    await offerTtlManager.scheduleOfferExpiry(roomId, offerId, durationSeconds);
  }
}
