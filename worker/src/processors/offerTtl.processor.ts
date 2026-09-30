import { redisPublisher, redisClient } from '../config/redis';

export class OfferTtlManager {
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Challenge 3: Distributed TTL enforcement
   * Schedules autonomous server-side expiration strictly after durationSeconds (3 minutes)
   */
  public async scheduleOfferExpiry(roomId: string, offerId: string, durationSeconds = 180) {
    // Sequence diagram key: room:ROOM-9001:offer
    const roomOfferKey = `room:${roomId}:offer`;
    const specificOfferKey = `offer:${roomId}:${offerId}`;

    try {
      // 1. Set Redis TTL keys (cannot be tampered with by client system clocks)
      await redisClient.setex(roomOfferKey, durationSeconds, 'ACTIVE');
      await redisClient.setex(specificOfferKey, durationSeconds, 'ACTIVE');
      console.log(`[OfferTTL] Set Redis TTL keys '${roomOfferKey}' and '${specificOfferKey}' for ${durationSeconds}s`);
    } catch (e: any) {
      console.warn('[OfferTTL] Redis TTL set warning:', e.message);
    }

    // Clear any previous timer for this room
    if (this.activeTimers.has(roomId)) {
      clearTimeout(this.activeTimers.get(roomId)!);
    }

    // 2. Schedule autonomous server-side expiry trigger
    const timer = setTimeout(async () => {
      console.log(`[OfferTTL] 3-Minute TTL ELAPSED for Room ${roomId}. Triggering autonomous expiry.`);

      const payload = {
        roomId,
        offerId,
        expiredAt: Date.now(),
        message: 'Offer_Expired: 3-minute TTL elapsed. The backend server forcefully removed the discount from your cart.',
      };

      const payloadStr = JSON.stringify(payload);
      try {
        await redisPublisher.publish('dealroom:expired', payloadStr);
        await redisPublisher.publish(`room:${roomId}:expired`, payloadStr);
      } catch (err: any) {
        console.error('[OfferTTL] Failed to publish expired event:', err.message);
      }

      this.activeTimers.delete(roomId);
    }, durationSeconds * 1000);

    this.activeTimers.set(roomId, timer);
  }

  public cancelOfferExpiry(roomId: string) {
    if (this.activeTimers.has(roomId)) {
      clearTimeout(this.activeTimers.get(roomId)!);
      this.activeTimers.delete(roomId);
    }
  }
}

export const offerTtlManager = new OfferTtlManager();
