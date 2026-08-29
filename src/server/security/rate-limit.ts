interface Bucket {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly maxAttempts = 8,
    private readonly windowMs = 15 * 60 * 1000,
  ) {}

  allow(key: string): boolean {
    const now = Date.now();
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    if (current.count >= this.maxAttempts) {
      return false;
    }
    current.count += 1;
    return true;
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }
}
