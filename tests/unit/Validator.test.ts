import { Validator } from '@/utils';
import type { Rule } from '@/types';

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
    expect(res.errors?.some((e) => e.field.includes('id'))).toBe(true);
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
    expect(res.errors?.some((e) => e.code === 'BETWEEN_VALUE_INVALID')).toBe(
      true,
    );
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
    expect(res.errors?.some((e) => e.code === 'CHANGED_FROM_TO_REQUIRED')).toBe(
      true,
    );
  });

  it('requires array value for includesAll', () => {
    const rule: Rule = {
      id: 'rule-4',
      name: 'Array value required',
      conditions: {
        field: 'tags',
        operator: 'includesAll',
        value: 'x' as unknown,
      },
      actions: [{ type: 'notify' }],
    };

    const res = validator.validate(rule);
    expect(res.valid).toBe(false);
    expect(res.errors?.some((e) => e.code === 'ARRAY_VALUE_REQUIRED')).toBe(
      true,
    );
  });

  it('validates logical group with all/any', () => {
    const rule: Rule = {
      id: 'rule-5',
      name: 'Logical group',
      conditions: {
        all: [
          { field: 'status', operator: 'equals', value: 'done' },
          {
            any: [
              {
                field: 'priority',
                operator: 'in',
                value: ['high', 'critical'],
              },
              { field: 'assignee', operator: 'exists' },
            ],
          },
        ],
      },
      actions: [{ type: 'notify' }],
    };

    const res = validator.validate(rule);
    expect(res.valid).toBe(true);
  });

  it('fails when actions array is missing', () => {
    const rule = {
      id: 'r-missing-actions',
      name: 'No actions',
      conditions: { field: 'a', operator: 'exists' },
    } as unknown as Rule;
    const res = validator.validate(rule);
    expect(res.valid).toBe(false);
  });

  it('fails on unknown operator', () => {
    const rule = {
      id: 'r-unknown-op',
      name: 'Unknown op',
      conditions: { field: 'a', operator: '___unknown___', value: 1 },
      actions: [{ type: 'notify' }],
    } as unknown as Rule;
    const res = validator.validate(rule);
    expect(res.valid).toBe(false);
  });

  it('fails logical group with empty any', () => {
    const rule = {
      id: 'r-empty-any',
      name: 'Empty any',
      conditions: { any: [] },
      actions: [{ type: 'notify' }],
    } as unknown as Rule;
    const res = validator.validate(rule);
    expect(res.valid).toBe(false);
  });

  it('validateCondition: simple valid condition', () => {
    const res = validator.validateCondition({ field: 'a', operator: 'exists' });
    expect(res.valid).toBe(true);
  });

  it('validateCondition: array operator requires array (matchesAny)', () => {
    const res = validator.validateCondition({
      field: 's',
      operator: 'matchesAny',
      value: 'x' as unknown,
    });
    expect(res.valid).toBe(false);
    expect(res.errors?.some((e) => e.code === 'ARRAY_VALUE_REQUIRED')).toBe(
      true,
    );
  });

  it('validateCondition: any group empty should fail', () => {
    const invalidGroup = { any: [] } as unknown;
    const res = validator.validateCondition(invalidGroup as never);
    expect(res.valid).toBe(false);
  });

  it('validateAction: valid action passes', () => {
    const res = validator.validateAction({
      type: 'notify',
      params: { a: 1 },
      continueOnError: true,
      timeout: 10,
    });
    expect(res.valid).toBe(true);
  });

  it('validateAction: missing type fails', () => {
    const res = validator.validateAction({} as unknown as { type: string });
    expect(res.valid).toBe(false);
  });
});
