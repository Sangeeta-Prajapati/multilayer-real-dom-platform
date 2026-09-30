import { database } from '../config/database';
import { CartItem } from '../types';

export class CartService {
  public getCart(roomId: string): CartItem[] {
    const room = database.getOrCreateRoom(roomId);
    return room.shared_cart;
  }

  public addToCart(roomId: string, productId: string, userId: string): CartItem[] {
    const room = database.getOrCreateRoom(roomId);
    const product = database.getProduct(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const existingIndex = room.shared_cart.findIndex((i) => i.product_id === productId);
    if (existingIndex >= 0) {
      room.shared_cart[existingIndex].quantity += 1;
      room.shared_cart[existingIndex].added_by = userId;
    } else {
      room.shared_cart.push({
        product_id: product.product_id,
        name: product.name,
        price: product.base_price,
        quantity: 1,
        added_by: userId,
      });
    }

    database.updateCart(roomId, room.shared_cart);
    return room.shared_cart;
  }

  public updateQuantity(roomId: string, productId: string, delta: number): CartItem[] {
    const room = database.getOrCreateRoom(roomId);
    const existingIndex = room.shared_cart.findIndex((i) => i.product_id === productId);

    if (existingIndex >= 0) {
      const newQty = room.shared_cart[existingIndex].quantity + delta;
      if (newQty <= 0) {
        room.shared_cart.splice(existingIndex, 1);
      } else {
        room.shared_cart[existingIndex].quantity = newQty;
      }
      database.updateCart(roomId, room.shared_cart);
    }

    return room.shared_cart;
  }

  public removeFromCart(roomId: string, productId: string): CartItem[] {
    const room = database.getOrCreateRoom(roomId);
    room.shared_cart = room.shared_cart.filter((i) => i.product_id !== productId);
    database.updateCart(roomId, room.shared_cart);
    return room.shared_cart;
  }

  public clearCart(roomId: string) {
    database.updateCart(roomId, []);
  }
}

export const cartService = new CartService();
