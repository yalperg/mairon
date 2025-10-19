import operators from '@/core/Operators';
import {
  Condition,
  SimpleCondition,
  LogicalGroup,
  EvaluationContext,
} from './types';
import { FieldAccessor } from '../utils/FieldAccessor';
import { TemplateResolver } from '../utils/TemplateResolver';
export class Evaluator<T = unknown> {
  private fieldAccessor: FieldAccessor;
  private templateResolver: TemplateResolver;

  constructor(
    fieldAccessor?: FieldAccessor,
    templateResolver?: TemplateResolver,
  ) {
    this.fieldAccessor = fieldAccessor ?? new FieldAccessor();
    this.templateResolver =
      templateResolver ?? new TemplateResolver(this.fieldAccessor);
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
    return false;
  }

  private evaluateSimpleCondition(
    condition: SimpleCondition,
    context: EvaluationContext<T>,
  ): boolean {
    const operator = operators.get(condition.operator);
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
