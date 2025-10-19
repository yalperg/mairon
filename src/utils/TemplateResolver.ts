import FieldAccessor from './FieldAccessor';
import Cache from './Cache';

import type { EvaluationContext } from '@/types';

class TemplateResolver {
  private fieldAccessor: FieldAccessor;
  private templateRegex = /\{\{(.+?)\}\}/g;
  private exprCache: Cache<unknown>;

  constructor(fieldAccessor?: FieldAccessor, cacheTtlMs?: number) {
    this.fieldAccessor = fieldAccessor || new FieldAccessor();
    this.exprCache = new Cache<unknown>({
      maxSize: 1000,
      ttl: cacheTtlMs ?? 2000,
    });
  }

  resolve(value: unknown, context: EvaluationContext): unknown {
    if (typeof value === 'string') {
      return this.resolveString(value, context);
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.resolve(item, context));
    }

    if (value !== null && typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = this.resolve(val, context);
      }
      return result;
    }

    return value;
  }

  private resolveString(str: string, context: EvaluationContext): unknown {
    if (!str.includes('{{')) {
      return str;
    }

    const matches = Array.from(str.matchAll(this.templateRegex));

    if (matches.length === 1 && matches[0][0] === str) {
      const expr = matches[0][1].trim();
      return this.resolveExpression(expr, context);
    }

    let result = str;
    for (const match of matches) {
      const fullMatch = match[0];
      const expr = match[1].trim();
      const resolved = this.resolveExpression(expr, context);
      result = result.replace(fullMatch, String(resolved ?? ''));
    }

    return result;
  }

  private resolveExpression(expr: string, context: EvaluationContext): unknown {
    const cacheKey = `${expr}|${Boolean(context.previousData)}|${Object.keys(context.context ?? {}).length}`;
    const cached = this.exprCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    if (expr.startsWith('now')) {
      const val = this.resolveTimeExpression(expr);
      this.exprCache.set(cacheKey, val, 200);
      return val;
    }

    if (expr.startsWith('data.')) {
      const path = expr.substring(5);
      const val = this.fieldAccessor.resolvePath(context.data, path);
      this.exprCache.set(cacheKey, val);
      return val;
    }

    if (expr.startsWith('previousData.')) {
      const path = expr.substring(13);
      const val = this.fieldAccessor.resolvePath(context.previousData, path);
      this.exprCache.set(cacheKey, val);
      return val;
    }

    if (expr.startsWith('context.')) {
      const path = expr.substring(8);
      const val = this.fieldAccessor.resolvePath(context.context, path);
      this.exprCache.set(cacheKey, val);
      return val;
    }

    return `{{${expr}}}`;
  }

  private resolveTimeExpression(expr: string): number {
    const now = Date.now();

    if (expr === 'now') {
      return now;
    }

    const match = expr.match(/now\s*([+-])\s*(\d+)([smhdw])/);
    if (!match) {
      return now;
    }

    const [, operator, amount, unit] = match;
    const num = parseInt(amount, 10);

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
      w: 7 * 24 * 60 * 60 * 1000,
    };

    const offset = num * multipliers[unit];
    return operator === '+' ? now + offset : now - offset;
  }

  clearCache(): void {
    this.fieldAccessor.clear();
    this.exprCache.clear();
  }
}

export default TemplateResolver;
