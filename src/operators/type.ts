import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import isBoolean from 'lodash/isBoolean';
import isArray from 'lodash/isArray';
import isPlainObject from 'lodash/isPlainObject';
import { registerOperator } from './registry';

export function registerTypeOperators(): void {
  registerOperator('isString', (fieldValue: unknown): boolean => {
    return isString(fieldValue);
  });

  registerOperator('isNumber', (fieldValue: unknown): boolean => {
    return isNumber(fieldValue) && !Number.isNaN(fieldValue);
  });

  registerOperator('isBoolean', (fieldValue: unknown): boolean => {
    return isBoolean(fieldValue);
  });

  registerOperator('isArray', (fieldValue: unknown): boolean => {
    return isArray(fieldValue);
  });

  registerOperator('isObject', (fieldValue: unknown): boolean => {
    return isPlainObject(fieldValue);
  });
}
