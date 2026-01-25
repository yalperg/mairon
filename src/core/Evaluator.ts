import Operators from './Operators';
import { FieldAccessor, TemplateResolver } from '@/utils';

import type {
  Condition,
  SimpleCondition,
  LogicalGroup,
  EvaluationContext,
} from '@/types';

/**
 * Evaluates conditions against data contexts.
 *
 * The Evaluator handles:
 * - Simple conditions: `{ field, operator, value }`
 * - Logical groups: `{ all: [...] }`, `{ any: [...] }`, `{ not: ... }`
 * - Nested conditions of arbitrary depth
 * - Template resolution in condition values
 * - Field path resolution (e.g., 'user.address.city')
 *
 * @typeParam T - The type of data being evaluated
 *
 * @example
 * ```typescript
 * const evaluator = new Evaluator();
 *
 * const condition = {
 *   all: [
 *     { field: 'user.age', operator: 'greaterThan', value: 18 },
 *     { field: 'user.verified', operator: 'equals', value: true }
 *   ]
 * };
 *
 * const result = evaluator.evaluateCondition(condition, {
 *   data: { user: { age: 25, verified: true } }
 * });
 * // result: true
 * ```
 */
class Evaluator<T = unknown> {
  private fieldAccessor: FieldAccessor;
  private templateResolver: TemplateResolver;
  private operators: Operators<T>;

  /**
   * Creates a new Evaluator instance.
   *
   * @param fieldAccessor - Optional custom FieldAccessor for resolving field paths
   * @param templateResolver - Optional custom TemplateResolver for template values
   * @param operators - Optional Operators registry (uses default with built-ins if not provided)
   */
  constructor(
    fieldAccessor?: FieldAccessor,
    templateResolver?: TemplateResolver,
    operators?: Operators<T>,
  ) {
    this.fieldAccessor = fieldAccessor ?? new FieldAccessor();
    this.templateResolver =
      templateResolver ?? new TemplateResolver(this.fieldAccessor);
    this.operators = operators ?? new Operators<T>();
  }

  /**
   * Clears the field accessor's path resolution cache.
   * Call this when evaluating many different data structures to prevent memory buildup.
   */
  clearCache(): void {
    this.fieldAccessor.clear();
  }

  /**
   * Evaluates a condition (simple or logical group) against a context.
   *
   * @param condition - The condition to evaluate
   * @param context - The evaluation context containing data
   * @returns true if the condition matches, false otherwise
   *
   * @example
   * ```typescript
   * // Simple condition
   * evaluator.evaluateCondition(
   *   { field: 'status', operator: 'equals', value: 'active' },
   *   { data: { status: 'active' } }
   * ); // true
   *
   * // Logical AND
   * evaluator.evaluateCondition(
   *   { all: [
   *     { field: 'age', operator: 'greaterThan', value: 18 },
   *     { field: 'country', operator: 'equals', value: 'US' }
   *   ]},
   *   { data: { age: 25, country: 'US' } }
   * ); // true
   *
   * // Logical OR
   * evaluator.evaluateCondition(
   *   { any: [
   *     { field: 'role', operator: 'equals', value: 'admin' },
   *     { field: 'role', operator: 'equals', value: 'moderator' }
   *   ]},
   *   { data: { role: 'admin' } }
   * ); // true
   *
   * // Logical NOT
   * evaluator.evaluateCondition(
   *   { not: { field: 'banned', operator: 'equals', value: true } },
   *   { data: { banned: false } }
   * ); // true
   * ```
   */
  evaluateCondition(
    condition: Condition<T>,
    context: EvaluationContext<T>,
  ): boolean {
    if (this.isSimple(condition)) {
      return this.evaluateSimpleCondition(condition, context);
    }
    return this.evaluateGroup(condition, context);
  }

  /**
   * Evaluates a logical group condition (all/any/not).
   */
  private evaluateGroup(
    group: LogicalGroup<T>,
    context: EvaluationContext<T>,
  ): boolean {
    if (group.all) {
      for (const c of group.all) {
        if (!this.evaluateCondition(c, context)) {
          return false;
        }
      }
      return true;
    }
    if (group.any) {
      for (const c of group.any) {
        if (this.evaluateCondition(c, context)) {
          return true;
        }
      }
      return false;
    }
    if (group.not) {
      return !this.evaluateCondition(group.not, context);
    }
    return false;
  }

  /**
   * Evaluates a simple field-operator-value condition.
   */
  private evaluateSimpleCondition(
    condition: SimpleCondition,
    context: EvaluationContext<T>,
  ): boolean {
    const operator = this.operators.get(condition.operator);
    if (!operator) {
      return false;
    }

    const fieldValue = this.fieldAccessor.resolvePath(
      context.data,
      condition.field,
    );

    if (condition.value !== undefined) {
      condition.value = this.templateResolver.resolve(condition.value, context);
    }

    const normalizedCondition: SimpleCondition = {
      ...condition,
      value: condition.value,
    };

    return operator.evaluate(fieldValue, normalizedCondition, context);
  }

  /**
   * Type guard to check if a condition is a simple condition.
   */
  private isSimple(condition: Condition<T>): condition is SimpleCondition {
    return (
      (condition as SimpleCondition).field !== undefined &&
      (condition as SimpleCondition).operator !== undefined
    );
  }
}

export default Evaluator;
