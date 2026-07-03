type RateLimitConfig = {
  readonly key: string;
  readonly limit: number;
  readonly windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitAllowed = {
  readonly allowed: true;
  readonly remaining: number;
  readonly resetAt: number;
};

type RateLimitBlocked = {
  readonly allowed: false;
  readonly retryAfterSeconds: number;
  readonly resetAt: number;
};

export type RateLimitResult = RateLimitAllowed | RateLimitBlocked;

const buckets = new Map<string, RateLimitBucket>();

function firstForwardedAddress(value: string | null): string | null {
  return value?.split(",")[0]?.trim() || null;
}

export function readClientIdentity(headers: Headers): string {
  return firstForwardedAddress(headers.get("x-forwarded-for"))
    ?? headers.get("x-real-ip")?.trim()
    ?? headers.get("cf-connecting-ip")?.trim()
    ?? "unknown-client";
}

export function checkRateLimit(
  identity: string,
  config: RateLimitConfig,
  now = Date.now(),
): RateLimitResult {
  const bucketKey = `${config.key}:${identity}`;
  const current = buckets.get(bucketKey);

  if (!current || current.resetAt <= now) {
    const resetAt = now + config.windowMs;
    buckets.set(bucketKey, { count: 1, resetAt });
    return { allowed: true, remaining: config.limit - 1, resetAt };
  }

  if (current.count >= config.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
      resetAt: current.resetAt,
    };
  }

  current.count += 1;
  return { allowed: true, remaining: config.limit - current.count, resetAt: current.resetAt };
}

export function resetRateLimitBucketsForTests(): void {
  buckets.clear();
}
