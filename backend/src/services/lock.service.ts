import { redis } from '../config/redis';

export class DistributedLockService {
  private inMemoryLocks: Map<string, { token: string; expiresAt: number }> = new Map();

  /**
   * Attempts to acquire an atomic distributed lock
   * @param resource The resource identifier (e.g. `room:ROOM-9001:checkout`)
   * @param ttlMs Time-to-live in milliseconds
   * @returns lock token if acquired, null if already locked
   */
  public async acquireLock(resource: string, ttlMs = 5000): Promise<string | null> {
    const lockKey = `lock:${resource}`;
    const token = `token-${Date.now()}-${Math.random()}`;

    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        const result = await redis.set(lockKey, token, 'PX', ttlMs, 'NX');
        if (result === 'OK') {
          return token;
        }
        return null;
      }
    } catch (err: any) {
      console.warn('[LockService] Redis lock fallback to memory mutex:', err.message);
    }

    // In-memory atomic fallback
    const now = Date.now();
    const existing = this.inMemoryLocks.get(lockKey);
    if (existing && existing.expiresAt > now) {
      return null; // Already locked by another concurrent process
    }

    this.inMemoryLocks.set(lockKey, { token, expiresAt: now + ttlMs });
    return token;
  }

  /**
   * Releases the lock safely using token verification (avoids releasing another process's lock)
   */
  public async releaseLock(resource: string, token: string): Promise<boolean> {
    const lockKey = `lock:${resource}`;

    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        // Lua script ensures atomicity of get-and-del
        const luaScript = `
          if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
          else
            return 0
          end
        `;
        const res = await redis.eval(luaScript, 1, lockKey, token);
        return res === 1;
      }
    } catch (err: any) {
      console.warn('[LockService] Redis release fallback:', err.message);
    }

    // In-memory fallback
    const existing = this.inMemoryLocks.get(lockKey);
    if (existing && existing.token === token) {
      this.inMemoryLocks.delete(lockKey);
      return true;
    }
    return false;
  }
}

export const lockService = new DistributedLockService();
