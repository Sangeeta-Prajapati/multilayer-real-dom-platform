import { Server as SocketIOServer } from 'socket.io';
import { createRedisClient } from '../config/redis';
import { database } from '../config/database';

export function setupRedisSubscriber(io: SocketIOServer) {
  const subscriber = createRedisClient('sub');

  // Direct channel subscriptions
  subscriber.subscribe(
    'dealroom:stream',
    'dealroom:offer',
    'dealroom:expired',
    (err, count) => {
      if (err) {
        console.warn('[RedisSub] Failed to subscribe to worker channels:', err.message);
      } else {
        console.log(`[RedisSub] Subscribed to ${count} direct worker channels.`);
      }
    }
  );

  // Pattern subscriptions for room-specific channels & Redis keyspace TTL expiration
  subscriber.psubscribe(
    'room:*:stream',
    'room:*:offer',
    'room:*:expired',
    '__keyevent@*__:expired',
    (err, count) => {
      if (err) {
        console.warn('[RedisSub] Failed to psubscribe to pattern channels:', err.message);
      } else {
        console.log(`[RedisSub] Psubscribed to ${count} pattern channels (including Redis Keyspace TTL).`);
      }
    }
  );

  // Handle direct channel messages
  subscriber.on('message', (channel, message) => {
    handleIncomingMessage(io, channel, message);
  });

  // Handle pattern channel messages (e.g., room:ROOM-9001:stream or __keyevent@0__:expired)
  subscriber.on('pmessage', (_pattern, channel, message) => {
    // Challenge 3: Redis Keyspace Notifications for autonomous backend expiry
    if (channel.includes(':expired')) {
      const expiredKey = message; // e.g., 'room:ROOM-9001:offer' or 'offer:ROOM-9001:...'
      console.log(`[RedisSub] Keyspace notification: Key '${expiredKey}' expired.`);

      let extractedRoomId: string | null = null;
      if (expiredKey.startsWith('room:')) {
        const parts = expiredKey.split(':');
        if (parts[1]) extractedRoomId = parts[1];
      } else if (expiredKey.startsWith('offer:')) {
        const parts = expiredKey.split(':');
        if (parts[1]) extractedRoomId = parts[1];
      }

      if (extractedRoomId) {
        handleOfferExpired(io, extractedRoomId);
      }
      return;
    }

    handleIncomingMessage(io, channel, message);
  });

  return subscriber;
}

function handleIncomingMessage(io: SocketIOServer, channel: string, message: string) {
  try {
    const payload = JSON.parse(message);
    const roomId = payload.roomId || (channel.startsWith('room:') ? channel.split(':')[1] : null);

    if (!roomId) return;

    if (channel === 'dealroom:stream' || channel.endsWith(':stream')) {
      // Challenge 2: Background worker streaming response chunks back to both users
      io.to(roomId).emit('ai_stream_chunk', {
        roomId,
        messageId: payload.messageId,
        chunk: payload.chunk,
        fullText: payload.fullText,
        isFinal: payload.isFinal,
      });

      if (payload.isFinal) {
        database.addChatMessage(roomId, {
          id: payload.messageId,
          sender: 'ai',
          text: payload.fullText,
          timestamp: Date.now(),
        });
      }
    } else if (channel === 'dealroom:offer' || channel.endsWith(':offer')) {
      // Challenge 3: Worker generated temporary offer
      const { offer } = payload;
      database.setOffer(roomId, offer);
      io.to(roomId).emit('offer_generated', { roomId, offer });
      console.log(`[RedisSub] Broadcasted offer_generated to room ${roomId}`);
    } else if (channel === 'dealroom:expired' || channel.endsWith(':expired')) {
      handleOfferExpired(io, roomId);
    }
  } catch (err: any) {
    console.error('[RedisSub] Error handling pub/sub message:', err.message);
  }
}

function handleOfferExpired(io: SocketIOServer, roomId: string) {
  const room = database.getRoom(roomId);
  if (!room || !room.active_offer) {
    // Already cleared or no offer active
    return;
  }

  // Challenge 3: Autonomous backend removal of discount from shared cart
  database.setOffer(roomId, null);

  const sysMsg = {
    id: `sys-expired-${Date.now()}`,
    sender: 'system' as const,
    text: 'Offer_Expired: 3-minute TTL elapsed. The backend server forcefully removed the discount from your cart.',
    timestamp: Date.now(),
  };
  database.addChatMessage(roomId, sysMsg);

  io.to(roomId).emit('offer_expired', {
    roomId,
    message: sysMsg.text,
  });

  io.to(roomId).emit('chat_message', sysMsg);

  console.log(`[RedisSub] Autonomously cleared offer and broadcasted offer_expired to room ${roomId}`);
}
