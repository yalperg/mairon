import defaultOperators from '@/operators';

import type Operator from './Operator';
import type { ConditionOperator } from '@/schemas';

class Operators<T = unknown> {
  private operators: Map<ConditionOperator, Operator<T>> = new Map(
    Object.entries(defaultOperators).map(([name, operator]) => [
      name as ConditionOperator,
      operator as Operator<T>,
    ]),
  );

  register(operator: Operator<T>): void {
    this.operators.set(operator.name, operator);
  }

  get(name: ConditionOperator): Operator<T> | undefined {
    return this.operators.get(name);
  }

  has(name: ConditionOperator): boolean {
    return this.operators.has(name);
  }

  clear(): void {
    this.operators.clear();
  }

  list(): ConditionOperator[] {
    return Array.from(this.operators.keys());
  }
}

export default new Operators();
