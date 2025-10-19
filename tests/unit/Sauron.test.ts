import { Sauron } from '@/core';

function makeEngine() {
  const engine = new Sauron({ strict: false, enableIndexing: false });
  engine.registerHandler('collect', (_ctx, params) => params);
  return engine;
}

describe('Sauron', () => {
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

  describe('Sauron events', () => {
    test('emits beforeEvaluate and afterEvaluate', async () => {
      const engine = new Sauron();
      const events: string[] = [];
      engine.on('beforeEvaluate', () => events.push('before'));
      engine.on('afterEvaluate', () => events.push('after'));
      engine.addRule({
        id: 'r',
        name: 'R',
        conditions: { field: 'a', operator: 'exists' },
        actions: [],
      });
      await engine.evaluate({ data: { a: 1 }, context: {} });
      expect(events).toEqual(['before', 'after']);
    });

    test('emits actionFailed when handler throws in strict mode', async () => {
      const engine = new Sauron({ strict: true });
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
});
