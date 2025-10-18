export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export interface CacheOptions {
  maxSize?: number;
  ttl?: number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
}

export class Cache<T = unknown> {
  private store: Map<string, CacheEntry<T>> = new Map();
  private hits = 0;
  private misses = 0;
  private readonly maxSize: number;
  private readonly ttl: number | undefined;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize ?? 1000;
    this.ttl = options.ttl;
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return undefined;
    }

    this.hits++;
    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) {
        this.store.delete(firstKey);
      }
    }

    const effectiveTtl = ttl ?? this.ttl;
    const entry: CacheEntry<T> = effectiveTtl
      ? { value, expiresAt: Date.now() + effectiveTtl }
      : { value };

    this.store.set(key, entry);
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) {
      return false;
    }

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.store.size,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  size(): number {
    return this.store.size;
  }

  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.store.delete(key);
        removed++;
      }
    }

    return removed;
  }
}
