import isArray from 'lodash/isArray';
import isEqual from 'lodash/isEqual';
import some from 'lodash/some';
import { Operator } from '@/core';

import type { SimpleCondition, EvaluationContext } from '@/types';

const inOperator = new Operator(
  'in',
  (
    fieldValue: unknown,
    condition: SimpleCondition,
    _context: EvaluationContext,
  ): boolean => {
    const values = condition.value;
    if (!isArray(values)) {
      return false;
    }
    return some(values, (v) => isEqual(v, fieldValue));
  },
);

const notIn = new Operator(
  'notIn',
  (
    fieldValue: unknown,
    condition: SimpleCondition,
    _context: EvaluationContext,
  ): boolean => {
    const values = condition.value;
    if (!isArray(values)) {
      return false;
    }
    return !some(values, (v) => isEqual(v, fieldValue));
  },
);

export default {
  in: inOperator,
  notIn,
};
