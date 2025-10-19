import { Cache } from '@/utils';

describe('Cache', () => {
  describe('basic operations', () => {
    it('should set and get values', () => {
      const cache = new Cache<string>();

      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      const cache = new Cache<string>();
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should check if key exists', () => {
      const cache = new Cache<string>();

      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });

    it('should delete keys', () => {
      const cache = new Cache<string>();

      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.has('key1')).toBe(false);
      expect(cache.delete('key1')).toBe(false);
    });

    it('should clear all entries', () => {
      const cache = new Cache<string>();

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeUndefined();
    });
  });

  describe('size limits', () => {
    it('should enforce max size', () => {
      const cache = new Cache<number>({ maxSize: 3 });

      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key3', 3);
      cache.set('key4', 4);

      expect(cache.size()).toBe(3);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key4')).toBe(true);
    });

    it('should not evict when updating existing key', () => {
      const cache = new Cache<number>({ maxSize: 2 });

      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.set('key1', 10);

      expect(cache.size()).toBe(2);
      expect(cache.get('key1')).toBe(10);
      expect(cache.has('key2')).toBe(true);
    });

    it('should use default max size', () => {
      const cache = new Cache<string>();
      expect(cache.size()).toBe(0);

      for (let i = 0; i < 1001; i++) {
        cache.set(`key${i}`, `value${i}`);
      }

      expect(cache.size()).toBe(1000);
    });
  });

  describe('TTL', () => {
    it('should expire entries after TTL', async () => {
      const cache = new Cache<string>({ ttl: 50 });

      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');

      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.has('key1')).toBe(false);
    });

    it('should allow per-entry TTL override', async () => {
      const cache = new Cache<string>({ ttl: 1000 });

      cache.set('key1', 'value1', 50);
      expect(cache.get('key1')).toBe('value1');

      await new Promise((resolve) => setTimeout(resolve, 60));

      expect(cache.get('key1')).toBeUndefined();
    });

    it('should not expire entries without TTL', async () => {
      const cache = new Cache<string>();

      cache.set('key1', 'value1');

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('statistics', () => {
    it('should track hits and misses', () => {
      const cache = new Cache<string>();

      cache.set('key1', 'value1');

      cache.get('key1');
      cache.get('key1');
      cache.get('key2');
      cache.get('key3');

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(0.5);
    });

    it('should reset stats on clear', () => {
      const cache = new Cache<string>();

      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('key2');

      cache.clear();

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });

    it('should handle zero accesses', () => {
      const cache = new Cache<string>();
      const stats = cache.getStats();

      expect(stats.hitRate).toBe(0);
    });

    it('should include size in stats', () => {
      const cache = new Cache<string>();

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      const cache = new Cache<string>({ ttl: 50 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3', 1000);

      await new Promise((resolve) => setTimeout(resolve, 60));

      const removed = cache.cleanup();

      expect(removed).toBe(2);
      expect(cache.size()).toBe(1);
      expect(cache.has('key3')).toBe(true);
    });

    it('should return 0 when no entries expired', () => {
      const cache = new Cache<string>();

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const removed = cache.cleanup();
      expect(removed).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle different value types', () => {
      const cache = new Cache<unknown>();

      cache.set('string', 'value');
      cache.set('number', 42);
      cache.set('boolean', true);
      cache.set('null', null);
      cache.set('object', { key: 'value' });
      cache.set('array', [1, 2, 3]);

      expect(cache.get('string')).toBe('value');
      expect(cache.get('number')).toBe(42);
      expect(cache.get('boolean')).toBe(true);
      expect(cache.get('null')).toBe(null);
      expect(cache.get('object')).toEqual({ key: 'value' });
      expect(cache.get('array')).toEqual([1, 2, 3]);
    });

    it('should handle empty string keys', () => {
      const cache = new Cache<string>();

      cache.set('', 'empty');
      expect(cache.get('')).toBe('empty');
    });

    it('should update existing entries', () => {
      const cache = new Cache<number>();

      cache.set('key', 1);
      cache.set('key', 2);
      cache.set('key', 3);

      expect(cache.get('key')).toBe(3);
      expect(cache.size()).toBe(1);
    });
  });
});
