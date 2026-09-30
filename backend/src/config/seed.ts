import fs from 'fs';
import path from 'path';
import { Product, DealRoom } from '../types';

export interface SeedData {
  inventory: Map<string, Product>;
  rooms: Map<string, DealRoom>;
}

export function loadSeedData(): SeedData {
  const inventory = new Map<string, Product>();
  const rooms = new Map<string, DealRoom>();

  try {
    const candidates = [
      path.resolve(__dirname, '../../mock_tenant_data'),
      path.resolve(__dirname, '../../../mock_tenant_data'),
      path.resolve(process.cwd(), 'mock_tenant_data'),
      path.resolve(process.cwd(), '../mock_tenant_data'),
      path.resolve(process.cwd(), 'backend/mock_tenant_data'),
    ];

    let rawData: string | null = null;
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        rawData = fs.readFileSync(p, 'utf-8');
        console.log(`[Seed] Loaded tenant data from: ${p}`);
        break;
      }
    }

    if (rawData) {
      const parsed = JSON.parse(rawData);

      if (Array.isArray(parsed.inventory)) {
        for (const item of parsed.inventory) {
          inventory.set(item.product_id, {
            product_id: item.product_id,
            name: item.name,
            description: item.description,
            base_price: Number(item.base_price),
            stock_quantity: Number(item.stock_quantity),
          });
        }
      }

      if (Array.isArray(parsed.deal_rooms)) {
        for (const room of parsed.deal_rooms) {
          rooms.set(room.room_id, {
            room_id: room.room_id,
            active_users: room.active_users || ['U-101', 'U-102'],
            shared_cart: room.shared_cart || [],
            active_offer: null,
            chat_messages: [
              {
                id: 'init-1',
                sender: 'system',
                text: `Room ${room.room_id} synchronized. Users U-101 and U-102 are connected.`,
                timestamp: Date.now(),
              },
            ],
            checked_out: false,
          });
        }
      }
    }
  } catch (err: any) {
    console.warn('[Seed] Warning loading mock_tenant_data:', err.message);
  }

  // Safety fallback if mock_tenant_data wasn't loaded
  if (inventory.size === 0) {
    inventory.set('PRD-01', {
      product_id: 'PRD-01',
      name: 'Titanium Pro Laptop',
      description: 'High-performance workstation.',
      base_price: 1200.0,
      stock_quantity: 4,
    });
    inventory.set('PRD-02', {
      product_id: 'PRD-02',
      name: 'Wireless Ergonomic Mouse',
      description: 'Reduces wrist strain during long sessions.',
      base_price: 85.0,
      stock_quantity: 50,
    });
    inventory.set('PRD-03', {
      product_id: 'PRD-03',
      name: '4K Ultra-Wide Monitor',
      description: '34-inch curved display.',
      base_price: 450.0,
      stock_quantity: 1,
    });
  }

  if (!rooms.has('ROOM-9001')) {
    rooms.set('ROOM-9001', {
      room_id: 'ROOM-9001',
      active_users: ['U-101', 'U-102'],
      shared_cart: [],
      active_offer: null,
      chat_messages: [
        {
          id: 'init-1',
          sender: 'system',
          text: 'Room ROOM-9001 synchronized. Users U-101 and U-102 are connected.',
          timestamp: Date.now(),
        },
      ],
      checked_out: false,
    });
  }

  return { inventory, rooms };
}
