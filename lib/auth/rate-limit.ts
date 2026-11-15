/**
 * In-Memory Sliding-Window Rate Limiter
 * Provides DDoS, brute-force, and credential stuffing protection for sensitive endpoints.
 * Cleaned up automatically on expired windows.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 300000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 300000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = rateLimitStore.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(identifier, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= limit) {
    const oldestTimestamp = record.timestamps[0] || now;
    const resetSeconds = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
    return {
      success: false,
      limit,
      remaining: 0,
      resetSeconds: Math.max(1, resetSeconds),
    };
  }

  record.timestamps.push(now);
  return {
    success: true,
    limit,
    remaining: limit - record.timestamps.length,
    resetSeconds: Math.ceil(windowMs / 1000),
  };
}

export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Extracts and sanitizes the client IP address from proxy headers.
 * Prioritizes trusted reverse proxy headers (X-Real-IP, CF-Connecting-IP)
 * before parsing multi-hop X-Forwarded-For chains.
 */
export function getClientIp(headers: Headers): string {
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp && xRealIp.trim().length > 0) {
    return xRealIp.trim();
  }

  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim().length > 0) {
    return cfIp.trim();
  }

  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",");
    const clientIp = parts[0]?.trim();
    if (clientIp) {
      return clientIp;
    }
  }

  return "127.0.0.1";
}
