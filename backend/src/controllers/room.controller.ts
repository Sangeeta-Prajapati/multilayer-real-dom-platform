import { Request, Response } from 'express';
import { database } from '../config/database';

export const getRoomState = (req: Request, res: Response) => {
  const roomId = (req.params.id || req.params.roomId) as string;
  const room = database.getOrCreateRoom(roomId);

  return res.json({
    success: true,
    roomId: room.room_id,
    activeUsers: room.active_users,
    sharedCart: room.shared_cart,
    activeOffer: room.active_offer,
    chatMessages: room.chat_messages,
    inventory: database.getInventory(),
    checkedOut: room.checked_out,
    orderId: room.order_id,
  });
};

export const resetRoomState = (req: Request, res: Response) => {
  const roomId = (req.params.id || req.params.roomId) as string;
  const room = database.resetRoom(roomId);

  return res.json({
    success: true,
    message: `Room ${roomId} has been reset to seed state.`,
    room,
    inventory: database.getInventory(),
  });
};
