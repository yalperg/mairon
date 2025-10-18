import isArray from 'lodash/isArray';
import isEqual from 'lodash/isEqual';
import some from 'lodash/some';
import { registerOperator } from './registry';
import { SimpleCondition, EvaluationContext } from '../core/types';

export function registerMembershipOperators(): void {
  registerOperator(
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

  registerOperator(
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
}
