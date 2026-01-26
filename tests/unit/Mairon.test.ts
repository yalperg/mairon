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
    test('explains rule that matches', async () => {
      const engine = new Mairon();
      engine.addRule({
        id: 'r1',
        name: 'Rule 1',
        conditions: { field: 'age', operator: 'greaterThan', value: 18 },
        actions: [{ type: 'noop' }],
      });

      const explanations = await engine.explain({ data: { age: 25 } });
      expect(explanations).toHaveLength(1);
      expect(explanations[0].ruleId).toBe('r1');
      expect(explanations[0].ruleName).toBe('Rule 1');
      expect(explanations[0].matched).toBe(true);
      expect(explanations[0].explanation.passed).toBe(true);
    });

    test('explains rule that does not match', async () => {
      const engine = new Mairon();
      engine.addRule({
        id: 'r1',
        name: 'Rule 1',
        conditions: { field: 'age', operator: 'greaterThan', value: 18 },
        actions: [{ type: 'noop' }],
      });

      const explanations = await engine.explain({ data: { age: 16 } });
      expect(explanations[0].matched).toBe(false);
      expect(explanations[0].explanation.passed).toBe(false);

      const exp = explanations[0].explanation;
      if (exp.type === 'simple') {
        expect(exp.actual).toBe(16);
        expect(exp.expected).toBe(18);
      }
    });

    test('explains multiple rules', async () => {
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

      const explanations = await engine.explain({
        data: { age: 25, isPremium: false },
      });
      expect(explanations).toHaveLength(2);
      expect(explanations.find((e) => e.ruleId === 'r1')?.matched).toBe(true);
      expect(explanations.find((e) => e.ruleId === 'r2')?.matched).toBe(false);
    });

    test('explains complex nested conditions', async () => {
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

      const explanations = await engine.explain({
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

    test('does not execute actions', async () => {
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

      await engine.explain({ data: { x: 1 } });
      expect(actionCalled).toBe(false);
    });

    test('respects rule filter', async () => {
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

      const explanations = await engine.explain({ data: { x: 1 } });
      expect(explanations).toHaveLength(1);
      expect(explanations[0].ruleId).toBe('r1');
    });
  });

  describe('serialization', () => {
    describe('exportRules', () => {
      test('exports all rules', () => {
        const engine = new Mairon();
        engine.addRule({
          id: 'r1',
          name: 'Rule 1',
          conditions: { field: 'x', operator: 'exists' },
          actions: [{ type: 'action' }],
        });
        engine.addRule({
          id: 'r2',
          name: 'Rule 2',
          conditions: { field: 'y', operator: 'exists' },
          actions: [{ type: 'action' }],
        });

        const exported = engine.exportRules();
        expect(exported).toHaveLength(2);
        expect(exported.map((r) => r.id)).toEqual(['r1', 'r2']);
      });

      test('exported rules are JSON serializable', () => {
        const engine = new Mairon();
        engine.addRule({
          id: 'r1',
          name: 'Rule 1',
          conditions: { field: 'x', operator: 'greaterThan', value: 10 },
          actions: [{ type: 'action', params: { key: 'value' } }],
          metadata: { author: 'test' },
        });

        const exported = engine.exportRules();
        const json = JSON.stringify(exported);
        const parsed = JSON.parse(json);
        expect(parsed).toEqual(exported);
      });
    });

    describe('importRules', () => {
      test('imports rules (merge mode)', () => {
        const engine = new Mairon();
        engine.addRule({
          id: 'existing',
          name: 'Existing',
          conditions: { field: 'x', operator: 'exists' },
          actions: [{ type: 'action' }],
        });

        engine.importRules([
          {
            id: 'new',
            name: 'New',
            conditions: { field: 'y', operator: 'exists' },
            actions: [{ type: 'action' }],
          },
        ]);

        expect(engine.getRules()).toHaveLength(2);
      });

      test('imports rules (replace mode)', () => {
        const engine = new Mairon();
        engine.addRule({
          id: 'existing',
          name: 'Existing',
          conditions: { field: 'x', operator: 'exists' },
          actions: [{ type: 'action' }],
        });

        engine.importRules(
          [
            {
              id: 'new',
              name: 'New',
              conditions: { field: 'y', operator: 'exists' },
              actions: [{ type: 'action' }],
            },
          ],
          { replace: true },
        );

        expect(engine.getRules()).toHaveLength(1);
        expect(engine.getRules()[0].id).toBe('new');
      });
    });

    describe('toJSON', () => {
      test('exports full engine state', () => {
        const engine = new Mairon({ strict: true, maxRulesPerExecution: 50 });
        engine.addRule({
          id: 'r1',
          name: 'Rule 1',
          conditions: { field: 'x', operator: 'exists' },
          actions: [{ type: 'action' }],
        });
        engine.registerAlias('eq', 'equals');

        const snapshot = engine.toJSON();

        expect(snapshot.rules).toHaveLength(1);
        expect(snapshot.rules[0].id).toBe('r1');
        expect(snapshot.config.strict).toBe(true);
        expect(snapshot.config.maxRulesPerExecution).toBe(50);
        expect(snapshot.aliases).toEqual({ eq: 'equals' });
      });

      test('snapshot is JSON serializable', () => {
        const engine = new Mairon();
        engine.addRule({
          id: 'r1',
          name: 'Rule 1',
          conditions: { field: 'x', operator: 'exists' },
          actions: [{ type: 'action' }],
        });

        const snapshot = engine.toJSON();
        const json = JSON.stringify(snapshot);
        const parsed = JSON.parse(json);
        expect(parsed).toEqual(snapshot);
      });
    });

    describe('loadJSON', () => {
      test('loads full engine state', () => {
        const engine1 = new Mairon({ strict: true });
        engine1.addRule({
          id: 'r1',
          name: 'Rule 1',
          conditions: { field: 'x', operator: 'exists' },
          actions: [{ type: 'action' }],
        });
        engine1.registerAlias('eq', 'equals');

        const snapshot = engine1.toJSON();

        const engine2 = new Mairon();
        engine2.loadJSON(snapshot);

        expect(engine2.getRules()).toHaveLength(1);
        expect(engine2.getRules()[0].id).toBe('r1');
        expect(engine2.getConfig().strict).toBe(true);
        expect(engine2.hasAlias('eq')).toBe(true);
      });

      test('replaces existing rules by default', () => {
        const engine = new Mairon();
        engine.addRule({
          id: 'old',
          name: 'Old',
          conditions: { field: 'x', operator: 'exists' },
          actions: [{ type: 'action' }],
        });

        engine.loadJSON({
          rules: [
            {
              id: 'new',
              name: 'New',
              conditions: { field: 'y', operator: 'exists' },
              actions: [{ type: 'action' }],
            },
          ],
        });

        expect(engine.getRules()).toHaveLength(1);
        expect(engine.getRules()[0].id).toBe('new');
      });

      test('can merge rules instead of replace', () => {
        const engine = new Mairon();
        engine.addRule({
          id: 'old',
          name: 'Old',
          conditions: { field: 'x', operator: 'exists' },
          actions: [{ type: 'action' }],
        });

        engine.loadJSON(
          {
            rules: [
              {
                id: 'new',
                name: 'New',
                conditions: { field: 'y', operator: 'exists' },
                actions: [{ type: 'action' }],
              },
            ],
          },
          { replaceRules: false },
        );

        expect(engine.getRules()).toHaveLength(2);
      });

      test('round-trip preserves state', () => {
        const engine1 = new Mairon({ maxRulesPerExecution: 100 });
        engine1.addRule({
          id: 'r1',
          name: 'Rule 1',
          priority: 10,
          conditions: {
            all: [
              { field: 'a', operator: 'equals', value: 1 },
              { field: 'b', operator: 'greaterThan', value: 5 },
            ],
          },
          actions: [{ type: 'notify', params: { channel: 'email' } }],
          tags: ['test'],
          metadata: { version: 1 },
        });
        engine1.registerAlias('eq', 'equals');
        engine1.registerAlias('gt', 'greaterThan');

        const json = JSON.stringify(engine1.toJSON());
        const parsed = JSON.parse(json);

        const engine2 = new Mairon();
        engine2.loadJSON(parsed);

        expect(engine2.toJSON()).toEqual(engine1.toJSON());
      });
    });
  });
});
