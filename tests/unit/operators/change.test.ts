import { operators } from '@/core';

import type { EvaluationContext } from '@/types';

describe('change operators', () => {
  describe('changed', () => {
    test('detects changes', () => {
      const changed = operators.get('changed')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        previousData: { status: 'inactive' },
        context: {},
      };

      expect(
        changed.evaluate(
          'active',
          { field: 'status', operator: 'changed' },
          ctx,
        ),
      ).toBe(true);
    });

    test('returns false when no change', () => {
      const changed = operators.get('changed')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        previousData: { status: 'active' },
        context: {},
      };

      expect(
        changed.evaluate(
          'active',
          { field: 'status', operator: 'changed' },
          ctx,
        ),
      ).toBe(false);
    });

    test('returns false without previousData', () => {
      const changed = operators.get('changed')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        context: {},
      };

      expect(
        changed.evaluate(
          'active',
          { field: 'status', operator: 'changed' },
          ctx,
        ),
      ).toBe(false);
    });
  });

  describe('changedFrom', () => {
    test('detects change from specific value', () => {
      const changedFrom = operators.get('changedFrom')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        previousData: { status: 'pending' },
        context: {},
      };

      expect(
        changedFrom.evaluate(
          'active',
          { field: 'status', operator: 'changedFrom', value: 'pending' },
          ctx,
        ),
      ).toBe(true);
    });

    test('returns false if not from specified value', () => {
      const changedFrom = operators.get('changedFrom')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        previousData: { status: 'inactive' },
        context: {},
      };

      expect(
        changedFrom.evaluate(
          'active',
          { field: 'status', operator: 'changedFrom', value: 'pending' },
          ctx,
        ),
      ).toBe(false);
    });

    test('returns false without previousData', () => {
      const changedFrom = operators.get('changedFrom')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        context: {},
      };

      expect(
        changedFrom.evaluate(
          'active',
          { field: 'status', operator: 'changedFrom', value: 'pending' },
          ctx,
        ),
      ).toBe(false);
    });
  });

  describe('changedTo', () => {
    test('detects change to specific value', () => {
      const changedTo = operators.get('changedTo')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        previousData: { status: 'pending' },
        context: {},
      };

      expect(
        changedTo.evaluate(
          'active',
          { field: 'status', operator: 'changedTo', value: 'active' },
          ctx,
        ),
      ).toBe(true);
    });

    test('returns false if not to specified value', () => {
      const changedTo = operators.get('changedTo')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        previousData: { status: 'pending' },
        context: {},
      };

      expect(
        changedTo.evaluate(
          'active',
          { field: 'status', operator: 'changedTo', value: 'inactive' },
          ctx,
        ),
      ).toBe(false);
    });

    test('returns false if no change', () => {
      const changedTo = operators.get('changedTo')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        previousData: { status: 'active' },
        context: {},
      };

      expect(
        changedTo.evaluate(
          'active',
          { field: 'status', operator: 'changedTo', value: 'active' },
          ctx,
        ),
      ).toBe(false);
    });

    test('returns false without previousData', () => {
      const changedTo = operators.get('changedTo')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        context: {},
      };

      expect(
        changedTo.evaluate(
          'active',
          { field: 'status', operator: 'changedTo', value: 'active' },
          ctx,
        ),
      ).toBe(false);
    });
  });

  describe('changedFromTo', () => {
    test('detects specific transition', () => {
      const changedFromTo = operators.get('changedFromTo')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        previousData: { status: 'pending' },
        context: {},
      };

      expect(
        changedFromTo.evaluate(
          'active',
          {
            field: 'status',
            operator: 'changedFromTo',
            from: 'pending',
            to: 'active',
          },
          ctx,
        ),
      ).toBe(true);
    });

    test('returns false for wrong transition', () => {
      const changedFromTo = operators.get('changedFromTo')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        previousData: { status: 'inactive' },
        context: {},
      };

      expect(
        changedFromTo.evaluate(
          'active',
          {
            field: 'status',
            operator: 'changedFromTo',
            from: 'pending',
            to: 'active',
          },
          ctx,
        ),
      ).toBe(false);
    });

    test('returns false without previousData', () => {
      const changedFromTo = operators.get('changedFromTo')!;
      const ctx: EvaluationContext = {
        data: { status: 'active' },
        context: {},
      };

      expect(
        changedFromTo.evaluate(
          'active',
          {
            field: 'status',
            operator: 'changedFromTo',
            from: 'pending',
            to: 'active',
          },
          ctx,
        ),
      ).toBe(false);
    });
  });

  describe('increased', () => {
    test('detects numeric increase', () => {
      const increased = operators.get('increased')!;
      const ctx: EvaluationContext = {
        data: { count: 10 },
        previousData: { count: 5 },
        context: {},
      };

      expect(
        increased.evaluate(10, { field: 'count', operator: 'increased' }, ctx),
      ).toBe(true);
    });

    test('returns false for decrease', () => {
      const increased = operators.get('increased')!;
      const ctx: EvaluationContext = {
        data: { count: 5 },
        previousData: { count: 10 },
        context: {},
      };

      expect(
        increased.evaluate(5, { field: 'count', operator: 'increased' }, ctx),
      ).toBe(false);
    });

    test('returns false for no change', () => {
      const increased = operators.get('increased')!;
      const ctx: EvaluationContext = {
        data: { count: 5 },
        previousData: { count: 5 },
        context: {},
      };

      expect(
        increased.evaluate(5, { field: 'count', operator: 'increased' }, ctx),
      ).toBe(false);
    });

    test('returns false for non-numeric values', () => {
      const increased = operators.get('increased')!;
      const ctx: EvaluationContext = {
        data: { value: 'high' },
        previousData: { value: 'low' },
        context: {},
      };

      expect(
        increased.evaluate(
          'high',
          { field: 'value', operator: 'increased' },
          ctx,
        ),
      ).toBe(false);
    });

    test('returns false without previousData', () => {
      const increased = operators.get('increased')!;
      const ctx: EvaluationContext = {
        data: { count: 10 },
        context: {},
      };

      expect(
        increased.evaluate(10, { field: 'count', operator: 'increased' }, ctx),
      ).toBe(false);
    });
  });

  describe('decreased', () => {
    test('detects numeric decrease', () => {
      const decreased = operators.get('decreased')!;
      const ctx: EvaluationContext = {
        data: { count: 5 },
        previousData: { count: 10 },
        context: {},
      };

      expect(
        decreased.evaluate(5, { field: 'count', operator: 'decreased' }, ctx),
      ).toBe(true);
    });

    test('returns false for increase', () => {
      const decreased = operators.get('decreased')!;
      const ctx: EvaluationContext = {
        data: { count: 10 },
        previousData: { count: 5 },
        context: {},
      };

      expect(
        decreased.evaluate(10, { field: 'count', operator: 'decreased' }, ctx),
      ).toBe(false);
    });

    test('returns false for no change', () => {
      const decreased = operators.get('decreased')!;
      const ctx: EvaluationContext = {
        data: { count: 5 },
        previousData: { count: 5 },
        context: {},
      };

      expect(
        decreased.evaluate(5, { field: 'count', operator: 'decreased' }, ctx),
      ).toBe(false);
    });

    test('returns false without previousData', () => {
      const decreased = operators.get('decreased')!;
      const ctx: EvaluationContext = {
        data: { count: 5 },
        context: {},
      };

      expect(
        decreased.evaluate(5, { field: 'count', operator: 'decreased' }, ctx),
      ).toBe(false);
    });
  });
});
