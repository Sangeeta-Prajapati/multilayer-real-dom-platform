export interface Product {
  product_id: string;
  name: string;
  description: string;
  base_price: number;
  stock_quantity: number;
  image_url?: string;
}

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  added_by: string; // e.g. "U-101" or "U-102"
}

export interface DiscountOffer {
  offer_id: string;
  code: string;
  description: string;
  discount_percentage: number;
  required_product_ids: string[];
  expires_at: number; // Server epoch ms
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

export interface DealRoomState {
  roomId: string;
  activeUsers: string[];
  currentUser: string;
  sharedCart: CartItem[];
  activeOffer: DiscountOffer | null;
  chatMessages: ChatMessage[];
  isNegotiating: boolean;
  isConnected: boolean;
}
