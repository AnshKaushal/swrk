import { RedisClientType } from "redis"

const DEFAULT_LIMIT = 100 // 100 swipes per day
const WINDOW_SECONDS = 24 * 60 * 60 // 24 hours

export async function checkRateLimit(
  userId: string,
  redisClient?: RedisClientType,
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  if (!redisClient) {
    return {
      allowed: true,
      remaining: DEFAULT_LIMIT,
      resetAt: new Date(Date.now() + WINDOW_SECONDS * 1000),
    }
  }

  const key = `swipe_limit:${userId}`
  const current = await redisClient.incr(key)

  if (current === 1) {
    await redisClient.expire(key, WINDOW_SECONDS)
  }

  const ttl = await redisClient.ttl(key)
  const resetAt = new Date(Date.now() + (ttl > 0 ? ttl : WINDOW_SECONDS) * 1000)

  return {
    allowed: current <= DEFAULT_LIMIT,
    remaining: Math.max(0, DEFAULT_LIMIT - current),
    resetAt,
  }
}
