import type { EvaluationContext } from '@/types';
import type { ConditionOperator, SimpleCondition } from '@/schemas';

export type OperatorFn<T = unknown> = (
  fieldValue: unknown,
  condition: SimpleCondition,
  context: EvaluationContext<T>,
) => boolean;

class Operator<T = unknown> {
  readonly name: ConditionOperator;
  private readonly fn: OperatorFn<T>;

  constructor(name: ConditionOperator, fn: OperatorFn<T>) {
    this.name = name;
    this.fn = fn;
  }

  public evaluate(
    fieldValue: unknown,
    condition: SimpleCondition,
    context: EvaluationContext<T>,
  ): boolean {
    return this.fn(fieldValue, condition, context);
  }
}

export default Operator;
