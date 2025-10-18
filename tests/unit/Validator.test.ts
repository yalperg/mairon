import { Validator } from '../../src/utils/Validator';
import { Rule } from '../../src/core/types';

describe('Validator', () => {
  const validator = new Validator();

  it('validates a correct simple rule', () => {
    const rule: Rule = {
      id: 'rule-1',
      name: 'Simple equals',
      conditions: { field: 'status', operator: 'equals', value: 'done' },
      actions: [{ type: 'notify' }],
    };

    const res = validator.validate(rule);
    expect(res.valid).toBe(true);
    expect(res.errors).toBeUndefined();
  });

  it('fails for missing id', () => {
    const rule = {
      // id missing
      name: 'Invalid',
      conditions: { field: 'status', operator: 'equals', value: 'done' },
      actions: [{ type: 'notify' }],
    } as unknown as Rule;

    const res = validator.validate(rule);
    expect(res.valid).toBe(false);
    expect(res.errors?.some(e => e.field.includes('id'))).toBe(true);
  });

  it('fails between without array', () => {
    const rule: Rule = {
      id: 'rule-2',
      name: 'Between invalid',
      conditions: { field: 'age', operator: 'between', value: 18 as unknown },
      actions: [{ type: 'notify' }],
    };

    const res = validator.validate(rule);
    expect(res.valid).toBe(false);
    expect(res.errors?.some(e => e.code === 'BETWEEN_VALUE_INVALID')).toBe(true);
  });

  it('fails changedFromTo without from/to', () => {
    const rule: Rule = {
      id: 'rule-3',
      name: 'Change invalid',
      conditions: { field: 'status', operator: 'changedFromTo' },
      actions: [{ type: 'notify' }],
    } as unknown as Rule;

    const res = validator.validate(rule);
    expect(res.valid).toBe(false);
    expect(res.errors?.some(e => e.code === 'CHANGED_FROM_TO_REQUIRED')).toBe(true);
  });

  it('requires array value for includesAll', () => {
    const rule: Rule = {
      id: 'rule-4',
      name: 'Array value required',
      conditions: { field: 'tags', operator: 'includesAll', value: 'x' as unknown },
      actions: [{ type: 'notify' }],
    };

    const res = validator.validate(rule);
    expect(res.valid).toBe(false);
    expect(res.errors?.some(e => e.code === 'ARRAY_VALUE_REQUIRED')).toBe(true);
  });

  it('validates logical group with all/any', () => {
    const rule: Rule = {
      id: 'rule-5',
      name: 'Logical group',
      conditions: {
        all: [
          { field: 'status', operator: 'equals', value: 'done' },
          { any: [
            { field: 'priority', operator: 'in', value: ['high', 'critical'] },
            { field: 'assignee', operator: 'exists' },
          ] },
        ],
      },
      actions: [{ type: 'notify' }],
    };

    const res = validator.validate(rule);
    expect(res.valid).toBe(true);
  });
});
