import isObject from 'lodash/isObject';
import { ruleSchema, actionSchema, conditionSchema } from '@/schemas';

import type {
  Rule,
  Condition,
  SimpleCondition,
  ValidationError,
  ValidationResult,
} from '@/types';

function semanticValidateCondition(
  condition: SimpleCondition,
  errors: ValidationError[],
  path: string,
): void {
  if (condition.operator === 'between') {
    if (!Array.isArray(condition.value) || condition.value.length !== 2) {
      errors.push({
        field: `${path}.value`,
        message: 'between operator requires [min, max] array',
        code: 'BETWEEN_VALUE_INVALID',
      });
    }
  }

  if (condition.operator === 'changedFromTo') {
    if (condition.from === undefined || condition.to === undefined) {
      errors.push({
        field: path,
        message: 'changedFromTo requires both from and to',
        code: 'CHANGED_FROM_TO_REQUIRED',
      });
    }
  }

  const arrayOperators = [
    'matchesAny',
    'includesAll',
    'includesAny',
    'in',
    'notIn',
  ];
  if (arrayOperators.includes(condition.operator)) {
    if (!Array.isArray(condition.value)) {
      errors.push({
        field: `${path}.value`,
        message: `${condition.operator} requires array value`,
        code: 'ARRAY_VALUE_REQUIRED',
      });
    }
  }
}

function isSimpleCondition(
  condition: Condition | unknown,
): condition is SimpleCondition {
  if (!isObject(condition)) {
    return false;
  }
  return 'field' in condition && 'operator' in condition;
}

function traverseConditions(
  condition: Condition,
  errors: ValidationError[],
  path = 'conditions',
): void {
  if (isSimpleCondition(condition)) {
    semanticValidateCondition(condition, errors, path);
    return;
  }

  if (isObject(condition) && 'all' in condition) {
    if (!Array.isArray(condition.all) || condition.all.length === 0) {
      errors.push({
        field: `${path}.all`,
        message: 'all must be a non-empty array',
        code: 'ALL_EMPTY',
      });
    } else {
      for (let i = 0; i < condition.all.length; i++) {
        traverseConditions(condition.all[i], errors, `${path}.all[${i}]`);
      }
    }
    return;
  }

  if (isObject(condition) && 'any' in condition) {
    if (!Array.isArray(condition.any) || condition.any.length === 0) {
      errors.push({
        field: `${path}.any`,
        message: 'any must be a non-empty array',
        code: 'ANY_EMPTY',
      });
    } else {
      for (let i = 0; i < condition.any.length; i++) {
        traverseConditions(condition.any[i], errors, `${path}.any[${i}]`);
      }
    }
    return;
  }

  if (isObject(condition) && 'not' in condition) {
    if (!condition.not || !isObject(condition.not)) {
      errors.push({
        field: `${path}.not`,
        message: 'not must be a valid condition',
        code: 'NOT_INVALID',
      });
    } else {
      traverseConditions(condition.not as Condition, errors, `${path}.not`);
    }
  }
}

class Validator {
  validate(rule: Rule): ValidationResult {
    const result = ruleSchema.safeParse(rule);
    const errors: ValidationError[] = [];

    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          field: issue.path.join('.') || 'rule',
          message: issue.message,
          code: 'SCHEMA_ERROR',
        });
      }
    }

    traverseConditions(rule.conditions, errors);

    if (errors.length === 0) {
      return { valid: true };
    }
    return { valid: false, errors };
  }

  validateCondition(condition: Condition): ValidationResult {
    const result = conditionSchema.safeParse(condition);
    const errors: ValidationError[] = [];

    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          field: issue.path.join('.') || 'condition',
          message: issue.message,
          code: 'SCHEMA_ERROR',
        });
      }
    }

    traverseConditions(condition, errors);

    if (errors.length === 0) {
      return { valid: true };
    }
    return { valid: false, errors };
  }

  validateAction(action: Rule['actions'][number]): ValidationResult {
    const result = actionSchema.safeParse(action);

    if (result.success) {
      return { valid: true };
    }

    const errors: ValidationError[] = result.error.issues.map((issue) => {
      return {
        field: issue.path.join('.') || 'action',
        message: issue.message,
        code: 'SCHEMA_ERROR',
      };
    });
    return { valid: false, errors };
  }
}

export default Validator;
