import { Server as SocketIOServer, Socket } from 'socket.io';
import { cartService } from '../services/cart.service';
import { checkoutService } from '../services/checkout.service';
import { queueService } from '../services/queue.service';
import { database } from '../config/database';

let ioInstance: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export function broadcastToRoom(roomId: string, event: string, data: any) {
  if (ioInstance) {
    ioInstance.to(roomId).emit(event, data);
  }
}

export function setupRoomSocket(io: SocketIOServer) {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    let currentRoomId: string | null = null;
    let currentUserId: string | null = null;

    console.log(`[Socket] Client connected: ${socket.id}`);

    // 1. Join Deal Room
    socket.on('join_room', ({ roomId, userId }: { roomId: string; userId: string }) => {
      currentRoomId = roomId;
      currentUserId = userId;

      socket.join(roomId);

      const room = database.getOrCreateRoom(roomId);
      if (!room.active_users.includes(userId)) {
        room.active_users.push(userId);
      }

      console.log(`[Socket] User ${userId} joined room ${roomId}`);

      // Send initial room state to newly joined / reconnected user (Durability criteria)
      socket.emit('room_state_hydrated', {
        roomId: room.room_id,
        activeUsers: room.active_users,
        sharedCart: room.shared_cart,
        activeOffer: room.active_offer,
        chatMessages: room.chat_messages,
        inventory: database.getInventory(),
        checkedOut: room.checked_out,
      });

      // Broadcast user presence to others in the room
      socket.to(roomId).emit('user_joined', { userId, activeUsers: room.active_users });
    });

    // 2. Add to Shared Cart (Challenge 1)
    socket.on('add_to_cart', ({ roomId, productId, userId }: { roomId: string; productId: string; userId: string }) => {
      try {
        const targetRoom = roomId || currentRoomId || 'ROOM-9001';
        const actor = userId || currentUserId || 'U-101';
        const updatedCart = cartService.addToCart(targetRoom, productId, actor);

        io.to(targetRoom).emit('cart_updated', {
          roomId: targetRoom,
          sharedCart: updatedCart,
          action: 'add',
          actor,
          productId,
        });
      } catch (err: any) {
        socket.emit('error_message', { message: err.message });
      }
    });

    // 3. Update Item Quantity
    socket.on('update_quantity', ({ roomId, productId, delta }: { roomId: string; productId: string; delta: number }) => {
      try {
        const targetRoom = roomId || currentRoomId || 'ROOM-9001';
        const updatedCart = cartService.updateQuantity(targetRoom, productId, delta);

        io.to(targetRoom).emit('cart_updated', {
          roomId: targetRoom,
          sharedCart: updatedCart,
          action: 'update_qty',
          productId,
        });
      } catch (err: any) {
        socket.emit('error_message', { message: err.message });
      }
    });

    // 4. Remove Item from Shared Cart
    socket.on('remove_from_cart', ({ roomId, productId }: { roomId: string; productId: string }) => {
      try {
        const targetRoom = roomId || currentRoomId || 'ROOM-9001';
        const updatedCart = cartService.removeFromCart(targetRoom, productId);

        io.to(targetRoom).emit('cart_updated', {
          roomId: targetRoom,
          sharedCart: updatedCart,
          action: 'remove',
          productId,
        });
      } catch (err: any) {
        socket.emit('error_message', { message: err.message });
      }
    });

    // 5. Send Chat to AI Concierge (Challenge 2: The Haggle Engine)
    // Support aliases: 'send_message', 'chat', 'send_haggle_message'
    const handleChat = async (payload: { roomId?: string; userId?: string; message?: string; text?: string }) => {
      const targetRoom = payload.roomId || currentRoomId || 'ROOM-9001';
      const actor = payload.userId || currentUserId || 'U-101';
      const messageText = payload.message || payload.text || '';

      if (!messageText.trim()) return;

      const chatMsg = {
        id: `msg-${Date.now()}`,
        sender: 'user' as const,
        userId: actor,
        text: messageText,
        timestamp: Date.now(),
      };

      // Add to room history and broadcast to both screens immediately
      database.addChatMessage(targetRoom, chatMsg);
      io.to(targetRoom).emit('chat_message', chatMsg);

      // Signal negotiation started (both users see the 10s negotiation indicator)
      io.to(targetRoom).emit('negotiation_started', {
        roomId: targetRoom,
        userId: actor,
        message: messageText,
      });

      // Challenge 2: Main API does NOT process the request; it pushes to Redis queue
      await queueService.pushHaggleJob({
        roomId: targetRoom,
        userId: actor,
        message: messageText,
        timestamp: Date.now(),
      });
    };

    socket.on('send_message', handleChat);
    socket.on('chat', handleChat);
    socket.on('send_haggle_message', handleChat);

    // 6. Checkout Shared Cart (Challenge 1: The Concurrency Trap)
    socket.on('checkout', async (payload: { roomId?: string; userId?: string }) => {
      const targetRoom = payload.roomId || currentRoomId || 'ROOM-9001';
      const actor = payload.userId || currentUserId || 'U-101';

      const result = await checkoutService.executeAtomicCheckout(targetRoom, actor);

      if (result.success) {
        // Broadcast Checkout_Complete to both screens simultaneously
        io.to(targetRoom).emit('checkout_complete', {
          roomId: targetRoom,
          orderId: result.orderId,
          winnerUser: result.winnerUser,
          details: result.details,
          sharedCart: [],
          inventory: result.inventory || database.getInventory(),
        });
      }

      // Send result specifically to the clicking user
      socket.emit('checkout_result', result);
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      if (currentRoomId && currentUserId) {
        socket.to(currentRoomId).emit('user_disconnected', { userId: currentUserId });
      }
    });
  });
}
