import isNull from 'lodash/isNull';
import isUndefined from 'lodash/isUndefined';
import { registerOperator } from './registry';

export function registerExistenceOperators(): void {
  registerOperator('exists', (fieldValue: unknown): boolean => {
    return fieldValue !== undefined;
  });

  registerOperator('notExists', (fieldValue: unknown): boolean => {
    return fieldValue === undefined;
  });

  registerOperator('isNull', (fieldValue: unknown): boolean => {
    return isNull(fieldValue);
  });

  registerOperator('isNotNull', (fieldValue: unknown): boolean => {
    return !isNull(fieldValue);
  });

  registerOperator('isDefined', (fieldValue: unknown): boolean => {
    return !isUndefined(fieldValue);
  });

  registerOperator('isUndefined', (fieldValue: unknown): boolean => {
    return isUndefined(fieldValue);
  });
}
