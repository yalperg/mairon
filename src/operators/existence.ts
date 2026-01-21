import isNull from 'lodash/isNull';
import isUndefined from 'lodash/isUndefined';
import Operator from '@/core/Operator';

const exists = new Operator('exists', (fieldValue: unknown): boolean => {
  return fieldValue !== undefined;
});

const notExists = new Operator('notExists', (fieldValue: unknown): boolean => {
  return fieldValue === undefined;
});

const isNullOperator = new Operator(
  'isNull',
  (fieldValue: unknown): boolean => {
    return isNull(fieldValue);
  },
);

const isNotNull = new Operator('isNotNull', (fieldValue: unknown): boolean => {
  return !isNull(fieldValue);
});

const isDefined = new Operator('isDefined', (fieldValue: unknown): boolean => {
  return !isUndefined(fieldValue);
});

const isUndefinedOperator = new Operator(
  'isUndefined',
  (fieldValue: unknown): boolean => {
    return isUndefined(fieldValue);
  },
);

export default {
  exists,
  notExists,
  isNull: isNullOperator,
  isNotNull,
  isDefined,
  isUndefined: isUndefinedOperator,
};
