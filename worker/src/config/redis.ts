import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || undefined;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

export function createRedisClient(role = 'worker'): Redis {
  const commonOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times: number) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
  };

  const client = REDIS_URL
    ? new Redis(REDIS_URL, commonOptions)
    : new Redis({
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD,
        ...commonOptions,
      });

  client.on('connect', () => {
    console.log(`[Worker:Redis:${role}] Connected to Redis (${REDIS_URL ? 'via REDIS_URL' : `${REDIS_HOST}:${REDIS_PORT}`})`);
  });

  client.on('error', (err) => {
    console.warn(`[Worker:Redis:${role}] Warning:`, err.message);
  });

  return client;
}

export const redisPublisher = createRedisClient('publisher');
export const redisClient = createRedisClient('main');
