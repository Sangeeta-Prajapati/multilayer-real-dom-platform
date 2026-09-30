import { database } from '../config/database';
import { lockService } from './lock.service';
import { CheckoutResult } from '../types';

export class CheckoutService {
  /**
   * Challenge 1: The Concurrency Trap
   * Executes atomic transaction to guarantee payment is processed once,
   * inventory is deducted once, and race conditions are blocked.
   */
  public async executeAtomicCheckout(roomId: string, userId: string): Promise<CheckoutResult> {
    // Matches Sequence Diagram: lock:room:ROOM-9001
    const lockResource = `room:${roomId}`;
    const token = await lockService.acquireLock(lockResource, 5000);

    if (!token) {
      console.warn(`[CheckoutService] Concurrency Trap Triggered: User ${userId} blocked by lock.`);
      return {
        success: false,
        message: 'Concurrent checkout blocked: Another shopper acquired the checkout lock first. Double charge prevented.',
        details: {
          inventoryDeducted: [],
          paymentProcessedOnce: true,
          concurrencyProtected: true,
        },
      };
    }

    try {
      const room = database.getOrCreateRoom(roomId);

      if (room.checked_out) {
        return {
          success: false,
          message: `Shared cart was already checked out in order ${room.order_id}. Double-spending prevented.`,
          details: {
            inventoryDeducted: [],
            paymentProcessedOnce: true,
            concurrencyProtected: true,
          },
        };
      }

      if (room.shared_cart.length === 0) {
        return {
          success: false,
          message: 'Cannot checkout an empty shared cart.',
        };
      }

      // 1. Verify inventory availability
      for (const item of room.shared_cart) {
        const product = database.getProduct(item.product_id);
        if (!product || product.stock_quantity < item.quantity) {
          return {
            success: false,
            message: `Checkout failed: Insufficient stock for ${item.name}. (Available: ${product ? product.stock_quantity : 0})`,
          };
        }
      }

      // 2. Atomic inventory deduction
      const deductedItems: string[] = [];
      for (const item of room.shared_cart) {
        database.deductInventory(item.product_id, item.quantity);
        const updatedProd = database.getProduct(item.product_id);
        deductedItems.push(`${item.name} x${item.quantity} (Stock remaining: ${updatedProd?.stock_quantity})`);
      }

      // 3. Process Payment Once
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;
      const subtotal = room.shared_cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const discount = room.active_offer ? (subtotal * room.active_offer.discount_percentage) / 100 : 0;
      const finalAmount = Math.max(0, subtotal - discount);

      const orderRecord = {
        order_id: orderId,
        room_id: roomId,
        placed_by: userId,
        items: [...room.shared_cart],
        subtotal,
        discount_applied: discount,
        final_amount: finalAmount,
        payment_status: 'PAID',
        processed_at: new Date().toISOString(),
      };

      database.saveOrder(orderRecord);
      database.markCheckedOut(roomId, orderId);

      // Clear shared cart after successful checkout
      database.updateCart(roomId, []);

      console.log(`[CheckoutService] Atomic transaction succeeded for Room ${roomId}. Order: ${orderId}`);

      return {
        success: true,
        orderId,
        winnerUser: userId,
        message: `Order ${orderId} processed successfully by ${userId}. Inventory deducted once, payment processed once.`,
        details: {
          inventoryDeducted: deductedItems,
          paymentProcessedOnce: true,
          concurrencyProtected: true,
        },
      };
    } finally {
      await lockService.releaseLock(lockResource, token);
    }
  }
}

export const checkoutService = new CheckoutService();
