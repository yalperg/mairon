import isEqual from 'lodash/isEqual';
import toNumber from 'lodash/toNumber';
import { Operator } from '@/core';

import type { SimpleCondition } from '@/types';

const equals = new Operator(
  'equals',
  (fieldValue: unknown, condition: SimpleCondition): boolean => {
    return isEqual(fieldValue, condition.value);
  },
);

const notEquals = new Operator(
  'notEquals',
  (fieldValue: unknown, condition: SimpleCondition): boolean => {
    return !isEqual(fieldValue, condition.value);
  },
);

const greaterThan = new Operator(
  'greaterThan',
  (fieldValue: unknown, condition: SimpleCondition): boolean => {
    const a = toNumber(fieldValue);
    const b = toNumber(condition.value);
    if (a === null || b === null) {
      return false;
    }
    return a > b;
  },
);

const lessThan = new Operator(
  'lessThan',
  (fieldValue: unknown, condition: SimpleCondition): boolean => {
    const a = toNumber(fieldValue);
    const b = toNumber(condition.value);
    if (a === null || b === null) {
      return false;
    }
    return a < b;
  },
);

const greaterThanOrEqual = new Operator(
  'greaterThanOrEqual',
  (fieldValue: unknown, condition: SimpleCondition): boolean => {
    const a = toNumber(fieldValue);
    const b = toNumber(condition.value);
    if (a === null || b === null) {
      return false;
    }
    return a >= b;
  },
);

const lessThanOrEqual = new Operator(
  'lessThanOrEqual',
  (fieldValue: unknown, condition: SimpleCondition): boolean => {
    const a = toNumber(fieldValue);
    const b = toNumber(condition.value);
    if (a === null || b === null) {
      return false;
    }
    return a <= b;
  },
);

const between = new Operator(
  'between',
  (fieldValue: unknown, condition: SimpleCondition): boolean => {
    const value = toNumber(fieldValue);
    const arr = Array.isArray(condition.value) ? condition.value : null;
    if (value === null || arr === null || arr.length !== 2) {
      return false;
    }
    const min = toNumber(arr[0]);
    const max = toNumber(arr[1]);
    if (min === null || max === null) {
      return false;
    }
    return value >= min && value <= max;
  },
);

export default {
  equals,
  notEquals,
  greaterThan,
  lessThan,
  greaterThanOrEqual,
  lessThanOrEqual,
  between,
};
