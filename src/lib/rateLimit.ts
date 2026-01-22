/**
 * Simple in-memory rate limiter for API endpoints
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;    // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 60 }
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return { allowed: true, remaining: config.maxRequests - 1, resetTime: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetTime: entry.resetTime };
}

// Clean up old entries every minute to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 60000);
}
