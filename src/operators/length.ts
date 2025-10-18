import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import { registerOperator } from '.';
import { SimpleCondition, EvaluationContext } from '../core/types';

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

export function registerLengthOperators(): void {
  registerOperator('lengthEquals', (fieldValue: unknown, condition: SimpleCondition, _context: EvaluationContext): boolean => {
    const length = getLength(fieldValue);
    const target = getTarget(condition);
    if (length === null || target === null) {
      return false;
    }
    return length === target;
  });

  registerOperator('lengthGreaterThan', (fieldValue: unknown, condition: SimpleCondition, _context: EvaluationContext): boolean => {
    const length = getLength(fieldValue);
    const target = getTarget(condition);
    if (length === null || target === null) {
      return false;
    }
    return length > target;
  });

  registerOperator('lengthLessThan', (fieldValue: unknown, condition: SimpleCondition, _context: EvaluationContext): boolean => {
    const length = getLength(fieldValue);
    const target = getTarget(condition);
    if (length === null || target === null) {
      return false;
    }
    return length < target;
  });

  registerOperator('lengthGreaterThanOrEqual', (fieldValue: unknown, condition: SimpleCondition, _context: EvaluationContext): boolean => {
    const length = getLength(fieldValue);
    const target = getTarget(condition);
    if (length === null || target === null) {
      return false;
    }
    return length >= target;
  });

  registerOperator('lengthLessThanOrEqual', (fieldValue: unknown, condition: SimpleCondition, _context: EvaluationContext): boolean => {
    const length = getLength(fieldValue);
    const target = getTarget(condition);
    if (length === null || target === null) {
      return false;
    }
    return length <= target;
  });
}

registerLengthOperators();
