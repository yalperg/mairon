import { Mairon } from '@/core';

function makeEngine() {
  const engine = new Mairon({ strict: false, enableIndexing: false });
  engine.registerHandler('collect', (_ctx, params) => params);
  return engine;
}

describe('Mairon', () => {
  describe('rule evaluation', () => {
    test('evaluates and executes actions for matched rules', async () => {
      const engine = makeEngine();
      engine.addRule({
        id: 'r1',
        name: 'R1',
        conditions: { field: 'x', operator: 'greaterThan', value: 1 },
        actions: [{ type: 'collect', params: { y: '{{ data.x }}' } }],
      });

      const results = await engine.evaluate({ data: { x: 2 }, context: {} });
      expect(results.length).toBe(1);
      expect(results[0].matched).toBe(true);
      expect(results[0].actionsExecuted).toEqual(['collect']);
      expect(results[0].actionResults![0].result).toEqual({ y: 2 });
    });

    test('skips when conditions fail', async () => {
      const engine = makeEngine();
      engine.addRule({
        id: 'r2',
        name: 'R2',
        conditions: { field: 'x', operator: 'greaterThan', value: 10 },
        actions: [{ type: 'collect' }],
      });

      const results = await engine.evaluate({ data: { x: 2 }, context: {} });
      expect(results[0].matched).toBe(false);
      expect(results[0].skipped).toBe(true);
    });
  });

  describe('Mairon events', () => {
    test('emits beforeEvaluate and afterEvaluate', async () => {
      const engine = new Mairon();
      const events: string[] = [];
      engine.on('beforeEvaluate', () => events.push('before'));
      engine.on('afterEvaluate', () => events.push('after'));
      engine.registerHandler('action', () => {});
      engine.addRule({
        id: 'r',
        name: 'R',
        conditions: { field: 'a', operator: 'exists' },
        actions: [{ type: 'action' }],
      });
      await engine.evaluate({ data: { a: 1 }, context: {} });
      expect(events).toEqual(['before', 'after']);
    });

    test('emits actionFailed when handler throws in strict mode', async () => {
      const engine = new Mairon({ strict: true });
      engine.registerHandler('boom', () => {
        throw new Error('x');
      });
      const seen: string[] = [];
      engine.on('actionFailed', () => seen.push('failed'));
      engine.addRule({
        id: 'r',
        name: 'R',
        conditions: { field: 'a', operator: 'exists' },
        actions: [{ type: 'boom' }],
      });
      const res = await engine.evaluate({ data: { a: 1 }, context: {} });
      expect(seen).toContain('failed');
      expect(res[0].actionResults?.[0].success).toBe(false);
    });
  });

  describe('explain', () => {
    test('explains rule that matches', () => {
      const engine = new Mairon();
      engine.addRule({
        id: 'r1',
        name: 'Rule 1',
        conditions: { field: 'age', operator: 'greaterThan', value: 18 },
        actions: [{ type: 'noop' }],
      });

      const explanations = engine.explain({ data: { age: 25 } });
      expect(explanations).toHaveLength(1);
      expect(explanations[0].ruleId).toBe('r1');
      expect(explanations[0].ruleName).toBe('Rule 1');
      expect(explanations[0].matched).toBe(true);
      expect(explanations[0].explanation.passed).toBe(true);
    });

    test('explains rule that does not match', () => {
      const engine = new Mairon();
      engine.addRule({
        id: 'r1',
        name: 'Rule 1',
        conditions: { field: 'age', operator: 'greaterThan', value: 18 },
        actions: [{ type: 'noop' }],
      });

      const explanations = engine.explain({ data: { age: 16 } });
      expect(explanations[0].matched).toBe(false);
      expect(explanations[0].explanation.passed).toBe(false);

      const exp = explanations[0].explanation;
      if (exp.type === 'simple') {
        expect(exp.actual).toBe(16);
        expect(exp.expected).toBe(18);
      }
    });

    test('explains multiple rules', () => {
      const engine = new Mairon();
      engine.addRule({
        id: 'r1',
        name: 'Age Check',
        conditions: { field: 'age', operator: 'greaterThan', value: 18 },
        actions: [{ type: 'noop' }],
      });
      engine.addRule({
        id: 'r2',
        name: 'Premium Check',
        conditions: { field: 'isPremium', operator: 'equals', value: true },
        actions: [{ type: 'noop' }],
      });

      const explanations = engine.explain({ data: { age: 25, isPremium: false } });
      expect(explanations).toHaveLength(2);
      expect(explanations.find((e) => e.ruleId === 'r1')?.matched).toBe(true);
      expect(explanations.find((e) => e.ruleId === 'r2')?.matched).toBe(false);
    });

    test('explains complex nested conditions', () => {
      const engine = new Mairon();
      engine.addRule({
        id: 'r1',
        name: 'Complex Rule',
        conditions: {
          all: [
            { field: 'age', operator: 'greaterThan', value: 18 },
            {
              any: [
                { field: 'role', operator: 'equals', value: 'admin' },
                { field: 'role', operator: 'equals', value: 'manager' },
              ],
            },
          ],
        },
        actions: [{ type: 'noop' }],
      });

      const explanations = engine.explain({
        data: { age: 25, role: 'user' },
      });

      expect(explanations[0].matched).toBe(false);
      const exp = explanations[0].explanation;
      expect(exp.type).toBe('all');
      if ('children' in exp) {
        expect(exp.children[0].passed).toBe(true);
        expect(exp.children[1].passed).toBe(false);
      }
    });

    test('does not execute actions', () => {
      const engine = new Mairon();
      let actionCalled = false;
      engine.registerHandler('test', () => {
        actionCalled = true;
      });
      engine.addRule({
        id: 'r1',
        name: 'Rule 1',
        conditions: { field: 'x', operator: 'exists' },
        actions: [{ type: 'test' }],
      });

      engine.explain({ data: { x: 1 } });
      expect(actionCalled).toBe(false);
    });

    test('respects rule filter', () => {
      const engine = new Mairon();
      engine.addRule({
        id: 'r1',
        name: 'Enabled Rule',
        enabled: true,
        conditions: { field: 'x', operator: 'exists' },
        actions: [{ type: 'noop' }],
      });
      engine.addRule({
        id: 'r2',
        name: 'Disabled Rule',
        enabled: false,
        conditions: { field: 'x', operator: 'exists' },
        actions: [{ type: 'noop' }],
      });

      const explanations = engine.explain({ data: { x: 1 } });
      expect(explanations).toHaveLength(1);
      expect(explanations[0].ruleId).toBe('r1');
    });
  });
});
