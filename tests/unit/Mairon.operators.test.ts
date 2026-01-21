import { Mairon, operators } from '@/core';

describe('Mairon Custom Operators', () => {
  let engine: Mairon;

  beforeEach(() => {
    engine = new Mairon();
    operators.reset();
  });

  afterEach(() => {
    operators.reset();
  });

  describe('registerOperator', () => {
    test('registers a custom operator', () => {
      engine.registerOperator(
        'isEven',
        (value) => typeof value === 'number' && value % 2 === 0,
      );
      expect(engine.hasOperator('isEven')).toBe(true);
      expect(engine.getCustomOperators()).toContain('isEven');
    });

    test('throws on empty name', () => {
      expect(() => engine.registerOperator('', () => true)).toThrow(
        'Operator name must be a non-empty string',
      );
    });

    test('throws on non-function', () => {
      expect(() =>
        engine.registerOperator('bad', 'not a function' as unknown as () => boolean),
      ).toThrow('Operator function must be a function');
    });

    test('throws when overriding built-in', () => {
      expect(() => engine.registerOperator('equals', () => true)).toThrow(
        'Cannot override built-in operator: equals',
      );
    });

    test('allows replacing custom operators', () => {
      engine.registerOperator('custom', () => false);
      engine.registerOperator('custom', () => true);
      expect(engine.hasOperator('custom')).toBe(true);
    });
  });

  describe('registerOperators', () => {
    test('batch registers operators with functions', () => {
      engine.registerOperators({
        isPositive: (value) => typeof value === 'number' && value > 0,
        isNegative: (value) => typeof value === 'number' && value < 0,
      });
      expect(engine.hasOperator('isPositive')).toBe(true);
      expect(engine.hasOperator('isNegative')).toBe(true);
    });

    test('batch registers operators with options', () => {
      engine.registerOperators({
        divisibleBy: {
          fn: (value, condition) =>
            typeof value === 'number' &&
            typeof condition.value === 'number' &&
            value % condition.value === 0,
          options: {
            description: 'Check divisibility',
            requiresValue: true,
          },
        },
      });
      expect(engine.hasOperator('divisibleBy')).toBe(true);
    });
  });

  describe('unregisterOperator', () => {
    test('removes custom operator', () => {
      engine.registerOperator('custom', () => true);
      expect(engine.unregisterOperator('custom')).toBe(true);
      expect(engine.hasOperator('custom')).toBe(false);
    });

    test('returns false for built-in operators', () => {
      expect(engine.unregisterOperator('equals')).toBe(false);
      expect(engine.hasOperator('equals')).toBe(true);
    });

    test('returns false for non-existent operators', () => {
      expect(engine.unregisterOperator('nonexistent')).toBe(false);
    });
  });

  describe('hasOperator', () => {
    test('returns true for built-in operators', () => {
      expect(engine.hasOperator('equals')).toBe(true);
      expect(engine.hasOperator('contains')).toBe(true);
    });

    test('returns true for custom operators', () => {
      engine.registerOperator('custom', () => true);
      expect(engine.hasOperator('custom')).toBe(true);
    });

    test('returns false for non-existent operators', () => {
      expect(engine.hasOperator('nonexistent')).toBe(false);
    });
  });

  describe('getRegisteredOperators', () => {
    test('includes built-in operators', () => {
      const ops = engine.getRegisteredOperators();
      expect(ops).toContain('equals');
      expect(ops).toContain('greaterThan');
      expect(ops).toContain('contains');
    });

    test('includes custom operators', () => {
      engine.registerOperator('custom', () => true);
      const ops = engine.getRegisteredOperators();
      expect(ops).toContain('custom');
    });
  });

  describe('getCustomOperators', () => {
    test('returns empty array when no custom operators', () => {
      expect(engine.getCustomOperators()).toEqual([]);
    });

    test('returns only custom operators', () => {
      engine.registerOperator('custom1', () => true);
      engine.registerOperator('custom2', () => true);
      const customOps = engine.getCustomOperators();
      expect(customOps).toContain('custom1');
      expect(customOps).toContain('custom2');
      expect(customOps).not.toContain('equals');
    });
  });

  describe('clearCustomOperators', () => {
    test('removes all custom operators', () => {
      engine.registerOperator('custom1', () => true);
      engine.registerOperator('custom2', () => true);
      engine.clearCustomOperators();
      expect(engine.getCustomOperators()).toEqual([]);
    });

    test('keeps built-in operators', () => {
      engine.registerOperator('custom', () => true);
      engine.clearCustomOperators();
      expect(engine.hasOperator('equals')).toBe(true);
      expect(engine.hasOperator('greaterThan')).toBe(true);
    });
  });

  describe('custom operator evaluation', () => {
    test('evaluates rule with custom operator', async () => {
      engine.registerOperator(
        'isEven',
        (value) => typeof value === 'number' && value % 2 === 0,
      );
      engine.registerHandler('log', () => {});
      engine.addRule({
        id: 'even-check',
        name: 'Even Check',
        conditions: { field: 'count', operator: 'isEven' },
        actions: [{ type: 'log' }],
      });

      const results = await engine.evaluate({ data: { count: 4 } });
      expect(results[0].matched).toBe(true);

      const results2 = await engine.evaluate({ data: { count: 3 } });
      expect(results2[0].matched).toBe(false);
    });

    test('custom operator receives condition value', async () => {
      engine.registerOperator(
        'divisibleBy',
        (value, condition) =>
          typeof value === 'number' &&
          typeof condition.value === 'number' &&
          value % condition.value === 0,
      );
      engine.registerHandler('action', () => {});
      engine.addRule({
        id: 'div-check',
        name: 'Divisibility Check',
        conditions: { field: 'num', operator: 'divisibleBy', value: 3 },
        actions: [{ type: 'action' }],
      });

      const results = await engine.evaluate({ data: { num: 9 } });
      expect(results[0].matched).toBe(true);

      const results2 = await engine.evaluate({ data: { num: 10 } });
      expect(results2[0].matched).toBe(false);
    });

    test('custom operator receives evaluation context', async () => {
      engine.registerOperator('contextCheck', (_value, _condition, context) => {
        return context.context?.checkEnabled === true;
      });
      engine.registerHandler('action', () => {});
      engine.addRule({
        id: 'ctx-check',
        name: 'Context Check',
        conditions: { field: 'any', operator: 'contextCheck' },
        actions: [{ type: 'action' }],
      });

      const results = await engine.evaluate({
        data: { any: 1 },
        context: { checkEnabled: true },
      });
      expect(results[0].matched).toBe(true);

      const results2 = await engine.evaluate({
        data: { any: 1 },
        context: { checkEnabled: false },
      });
      expect(results2[0].matched).toBe(false);
    });

    test('rule with unknown operator does not match', async () => {
      engine.registerHandler('action', () => {});
      engine.addRule({
        id: 'unknown-op',
        name: 'Unknown Op',
        conditions: { field: 'x', operator: 'unknownOperator' },
        actions: [{ type: 'action' }],
      });

      const results = await engine.evaluate({ data: { x: 1 } });
      expect(results[0].matched).toBe(false);
    });
  });
});
