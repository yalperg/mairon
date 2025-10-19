import isArray from 'lodash/isArray';
import isEmpty from 'lodash/isEmpty';
import intersection from 'lodash/intersection';
import { Operator } from '@/core';

import type { SimpleCondition } from '@/types';

const includes = new Operator(
  'includes',
  (fieldValue: unknown, condition: SimpleCondition): boolean => {
    if (!isArray(fieldValue)) {
      return false;
    }
    return fieldValue.includes(condition.value);
  },
);

const excludes = new Operator(
  'excludes',
  (fieldValue: unknown, condition: SimpleCondition): boolean => {
    if (!isArray(fieldValue)) {
      return false;
    }
    return !fieldValue.includes(condition.value);
  },
);

const includesAll = new Operator(
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

const includesAny = new Operator(
  'includesAny',
  (fieldValue: unknown, condition: SimpleCondition): boolean => {
    if (!isArray(fieldValue) || !isArray(condition.value)) {
      return false;
    }
    const common = intersection(fieldValue, condition.value);
    return common.length > 0;
  },
);

const isEmptyArray = new Operator('isEmpty', (fieldValue: unknown): boolean => {
  if (!isArray(fieldValue)) {
    return false;
  }
  return isEmpty(fieldValue);
});

const isNotEmpty = new Operator(
  'isNotEmpty',
  (fieldValue: unknown): boolean => {
    if (!isArray(fieldValue)) {
      return false;
    }
    return !isEmpty(fieldValue);
  },
);

export default {
  includes,
  excludes,
  includesAll,
  includesAny,
  isEmpty: isEmptyArray,
  isNotEmpty,
};
