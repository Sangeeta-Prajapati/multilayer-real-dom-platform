import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';

import { getRoomState, resetRoomState } from './controllers/room.controller';
import { handleCheckoutRequest } from './controllers/checkout.controller';
import { getInventoryList } from './controllers/inventory.controller';
import { setupRoomSocket } from './sockets/room.socket';
import { setupRedisSubscriber } from './sockets/redisSubscriber';
import { haggleProcessorService } from './services/haggleProcessor.service';

dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS configuration for frontend
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

// REST Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'deal-room-backend', time: new Date().toISOString() });
});

app.get('/api/inventory', getInventoryList);

// Support both :id and :roomId
app.get('/api/rooms/:id/state', getRoomState);
app.get('/api/rooms/:roomId/state', getRoomState);

app.post('/api/rooms/:id/reset', resetRoomState);
app.post('/api/rooms/:roomId/reset', resetRoomState);

// Support atomic checkout endpoints
app.post('/api/rooms/:id/checkout', handleCheckoutRequest);
app.post('/api/rooms/:roomId/checkout', handleCheckoutRequest);
app.post('/api/checkout', handleCheckoutRequest);
app.post('/checkout', handleCheckoutRequest);

// WebSocket Setup
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 5000,
  pingInterval: 10000,
});

// Attach socket event handlers
setupRoomSocket(io);

// Attach Redis pub/sub subscriber bridge
setupRedisSubscriber(io);

const PORT = parseInt(process.env.PORT || '4000', 10);

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` MultiPlayer Deal Room - API & WebSocket Server `);
  console.log(` Running on: http://localhost:${PORT}`);
  console.log(`====================================================`);
});

export { app, server, io };
