import type { EvaluationContext } from '@/types';
import type { SimpleCondition } from '@/schemas';

/**
 * Function signature for operator evaluation.
 *
 * Operators can be synchronous (return boolean) or asynchronous (return Promise<boolean>).
 * Async operators are useful when condition evaluation requires external data lookups,
 * API calls, or database queries.
 *
 * @typeParam T - The type of data being evaluated
 *
 * @example
 * ```typescript
 * // Sync operator
 * const isEven: OperatorFn = (value) => value % 2 === 0;
 *
 * // Async operator
 * const hasPermission: OperatorFn = async (value, condition, context) => {
 *   const user = await fetchUser(context.data.userId);
 *   return user.permissions.includes(condition.value);
 * };
 * ```
 */
export type OperatorFn<T = unknown> = (
  fieldValue: unknown,
  condition: SimpleCondition,
  context: EvaluationContext<T>,
) => boolean | Promise<boolean>;

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

  /**
   * Evaluates the operator against a field value.
   *
   * @param fieldValue - The actual value from the data
   * @param condition - The condition containing operator and expected value
   * @param context - The evaluation context
   * @returns Promise resolving to true if condition matches, false otherwise
   */
  public evaluate(
    fieldValue: unknown,
    condition: SimpleCondition,
    context: EvaluationContext<T>,
  ): boolean | Promise<boolean> {
    return this.fn(fieldValue, condition, context);
  }
}

export default Operator;
