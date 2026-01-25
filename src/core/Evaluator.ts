import Operators from './Operators';
import { FieldAccessor, TemplateResolver } from '@/utils';

import type {
  Condition,
  SimpleCondition,
  LogicalGroup,
  EvaluationContext,
  ConditionExplanation,
  SimpleConditionExplanation,
  LogicalGroupExplanation,
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
   * Evaluates a condition and returns a detailed explanation of the evaluation.
   *
   * This is useful for debugging rules and understanding why a condition
   * matched or didn't match.
   *
   * @param condition - The condition to evaluate
   * @param context - The evaluation context containing data
   * @returns An explanation object with pass/fail status and details
   *
   * @example
   * ```typescript
   * const explanation = evaluator.explainCondition(
   *   {
   *     all: [
   *       { field: 'age', operator: 'greaterThan', value: 18 },
   *       { field: 'verified', operator: 'equals', value: true }
   *     ]
   *   },
   *   { data: { age: 25, verified: false } }
   * );
   *
   * // Result:
   * // {
   * //   type: 'all',
   * //   passed: false,
   * //   children: [
   * //     { type: 'simple', field: 'age', operator: 'greaterThan', expected: 18, actual: 25, passed: true },
   * //     { type: 'simple', field: 'verified', operator: 'equals', expected: true, actual: false, passed: false }
   * //   ]
   * // }
   * ```
   */
  explainCondition(
    condition: Condition<T>,
    context: EvaluationContext<T>,
  ): ConditionExplanation {
    if (this.isSimple(condition)) {
      return this.explainSimpleCondition(condition, context);
    }
    return this.explainGroup(condition, context);
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
   * Explains a logical group evaluation.
   */
  private explainGroup(
    group: LogicalGroup<T>,
    context: EvaluationContext<T>,
  ): LogicalGroupExplanation {
    if (group.all) {
      const children = group.all.map((c) => this.explainCondition(c, context));
      const passed = children.every((c) => c.passed);
      return { type: 'all', passed, children };
    }
    if (group.any) {
      const children = group.any.map((c) => this.explainCondition(c, context));
      const passed = children.some((c) => c.passed);
      return { type: 'any', passed, children };
    }
    if (group.not) {
      const child = this.explainCondition(group.not, context);
      return { type: 'not', passed: !child.passed, children: [child] };
    }
    return { type: 'all', passed: false, children: [] };
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
   * Explains a simple condition evaluation.
   */
  private explainSimpleCondition(
    condition: SimpleCondition,
    context: EvaluationContext<T>,
  ): SimpleConditionExplanation {
    const operator = this.operators.get(condition.operator);
    const fieldValue = this.fieldAccessor.resolvePath(
      context.data,
      condition.field,
    );

    let resolvedValue = condition.value;
    if (condition.value !== undefined) {
      resolvedValue = this.templateResolver.resolve(condition.value, context);
    }

    let passed = false;
    if (operator) {
      const normalizedCondition: SimpleCondition = {
        ...condition,
        value: resolvedValue,
      };
      passed = operator.evaluate(fieldValue, normalizedCondition, context);
    }

    return {
      type: 'simple',
      field: condition.field,
      operator: condition.operator,
      expected: resolvedValue,
      actual: fieldValue,
      passed,
    };
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
