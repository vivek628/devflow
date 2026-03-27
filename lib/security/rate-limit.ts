type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  timestamps: number[];
};

const store = new Map<string, RateLimitEntry>();

export function enforceRateLimit(options: RateLimitOptions) {
  const now = Date.now();
  const windowStart = now - options.windowMs;
  const current = store.get(options.key) ?? { timestamps: [] };
  const activeTimestamps = current.timestamps.filter(
    (timestamp) => timestamp > windowStart,
  );

  if (activeTimestamps.length >= options.limit) {
    const retryAfterMs = options.windowMs - (now - activeTimestamps[0]);

    return {
      success: false as const,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  activeTimestamps.push(now);
  store.set(options.key, { timestamps: activeTimestamps });

  return {
    success: true as const,
    retryAfterSeconds: 0,
  };
}
