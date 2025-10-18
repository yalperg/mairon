import isEqual from 'lodash/isEqual';
import toNumber from 'lodash/toNumber';
import isNaN from 'lodash/isNaN';
import { registerOperator } from '.';
import { SimpleCondition, EvaluationContext } from '../core/types';
import { FieldAccessor } from '../utils/FieldAccessor';

const fieldAccessor = new FieldAccessor();

export function registerChangeOperators(): void {
  registerOperator('changed', (fieldValue: unknown, condition: SimpleCondition, context: EvaluationContext): boolean => {
    if (!context.previousData) {
      return false;
    }
    const previousValue = fieldAccessor.resolvePath(context.previousData, condition.field);
    return !isEqual(fieldValue, previousValue);
  });

  registerOperator('changedFrom', (fieldValue: unknown, condition: SimpleCondition, context: EvaluationContext): boolean => {
    if (!context.previousData) {
      return false;
    }
    const previousValue = fieldAccessor.resolvePath(context.previousData, condition.field);
    return isEqual(previousValue, condition.value) && !isEqual(fieldValue, condition.value);
  });

  registerOperator('changedTo', (fieldValue: unknown, condition: SimpleCondition, context: EvaluationContext): boolean => {
    if (!context.previousData) {
      return false;
    }
    const previousValue = fieldAccessor.resolvePath(context.previousData, condition.field);
    return isEqual(fieldValue, condition.value) && !isEqual(previousValue, condition.value);
  });

  registerOperator('changedFromTo', (fieldValue: unknown, condition: SimpleCondition, context: EvaluationContext): boolean => {
    if (!context.previousData) {
      return false;
    }
    const previousValue = fieldAccessor.resolvePath(context.previousData, condition.field);
    const fromValue = (condition as { from?: unknown }).from;
    const toValue = (condition as { to?: unknown }).to;
    return isEqual(previousValue, fromValue) && isEqual(fieldValue, toValue);
  });

  registerOperator('increased', (fieldValue: unknown, condition: SimpleCondition, context: EvaluationContext): boolean => {
    if (!context.previousData) {
      return false;
    }
    const previousValue = fieldAccessor.resolvePath(context.previousData, condition.field);
    const currentNum = toNumber(fieldValue);
    const previousNum = toNumber(previousValue);
    if (isNaN(currentNum) || isNaN(previousNum)) {
      return false;
    }
    return currentNum > previousNum;
  });

  registerOperator('decreased', (fieldValue: unknown, condition: SimpleCondition, context: EvaluationContext): boolean => {
    if (!context.previousData) {
      return false;
    }
    const previousValue = fieldAccessor.resolvePath(context.previousData, condition.field);
    const currentNum = toNumber(fieldValue);
    const previousNum = toNumber(previousValue);
    if (isNaN(currentNum) || isNaN(previousNum)) {
      return false;
    }
    return currentNum < previousNum;
  });
}

registerChangeOperators();
