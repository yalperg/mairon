export class FieldAccessor {
  private cache: Map<string, unknown> = new Map();

  resolvePath(obj: unknown, path: string): unknown {
    if (obj === null || obj === undefined) {
      return undefined;
    }

    if (path === '') {
      return obj;
    }

    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }

      if (typeof current !== 'object') {
        return undefined;
      }

      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, key, index] = arrayMatch;
        current = (current as Record<string, unknown>)[key];
        if (Array.isArray(current)) {
          current = current[parseInt(index, 10)];
        } else {
          return undefined;
        }
      } else {
        current = (current as Record<string, unknown>)[part];
      }
    }

    return current;
  }

  get(obj: unknown, path: string): unknown {
    const cacheKey = this.getCacheKey(obj, path);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const value = this.resolvePath(obj, path);
    this.cache.set(cacheKey, value);
    return value;
  }

  clear(): void {
    this.cache.clear();
  }

  private getCacheKey(obj: unknown, path: string): string {
    const objId = this.getObjectId(obj);
    return `${objId}:${path}`;
  }

  private getObjectId(obj: unknown): string {
    if (obj === null) {
      return 'null';
    }
    if (obj === undefined) {
      return 'undefined';
    }
    if (typeof obj !== 'object') {
      return String(obj);
    }
    return String(obj);
  }
}
