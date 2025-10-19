import isEqual from 'lodash/isEqual';
import toNumber from 'lodash/toNumber';
import isNaN from 'lodash/isNaN';
import { Operator } from '@/core';
import { FieldAccessor } from '@/utils';

import type { SimpleCondition, EvaluationContext } from '@/types';

const fieldAccessor = new FieldAccessor();

const changed = new Operator(
  'changed',
  (
    fieldValue: unknown,
    condition: SimpleCondition,
    context: EvaluationContext,
  ): boolean => {
    if (!context.previousData) {
      return false;
    }
    const previousValue = fieldAccessor.resolvePath(
      context.previousData,
      condition.field,
    );
    return !isEqual(fieldValue, previousValue);
  },
);

const changedFrom = new Operator(
  'changedFrom',
  (
    fieldValue: unknown,
    condition: SimpleCondition,
    context: EvaluationContext,
  ): boolean => {
    if (!context.previousData) {
      return false;
    }
    const previousValue = fieldAccessor.resolvePath(
      context.previousData,
      condition.field,
    );
    return (
      isEqual(previousValue, condition.value) &&
      !isEqual(fieldValue, condition.value)
    );
  },
);

const changedTo = new Operator(
  'changedTo',
  (
    fieldValue: unknown,
    condition: SimpleCondition,
    context: EvaluationContext,
  ): boolean => {
    if (!context.previousData) {
      return false;
    }
    const previousValue = fieldAccessor.resolvePath(
      context.previousData,
      condition.field,
    );
    return (
      isEqual(fieldValue, condition.value) &&
      !isEqual(previousValue, condition.value)
    );
  },
);

const changedFromTo = new Operator(
  'changedFromTo',
  (
    fieldValue: unknown,
    condition: SimpleCondition,
    context: EvaluationContext,
  ): boolean => {
    if (!context.previousData) {
      return false;
    }
    const previousValue = fieldAccessor.resolvePath(
      context.previousData,
      condition.field,
    );
    const fromValue = (condition as { from?: unknown }).from;
    const toValue = (condition as { to?: unknown }).to;
    return isEqual(previousValue, fromValue) && isEqual(fieldValue, toValue);
  },
);

const increased = new Operator(
  'increased',
  (
    fieldValue: unknown,
    condition: SimpleCondition,
    context: EvaluationContext,
  ): boolean => {
    if (!context.previousData) {
      return false;
    }
    const previousValue = fieldAccessor.resolvePath(
      context.previousData,
      condition.field,
    );
    const currentNum = toNumber(fieldValue);
    const previousNum = toNumber(previousValue);
    if (isNaN(currentNum) || isNaN(previousNum)) {
      return false;
    }
    return currentNum > previousNum;
  },
);

const decreased = new Operator(
  'decreased',
  (
    fieldValue: unknown,
    condition: SimpleCondition,
    context: EvaluationContext,
  ): boolean => {
    if (!context.previousData) {
      return false;
    }
    const previousValue = fieldAccessor.resolvePath(
      context.previousData,
      condition.field,
    );
    const currentNum = toNumber(fieldValue);
    const previousNum = toNumber(previousValue);
    if (isNaN(currentNum) || isNaN(previousNum)) {
      return false;
    }
    return currentNum < previousNum;
  },
);

export default {
  changed,
  changedFrom,
  changedTo,
  changedFromTo,
  increased,
  decreased,
};
