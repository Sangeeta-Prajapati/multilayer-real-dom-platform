import type { Product, DealRoomState } from '../types/dealRoom';

export const INITIAL_INVENTORY: Product[] = [
  {
    product_id: 'PRD-01',
    name: 'Titanium Pro Laptop',
    description: 'High-performance workstation.',
    base_price: 1200.0,
    stock_quantity: 4,
  },
  {
    product_id: 'PRD-02',
    name: 'Wireless Ergonomic Mouse',
    description: 'Reduces wrist strain during long sessions.',
    base_price: 85.0,
    stock_quantity: 50,
  },
  {
    product_id: 'PRD-03',
    name: '4K Ultra-Wide Monitor',
    description: '34-inch curved display.',
    base_price: 450.0,
    stock_quantity: 1,
  },
];

export const INITIAL_ROOM_STATE: DealRoomState = {
  roomId: 'ROOM-9001',
  activeUsers: ['U-101', 'U-102'],
  currentUser: 'U-101',
  sharedCart: [
    {
      product_id: 'PRD-01',
      name: 'Titanium Pro Laptop',
      price: 1200.0,
      quantity: 1,
      added_by: 'U-101',
    },
  ],
  activeOffer: {
    offer_id: 'OFFER-301',
    code: 'BUNDLE20',
    description: 'Special 20% bundle discount on laptops & accessories!',
    discount_percentage: 20,
    required_product_ids: ['PRD-01'],
    expires_at: Date.now() + 180 * 1000, // 3 minutes server TTL
    duration_seconds: 180,
  },
  chatMessages: [
    {
      id: 'm-1',
      sender: 'system',
      text: 'Deal Room ROOM-9001 opened. U-101 and U-102 are now synchronized.',
      timestamp: Date.now() - 30000,
    },
    {
      id: 'm-2',
      sender: 'user',
      userId: 'U-101',
      text: 'If we buy two laptops, can we get a discount?',
      timestamp: Date.now() - 20000,
    },
    {
      id: 'm-3',
      sender: 'ai',
      text: 'AI Concierge: I talked with inventory control! I can offer 20% off your cart if you complete checkout within the next 3 minutes.',
      timestamp: Date.now() - 10000,
    },
  ],
  isNegotiating: false,
  isConnected: true,
};
