import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log(`[SocketIO] Connected to backend gateway (${socket?.id})`);
    });

    socket.on('disconnect', (reason) => {
      console.warn(`[SocketIO] Disconnected:`, reason);
    });

    socket.on('connect_error', (err) => {
      console.warn(`[SocketIO] Connection error:`, err.message);
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
  }
}

export function reconnectSocket() {
  if (socket) {
    socket.connect();
  } else {
    getSocket();
  }
}

export const socketApi = {
  joinRoom: (roomId: string, userId: string) => {
    getSocket().emit('join_room', { roomId, userId });
  },

  addToCart: (roomId: string, productId: string, userId: string) => {
    getSocket().emit('add_to_cart', { roomId, productId, userId });
  },

  updateQuantity: (roomId: string, productId: string, delta: number) => {
    getSocket().emit('update_quantity', { roomId, productId, delta });
  },

  removeFromCart: (roomId: string, productId: string) => {
    getSocket().emit('remove_from_cart', { roomId, productId });
  },

  sendChat: (roomId: string, userId: string, message: string) => {
    getSocket().emit('send_message', { roomId, userId, message });
  },

  checkout: (roomId: string, userId: string) => {
    getSocket().emit('checkout', { roomId, userId });
  },
};
