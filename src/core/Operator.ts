import type { EvaluationContext } from '@/types';
import type { SimpleCondition } from '@/schemas';

export type OperatorFn<T = unknown> = (
  fieldValue: unknown,
  condition: SimpleCondition,
  context: EvaluationContext<T>,
) => boolean;

export interface OperatorOptions {
  description?: string;
  requiresValue?: boolean;
  requiresFromTo?: boolean;
  validate?: (condition: SimpleCondition) => string | null;
}

class Operator<T = unknown> {
  readonly name: string;
  readonly options: OperatorOptions;
  private readonly fn: OperatorFn<T>;

  constructor(name: string, fn: OperatorFn<T>, options?: OperatorOptions) {
    this.name = name;
    this.fn = fn;
    this.options = options ?? {};
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
