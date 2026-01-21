import Operators from './Operators';
import { FieldAccessor, TemplateResolver } from '@/utils';

import type {
  Condition,
  SimpleCondition,
  LogicalGroup,
  EvaluationContext,
} from '@/types';

class Evaluator<T = unknown> {
  private fieldAccessor: FieldAccessor;
  private templateResolver: TemplateResolver;
  private operators: Operators<T>;

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

  clearCache(): void {
    this.fieldAccessor.clear();
  }

  evaluateCondition(
    condition: Condition<T>,
    context: EvaluationContext<T>,
  ): boolean {
    if (this.isSimple(condition)) {
      return this.evaluateSimpleCondition(condition, context);
    }
    return this.evaluateGroup(condition, context);
  }

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

  private isSimple(condition: Condition<T>): condition is SimpleCondition {
    return (
      (condition as SimpleCondition).field !== undefined &&
      (condition as SimpleCondition).operator !== undefined
    );
  }
}

export default Evaluator;
