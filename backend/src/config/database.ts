import { Product, DealRoom, DiscountOffer, CartItem, ChatMessage } from '../types';
import { loadSeedData } from './seed';

export class DatabaseStore {
  private inventory: Map<string, Product> = new Map();
  private rooms: Map<string, DealRoom> = new Map();
  private orders: Map<string, any> = new Map();

  constructor() {
    this.seed();
  }

  public seed() {
    const { inventory, rooms } = loadSeedData();
    this.inventory = inventory;
    this.rooms = rooms;
  }

  public getInventory(): Product[] {
    return Array.from(this.inventory.values());
  }

  public getProduct(productId: string): Product | undefined {
    return this.inventory.get(productId);
  }

  public getRoom(roomId: string): DealRoom | undefined {
    return this.rooms.get(roomId);
  }

  public getOrCreateRoom(roomId: string): DealRoom {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        room_id: roomId,
        active_users: ['U-101', 'U-102'],
        shared_cart: [],
        active_offer: null,
        chat_messages: [],
        checked_out: false,
      };
      this.rooms.set(roomId, room);
    }
    return room;
  }

  public updateCart(roomId: string, cart: CartItem[]): DealRoom {
    const room = this.getOrCreateRoom(roomId);
    room.shared_cart = cart;
    return room;
  }

  public setOffer(roomId: string, offer: DiscountOffer | null): DealRoom {
    const room = this.getOrCreateRoom(roomId);
    room.active_offer = offer;
    return room;
  }

  public addChatMessage(roomId: string, message: ChatMessage): DealRoom {
    const room = this.getOrCreateRoom(roomId);
    room.chat_messages.push(message);
    return room;
  }

  public markCheckedOut(roomId: string, orderId: string): DealRoom {
    const room = this.getOrCreateRoom(roomId);
    room.checked_out = true;
    room.order_id = orderId;
    return room;
  }

  public deductInventory(productId: string, quantity: number): boolean {
    const product = this.inventory.get(productId);
    if (!product || product.stock_quantity < quantity) {
      return false;
    }
    product.stock_quantity -= quantity;
    return true;
  }

  public saveOrder(order: any) {
    this.orders.set(order.order_id, order);
  }

  public getOrder(orderId: string) {
    return this.orders.get(orderId);
  }

  public resetRoom(roomId: string): DealRoom {
    this.seed();
    const room = this.getOrCreateRoom(roomId);
    room.shared_cart = [];
    room.active_offer = null;
    room.checked_out = false;
    room.order_id = undefined;
    return room;
  }
}

export const database = new DatabaseStore();
export const db = database;
