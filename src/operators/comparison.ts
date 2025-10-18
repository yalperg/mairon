import isEqual from 'lodash/isEqual';
import toNumber from 'lodash/toNumber';
import { registerOperator } from './registry';
import { SimpleCondition } from '../core/types';

export function registerComparisonOperators(): void {
  registerOperator(
    'equals',
    (fieldValue: unknown, condition: SimpleCondition): boolean => {
      return isEqual(fieldValue, condition.value);
    },
  );

  registerOperator(
    'notEquals',
    (fieldValue: unknown, condition: SimpleCondition): boolean => {
      return !isEqual(fieldValue, condition.value);
    },
  );

  registerOperator(
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

  registerOperator(
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

  registerOperator(
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

  registerOperator(
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

  registerOperator(
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
}
