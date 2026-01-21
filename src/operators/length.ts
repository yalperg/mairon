import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import Operator from '@/core/Operator';

import type { SimpleCondition, EvaluationContext } from '@/types';

function getLength(value: unknown): number | null {
  if (isString(value) || isArray(value)) {
    return value.length;
  }
  return null;
}

function getTarget(condition: SimpleCondition): number | null {
  if (isNumber(condition.value)) {
    return condition.value as number;
  }
  return null;
}

const lengthEquals = new Operator(
  'lengthEquals',
  (
    fieldValue: unknown,
    condition: SimpleCondition,
    _context: EvaluationContext,
  ): boolean => {
    const length = getLength(fieldValue);
    const target = getTarget(condition);
    if (length === null || target === null) {
      return false;
    }
    return length === target;
  },
);

const lengthGreaterThan = new Operator(
  'lengthGreaterThan',
  (
    fieldValue: unknown,
    condition: SimpleCondition,
    _context: EvaluationContext,
  ): boolean => {
    const length = getLength(fieldValue);
    const target = getTarget(condition);
    if (length === null || target === null) {
      return false;
    }
    return length > target;
  },
);

const lengthLessThan = new Operator(
  'lengthLessThan',
  (
    fieldValue: unknown,
    condition: SimpleCondition,
    _context: EvaluationContext,
  ): boolean => {
    const length = getLength(fieldValue);
    const target = getTarget(condition);
    if (length === null || target === null) {
      return false;
    }
    return length < target;
  },
);

const lengthGreaterThanOrEqual = new Operator(
  'lengthGreaterThanOrEqual',
  (
    fieldValue: unknown,
    condition: SimpleCondition,
    _context: EvaluationContext,
  ): boolean => {
    const length = getLength(fieldValue);
    const target = getTarget(condition);
    if (length === null || target === null) {
      return false;
    }
    return length >= target;
  },
);

const lengthLessThanOrEqual = new Operator(
  'lengthLessThanOrEqual',
  (
    fieldValue: unknown,
    condition: SimpleCondition,
    _context: EvaluationContext,
  ): boolean => {
    const length = getLength(fieldValue);
    const target = getTarget(condition);
    if (length === null || target === null) {
      return false;
    }
    return length <= target;
  },
);

export default {
  lengthEquals,
  lengthGreaterThan,
  lengthLessThan,
  lengthGreaterThanOrEqual,
  lengthLessThanOrEqual,
};
