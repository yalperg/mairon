import { registerComparisonOperators } from './comparison';
import { registerStringOperators } from './string';
import { registerArrayOperators } from './array';
import { registerExistenceOperators } from './existence';
import { registerTypeOperators } from './type';
import { registerChangeOperators } from './change';
import { registerMembershipOperators } from './membership';
import { registerLengthOperators } from './length';

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

export { registerOperator, getOperator, hasOperator, clearOperators, listOperators } from './registry';
export type { OperatorFunction } from './registry';
