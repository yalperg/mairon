import { Mairon } from '@/core';

describe('Mairon Custom Operators', () => {
  let engine: Mairon;

  beforeEach(() => {
    engine = new Mairon();
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

  describe('operator aliases', () => {
    describe('registerAlias', () => {
      test('registers an alias for a built-in operator', () => {
        engine.registerAlias('eq', 'equals');
        expect(engine.hasAlias('eq')).toBe(true);
        expect(engine.getAlias('eq')).toBe('equals');
      });

      test('registers an alias for a custom operator', () => {
        engine.registerOperator('isEven', (v) => typeof v === 'number' && v % 2 === 0);
        engine.registerAlias('even', 'isEven');
        expect(engine.hasAlias('even')).toBe(true);
        expect(engine.getAlias('even')).toBe('isEven');
      });

      test('throws on empty alias name', () => {
        expect(() => engine.registerAlias('', 'equals')).toThrow(
          'Alias must be a non-empty string',
        );
      });

      test('throws on empty target name', () => {
        expect(() => engine.registerAlias('eq', '')).toThrow(
          'Target operator must be a non-empty string',
        );
      });

      test('throws when target operator does not exist', () => {
        expect(() => engine.registerAlias('alias', 'nonexistent')).toThrow(
          'Target operator does not exist: nonexistent',
        );
      });
    });

    describe('unregisterAlias', () => {
      test('removes an alias', () => {
        engine.registerAlias('eq', 'equals');
        expect(engine.unregisterAlias('eq')).toBe(true);
        expect(engine.hasAlias('eq')).toBe(false);
      });

      test('returns false for non-existent alias', () => {
        expect(engine.unregisterAlias('nonexistent')).toBe(false);
      });
    });

    describe('hasAlias', () => {
      test('returns true for registered alias', () => {
        engine.registerAlias('eq', 'equals');
        expect(engine.hasAlias('eq')).toBe(true);
      });

      test('returns false for non-existent alias', () => {
        expect(engine.hasAlias('nonexistent')).toBe(false);
      });
    });

    describe('getAlias', () => {
      test('returns target for registered alias', () => {
        engine.registerAlias('eq', 'equals');
        expect(engine.getAlias('eq')).toBe('equals');
      });

      test('returns undefined for non-existent alias', () => {
        expect(engine.getAlias('nonexistent')).toBeUndefined();
      });
    });

    describe('getAliases', () => {
      test('returns all registered aliases', () => {
        engine.registerAlias('eq', 'equals');
        engine.registerAlias('gt', 'greaterThan');
        const aliases = engine.getAliases();
        expect(aliases).toEqual({ eq: 'equals', gt: 'greaterThan' });
      });

      test('returns empty object when no aliases', () => {
        expect(engine.getAliases()).toEqual({});
      });
    });

    describe('clearAliases', () => {
      test('removes all aliases', () => {
        engine.registerAlias('eq', 'equals');
        engine.registerAlias('gt', 'greaterThan');
        engine.clearAliases();
        expect(engine.getAliases()).toEqual({});
      });
    });

    describe('alias resolution in evaluation', () => {
      test('evaluates condition using alias', async () => {
        engine.registerAlias('eq', 'equals');
        engine.registerHandler('action', () => {});
        engine.addRule({
          id: 'alias-test',
          name: 'Alias Test',
          conditions: { field: 'status', operator: 'eq', value: 'active' },
          actions: [{ type: 'action' }],
        });

        const results = await engine.evaluate({ data: { status: 'active' } });
        expect(results[0].matched).toBe(true);

        const results2 = await engine.evaluate({ data: { status: 'inactive' } });
        expect(results2[0].matched).toBe(false);
      });

      test('evaluates custom operator via alias', async () => {
        engine.registerOperator(
          'isEven',
          (v) => typeof v === 'number' && v % 2 === 0,
        );
        engine.registerAlias('even', 'isEven');
        engine.registerHandler('action', () => {});
        engine.addRule({
          id: 'custom-alias-test',
          name: 'Custom Alias Test',
          conditions: { field: 'count', operator: 'even' },
          actions: [{ type: 'action' }],
        });

        const results = await engine.evaluate({ data: { count: 4 } });
        expect(results[0].matched).toBe(true);

        const results2 = await engine.evaluate({ data: { count: 3 } });
        expect(results2[0].matched).toBe(false);
      });

      test('hasOperator returns true for aliases', () => {
        engine.registerAlias('eq', 'equals');
        expect(engine.hasOperator('eq')).toBe(true);
      });
    });

    describe('alias isolation', () => {
      test('aliases are isolated per instance', () => {
        const engine1 = new Mairon();
        const engine2 = new Mairon();

        engine1.registerAlias('eq', 'equals');

        expect(engine1.hasAlias('eq')).toBe(true);
        expect(engine2.hasAlias('eq')).toBe(false);
      });
    });
  });

  describe('instance isolation', () => {
    test('custom operators are isolated per instance', () => {
      const engine1 = new Mairon();
      const engine2 = new Mairon();

      engine1.registerOperator('customOp', () => true);

      expect(engine1.hasOperator('customOp')).toBe(true);
      expect(engine2.hasOperator('customOp')).toBe(false);
    });

    test('each instance has independent built-in operators', () => {
      const engine1 = new Mairon();
      const engine2 = new Mairon();

      expect(engine1.hasOperator('equals')).toBe(true);
      expect(engine2.hasOperator('equals')).toBe(true);
    });

    test('clearing custom operators in one instance does not affect another', () => {
      const engine1 = new Mairon();
      const engine2 = new Mairon();

      engine1.registerOperator('op1', () => true);
      engine2.registerOperator('op2', () => true);

      engine1.clearCustomOperators();

      expect(engine1.hasOperator('op1')).toBe(false);
      expect(engine2.hasOperator('op2')).toBe(true);
    });
  });
});
