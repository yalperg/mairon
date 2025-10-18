import isNil from 'lodash/isNil';
import toString from 'lodash/toString';
import { registerOperator } from '.';
import { SimpleCondition } from '../core/types';

function toStringOrNull(value: unknown): string | null {
  if (isNil(value)) {
    return null;
  }
  return toString(value);
}

export function registerStringOperators(): void {
  registerOperator('contains', (fieldValue: unknown, condition: SimpleCondition): boolean => {
    const str = toStringOrNull(fieldValue);
    const search = toStringOrNull(condition.value);
    if (str === null || search === null) {
      return false;
    }
    return str.includes(search);
  });

  registerOperator('notContains', (fieldValue: unknown, condition: SimpleCondition): boolean => {
    const str = toStringOrNull(fieldValue);
    const search = toStringOrNull(condition.value);
    if (str === null || search === null) {
      return false;
    }
    return !str.includes(search);
  });

  registerOperator('startsWith', (fieldValue: unknown, condition: SimpleCondition): boolean => {
    const str = toStringOrNull(fieldValue);
    const prefix = toStringOrNull(condition.value);
    if (str === null || prefix === null) {
      return false;
    }
    return str.startsWith(prefix);
  });

  registerOperator('endsWith', (fieldValue: unknown, condition: SimpleCondition): boolean => {
    const str = toStringOrNull(fieldValue);
    const suffix = toStringOrNull(condition.value);
    if (str === null || suffix === null) {
      return false;
    }
    return str.endsWith(suffix);
  });

  registerOperator('matches', (fieldValue: unknown, condition: SimpleCondition): boolean => {
    const str = toStringOrNull(fieldValue);
    const pattern = toStringOrNull(condition.value);
    if (str === null || pattern === null) {
      return false;
    }
    try {
      const regex = new RegExp(pattern);
      return regex.test(str);
    } catch {
      return false;
    }
  });

  registerOperator('matchesAny', (fieldValue: unknown, condition: SimpleCondition): boolean => {
    const str = toStringOrNull(fieldValue);
    if (str === null) {
      return false;
    }
    if (!Array.isArray(condition.value)) {
      return false;
    }
    for (const item of condition.value) {
      const pattern = toStringOrNull(item);
      if (pattern === null) {
        continue;
      }
      try {
        const regex = new RegExp(pattern);
        if (regex.test(str)) {
          return true;
        }
      } catch {
        continue;
      }
    }
    return false;
  });
}

registerStringOperators();
