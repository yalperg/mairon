import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import intersection from 'lodash/intersection';
import { registerOperator } from './registry';
import { SimpleCondition } from '../core/types';

export function registerArrayOperators(): void {
  registerOperator(
    'includes',
    (fieldValue: unknown, condition: SimpleCondition): boolean => {
      if (!isArray(fieldValue)) {
        return false;
      }
      return fieldValue.includes(condition.value);
    },
  );

  registerOperator(
    'excludes',
    (fieldValue: unknown, condition: SimpleCondition): boolean => {
      if (!isArray(fieldValue)) {
        return false;
      }
      return !fieldValue.includes(condition.value);
    },
  );

  registerOperator(
    'includesAll',
    (fieldValue: unknown, condition: SimpleCondition): boolean => {
      if (!isArray(fieldValue) || !isArray(condition.value)) {
        return false;
      }
      const required = condition.value;
      const common = intersection(fieldValue, required);
      return common.length === required.length;
    },
  );

  registerOperator(
    'includesAny',
    (fieldValue: unknown, condition: SimpleCondition): boolean => {
      if (!isArray(fieldValue) || !isArray(condition.value)) {
        return false;
      }
      const common = intersection(fieldValue, condition.value);
      return common.length > 0;
    },
  );

  registerOperator('isEmpty', (fieldValue: unknown): boolean => {
    if (!isArray(fieldValue)) {
      return false;
    }
    return isEmpty(fieldValue);
  });

  registerOperator('isNotEmpty', (fieldValue: unknown): boolean => {
    if (!isArray(fieldValue)) {
      return false;
    }
    return !isEmpty(fieldValue);
  });
}
