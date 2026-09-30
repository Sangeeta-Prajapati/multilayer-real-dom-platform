export interface Product {
  product_id: string;
  name: string;
  description: string;
  base_price: number;
  stock_quantity: number;
}

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  added_by: string; // e.g., 'U-101' or 'U-102'
}

export interface DiscountOffer {
  offer_id: string;
  code: string;
  description: string;
  discount_percentage: number;
  required_product_ids: string[];
  expires_at: number; // Unix epoch ms
  duration_seconds: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  userId?: string;
  text: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface DealRoom {
  room_id: string;
  active_users: string[];
  shared_cart: CartItem[];
  active_offer: DiscountOffer | null;
  chat_messages: ChatMessage[];
  checked_out: boolean;
  order_id?: string;
}

export interface CheckoutResult {
  success: boolean;
  orderId?: string;
  winnerUser?: string;
  message: string;
  inventory?: Product[];
  details?: {
    inventoryDeducted: string[];
    paymentProcessedOnce: boolean;
    concurrencyProtected: boolean;
  };
}
