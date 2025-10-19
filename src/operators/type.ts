import isString from 'lodash/isString';
import isNumber from 'lodash/isNumber';
import isBoolean from 'lodash/isBoolean';
import isArray from 'lodash/isArray';
import isPlainObject from 'lodash/isPlainObject';
import { Operator } from '@/core';

const isStringOperator = new Operator(
  'isString',
  (fieldValue: unknown): boolean => {
    return isString(fieldValue);
  },
);

const isNumberOperator = new Operator(
  'isNumber',
  (fieldValue: unknown): boolean => {
    return isNumber(fieldValue) && !Number.isNaN(fieldValue);
  },
);

const isBooleanOperator = new Operator(
  'isBoolean',
  (fieldValue: unknown): boolean => {
    return isBoolean(fieldValue);
  },
);

const isArrayOperator = new Operator(
  'isArray',
  (fieldValue: unknown): boolean => {
    return isArray(fieldValue);
  },
);

const isObject = new Operator('isObject', (fieldValue: unknown): boolean => {
  return isPlainObject(fieldValue);
});

export default {
  isString: isStringOperator,
  isNumber: isNumberOperator,
  isBoolean: isBooleanOperator,
  isArray: isArrayOperator,
  isObject,
};
