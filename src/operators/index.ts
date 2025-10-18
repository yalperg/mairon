import { registerComparisonOperators } from './comparison';
import { registerStringOperators } from './string';
import { registerArrayOperators } from './array';
import { registerExistenceOperators } from './existence';
import { registerTypeOperators } from './type';
import { registerChangeOperators } from './change';
import { registerMembershipOperators } from './membership';
import { registerLengthOperators } from './length';
import { ConditionOperator } from '../schema';
import { EvaluationContext, SimpleCondition } from '../core/types';

export type OperatorFunction<T = unknown> = (
  fieldValue: unknown,
  condition: SimpleCondition,
  context: EvaluationContext<T>
) => boolean;

export const operatorRegistry: Map<ConditionOperator, OperatorFunction> = new Map();

export function registerOperator<T = unknown>(name: ConditionOperator, fn: OperatorFunction<T>): void {
  operatorRegistry.set(name, fn as OperatorFunction);
}

export function getOperator<T = unknown>(name: ConditionOperator): OperatorFunction<T> | undefined {
  return operatorRegistry.get(name);
}

export function hasOperator(name: ConditionOperator): boolean {
  return operatorRegistry.has(name);
}

export function clearOperators(): void {
  operatorRegistry.clear();
}

export function listOperators(): ConditionOperator[] {
  return Array.from(operatorRegistry.keys());
}

export function registerDefaultOperators(): void {
  if ((registerDefaultOperators as { _done?: boolean })._done) {
    return;
  }
  registerComparisonOperators();
  registerStringOperators();
  registerArrayOperators();
  registerExistenceOperators();
  registerTypeOperators();
  registerChangeOperators();
  registerMembershipOperators();
  registerLengthOperators();
  (registerDefaultOperators as { _done?: boolean })._done = true;
}
