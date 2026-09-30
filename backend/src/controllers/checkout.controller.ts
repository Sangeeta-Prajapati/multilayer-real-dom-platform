import { Request, Response } from 'express';
import { checkoutService } from '../services/checkout.service';
import { broadcastToRoom } from '../sockets/room.socket';

export const handleCheckoutRequest = async (req: Request, res: Response) => {
  const roomId = (req.params.id || req.params.roomId || req.body.roomId || 'ROOM-9001') as string;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'userId is required' });
  }

  const result = await checkoutService.executeAtomicCheckout(roomId, userId);

  if (!result.success) {
    // 409 Conflict if blocked by concurrency or already checked out
    return res.status(409).json(result);
  }

  // Broadcast checkout_complete to both screens in the room
  broadcastToRoom(roomId, 'checkout_complete', {
    roomId,
    orderId: result.orderId,
    winnerUser: result.winnerUser,
    details: result.details,
    sharedCart: [],
    inventory: result.inventory,
  });

  return res.status(200).json(result);
};
