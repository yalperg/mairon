import { clearOperators, getOperator } from '../../../src/operators';
import { registerChangeOperators } from '../../../src/operators/change';
import { EvaluationContext } from '../../../src/core/types';

describe('change operators', () => {
  beforeEach(() => {
    clearOperators();
    registerChangeOperators();
  });

  describe('changed', () => {
    test('detects changes', () => {
      const changed = getOperator('changed')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        previousData: { status: 'inactive' },
        context: {},
      };

      expect(changed('active', { field: 'status', operator: 'changed' }, ctx)).toBe(true);
    });

    test('returns false when no change', () => {
      const changed = getOperator('changed')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        previousData: { status: 'active' },
        context: {},
      };

      expect(changed('active', { field: 'status', operator: 'changed' }, ctx)).toBe(false);
    });

    test('returns false without previousData', () => {
      const changed = getOperator('changed')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        context: {},
      };

      expect(changed('active', { field: 'status', operator: 'changed' }, ctx)).toBe(false);
    });
  });

  describe('changedFrom', () => {
    test('detects change from specific value', () => {
      const changedFrom = getOperator('changedFrom')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        previousData: { status: 'pending' },
        context: {},
      };

      expect(changedFrom('active', { field: 'status', operator: 'changedFrom', value: 'pending' }, ctx)).toBe(true);
    });

    test('returns false if not from specified value', () => {
      const changedFrom = getOperator('changedFrom')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        previousData: { status: 'inactive' },
        context: {},
      };

      expect(changedFrom('active', { field: 'status', operator: 'changedFrom', value: 'pending' }, ctx)).toBe(false);
    });

    test('returns false without previousData', () => {
      const changedFrom = getOperator('changedFrom')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        context: {},
      };

      expect(changedFrom('active', { field: 'status', operator: 'changedFrom', value: 'pending' }, ctx)).toBe(false);
    });
  });

  describe('changedTo', () => {
    test('detects change to specific value', () => {
      const changedTo = getOperator('changedTo')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        previousData: { status: 'pending' },
        context: {},
      };

      expect(changedTo('active', { field: 'status', operator: 'changedTo', value: 'active' }, ctx)).toBe(true);
    });

    test('returns false if not to specified value', () => {
      const changedTo = getOperator('changedTo')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        previousData: { status: 'pending' },
        context: {},
      };

      expect(changedTo('active', { field: 'status', operator: 'changedTo', value: 'inactive' }, ctx)).toBe(false);
    });

    test('returns false if no change', () => {
      const changedTo = getOperator('changedTo')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        previousData: { status: 'active' },
        context: {},
      };

      expect(changedTo('active', { field: 'status', operator: 'changedTo', value: 'active' }, ctx)).toBe(false);
    });

    test('returns false without previousData', () => {
      const changedTo = getOperator('changedTo')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        context: {},
      };

      expect(changedTo('active', { field: 'status', operator: 'changedTo', value: 'active' }, ctx)).toBe(false);
    });
  });

  describe('changedFromTo', () => {
    test('detects specific transition', () => {
      const changedFromTo = getOperator('changedFromTo')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        previousData: { status: 'pending' },
        context: {},
      };

      expect(changedFromTo('active', { field: 'status', operator: 'changedFromTo', from: 'pending', to: 'active' }, ctx)).toBe(true);
    });

    test('returns false for wrong transition', () => {
      const changedFromTo = getOperator('changedFromTo')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        previousData: { status: 'inactive' },
        context: {},
      };

      expect(changedFromTo('active', { field: 'status', operator: 'changedFromTo', from: 'pending', to: 'active' }, ctx)).toBe(false);
    });

    test('returns false without previousData', () => {
      const changedFromTo = getOperator('changedFromTo')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        context: {},
      };

      expect(changedFromTo('active', { field: 'status', operator: 'changedFromTo', from: 'pending', to: 'active' }, ctx)).toBe(false);
    });
  });

  describe('increased', () => {
    test('detects numeric increase', () => {
      const increased = getOperator('increased')!;
      const ctx: EvaluationContext = {
        data: { count: 10 },
        previousData: { count: 5 },
        context: {},
      };

      expect(increased(10, { field: 'count', operator: 'increased' }, ctx)).toBe(true);
    });

    test('returns false for decrease', () => {
      const increased = getOperator('increased')!;
      const ctx: EvaluationContext = {
        data: { count: 5 },
        previousData: { count: 10 },
        context: {},
      };

      expect(increased(5, { field: 'count', operator: 'increased' }, ctx)).toBe(false);
    });

    test('returns false for no change', () => {
      const increased = getOperator('increased')!;
      const ctx: EvaluationContext = {
        data: { count: 5 },
        previousData: { count: 5 },
        context: {},
      };

      expect(increased(5, { field: 'count', operator: 'increased' }, ctx)).toBe(false);
    });

    test('returns false for non-numeric values', () => {
      const increased = getOperator('increased')!;
      const ctx: EvaluationContext = {
        data: { value: 'high' },
        previousData: { value: 'low' },
        context: {},
      };

      expect(increased('high', { field: 'value', operator: 'increased' }, ctx)).toBe(false);
    });

    test('returns false without previousData', () => {
      const increased = getOperator('increased')!;
      const ctx: EvaluationContext = {
        data: { count: 10 },
        context: {},
      };

      expect(increased(10, { field: 'count', operator: 'increased' }, ctx)).toBe(false);
    });
  });

  describe('decreased', () => {
    test('detects numeric decrease', () => {
      const decreased = getOperator('decreased')!;
      const ctx: EvaluationContext = {
        data: { count: 5 },
        previousData: { count: 10 },
        context: {},
      };

      expect(decreased(5, { field: 'count', operator: 'decreased' }, ctx)).toBe(true);
    });

    test('returns false for increase', () => {
      const decreased = getOperator('decreased')!;
      const ctx: EvaluationContext = {
        data: { count: 10 },
        previousData: { count: 5 },
        context: {},
      };

      expect(decreased(10, { field: 'count', operator: 'decreased' }, ctx)).toBe(false);
    });

    test('returns false for no change', () => {
      const decreased = getOperator('decreased')!;
      const ctx: EvaluationContext = {
        data: { count: 5 },
        previousData: { count: 5 },
        context: {},
      };

      expect(decreased(5, { field: 'count', operator: 'decreased' }, ctx)).toBe(false);
    });

    test('returns false without previousData', () => {
      const decreased = getOperator('decreased')!;
      const ctx: EvaluationContext = {
        data: { count: 5 },
        context: {},
      };

      expect(decreased(5, { field: 'count', operator: 'decreased' }, ctx)).toBe(false);
    });
  });
});
