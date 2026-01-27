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

  describe('rule chaining', () => {
    test('triggers another rule when first rule matches', async () => {
      const engine = new Mairon();
      const executedActions: string[] = [];

      engine.registerHandler('action1', () => executedActions.push('action1'));
      engine.registerHandler('action2', () => executedActions.push('action2'));

      engine.addRule({
        id: 'rule1',
        name: 'Rule 1',
        conditions: { field: 'x', operator: 'equals', value: 1 },
        actions: [{ type: 'action1' }],
        triggers: ['rule2'],
      });

      engine.addRule({
        id: 'rule2',
        name: 'Rule 2',
        conditions: { field: 'y', operator: 'equals', value: 2 },
        actions: [{ type: 'action2' }],
      });

      const results = await engine.evaluate({ data: { x: 1, y: 2 } });

      expect(executedActions).toEqual(['action1', 'action2']);
      expect(results).toHaveLength(2);
      expect(results[0].ruleId).toBe('rule1');
      expect(results[0].matched).toBe(true);
      expect(results[1].ruleId).toBe('rule2');
      expect(results[1].matched).toBe(true);
      expect(results[1].triggeredBy).toBe('rule1');
    });

    test('does not trigger rule if source rule does not match', async () => {
      const engine = new Mairon();
      const executedActions: string[] = [];

      engine.registerHandler('action1', () => executedActions.push('action1'));
      engine.registerHandler('action2', () => executedActions.push('action2'));

      engine.addRule({
        id: 'rule1',
        name: 'Rule 1',
        conditions: { field: 'x', operator: 'equals', value: 999 },
        actions: [{ type: 'action1' }],
        triggers: ['rule2'],
      });

      engine.addRule({
        id: 'rule2',
        name: 'Rule 2',
        enabled: false,
        conditions: { field: 'y', operator: 'equals', value: 2 },
        actions: [{ type: 'action2' }],
      });

      const results = await engine.evaluate({ data: { x: 1, y: 2 } });

      // rule1 doesn't match, so action1 is not executed
      // rule2 is disabled so it won't be evaluated in main loop
      // rule1 doesn't match so it won't trigger rule2
      expect(executedActions).toEqual([]);
      expect(results).toHaveLength(1);
      expect(results[0].matched).toBe(false);
    });

    test('triggered rule condition can fail', async () => {
      const engine = new Mairon();
      const executedActions: string[] = [];

      engine.registerHandler('action1', () => executedActions.push('action1'));
      engine.registerHandler('action2', () => executedActions.push('action2'));

      engine.addRule({
        id: 'rule1',
        name: 'Rule 1',
        conditions: { field: 'x', operator: 'equals', value: 1 },
        actions: [{ type: 'action1' }],
        triggers: ['rule2'],
      });

      engine.addRule({
        id: 'rule2',
        name: 'Rule 2',
        conditions: { field: 'y', operator: 'equals', value: 999 },
        actions: [{ type: 'action2' }],
      });

      const results = await engine.evaluate({ data: { x: 1, y: 2 } });

      expect(executedActions).toEqual(['action1']);
      expect(results).toHaveLength(2);
      expect(results[0].matched).toBe(true);
      expect(results[1].matched).toBe(false);
      expect(results[1].triggeredBy).toBe('rule1');
    });

    test('supports chaining multiple rules', async () => {
      const engine = new Mairon();
      const executedActions: string[] = [];

      engine.registerHandler('action1', () => executedActions.push('action1'));
      engine.registerHandler('action2', () => executedActions.push('action2'));
      engine.registerHandler('action3', () => executedActions.push('action3'));

      engine.addRule({
        id: 'rule1',
        name: 'Rule 1',
        conditions: { field: 'x', operator: 'exists' },
        actions: [{ type: 'action1' }],
        triggers: ['rule2'],
      });

      engine.addRule({
        id: 'rule2',
        name: 'Rule 2',
        conditions: { field: 'x', operator: 'exists' },
        actions: [{ type: 'action2' }],
        triggers: ['rule3'],
      });

      engine.addRule({
        id: 'rule3',
        name: 'Rule 3',
        conditions: { field: 'x', operator: 'exists' },
        actions: [{ type: 'action3' }],
      });

      const results = await engine.evaluate({ data: { x: 1 } });

      expect(executedActions).toEqual(['action1', 'action2', 'action3']);
      expect(results).toHaveLength(3);
    });

    test('prevents infinite loops with cycle detection', async () => {
      const engine = new Mairon();
      const executedActions: string[] = [];

      engine.registerHandler('action1', () => executedActions.push('action1'));
      engine.registerHandler('action2', () => executedActions.push('action2'));

      engine.addRule({
        id: 'rule1',
        name: 'Rule 1',
        conditions: { field: 'x', operator: 'exists' },
        actions: [{ type: 'action1' }],
        triggers: ['rule2'],
      });

      engine.addRule({
        id: 'rule2',
        name: 'Rule 2',
        conditions: { field: 'x', operator: 'exists' },
        actions: [{ type: 'action2' }],
        triggers: ['rule1'],
      });

      const results = await engine.evaluate({ data: { x: 1 } });

      expect(executedActions).toEqual(['action1', 'action2']);
      expect(results).toHaveLength(2);
    });

    test('self-triggering rule executes only once', async () => {
      const engine = new Mairon();
      let executionCount = 0;

      engine.registerHandler('action', () => executionCount++);

      engine.addRule({
        id: 'self-trigger',
        name: 'Self Trigger',
        conditions: { field: 'x', operator: 'exists' },
        actions: [{ type: 'action' }],
        triggers: ['self-trigger'],
      });

      await engine.evaluate({ data: { x: 1 } });

      expect(executionCount).toBe(1);
    });

    test('emits ruleTriggered event', async () => {
      const engine = new Mairon();
      const triggeredEvents: { source: string; target: string }[] = [];

      engine.registerHandler('action', () => {});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      engine.on('ruleTriggered', (data: any) => {
        triggeredEvents.push({
          source: data.sourceRule.id,
          target: data.triggeredRule.id,
        });
      });

      engine.addRule({
        id: 'rule1',
        name: 'Rule 1',
        conditions: { field: 'x', operator: 'exists' },
        actions: [{ type: 'action' }],
        triggers: ['rule2'],
      });

      engine.addRule({
        id: 'rule2',
        name: 'Rule 2',
        conditions: { field: 'x', operator: 'exists' },
        actions: [{ type: 'action' }],
      });

      await engine.evaluate({ data: { x: 1 } });

      expect(triggeredEvents).toHaveLength(1);
      expect(triggeredEvents[0]).toEqual({ source: 'rule1', target: 'rule2' });
    });

    test('skips disabled triggered rules', async () => {
      const engine = new Mairon();
      const executedActions: string[] = [];

      engine.registerHandler('action1', () => executedActions.push('action1'));
      engine.registerHandler('action2', () => executedActions.push('action2'));

      engine.addRule({
        id: 'rule1',
        name: 'Rule 1',
        conditions: { field: 'x', operator: 'exists' },
        actions: [{ type: 'action1' }],
        triggers: ['rule2'],
      });

      engine.addRule({
        id: 'rule2',
        name: 'Rule 2',
        enabled: false,
        conditions: { field: 'x', operator: 'exists' },
        actions: [{ type: 'action2' }],
      });

      const results = await engine.evaluate({ data: { x: 1 } });

      expect(executedActions).toEqual(['action1']);
      expect(results).toHaveLength(1);
    });

    test('ignores non-existent triggered rule IDs', async () => {
      const engine = new Mairon();
      const executedActions: string[] = [];

      engine.registerHandler('action1', () => executedActions.push('action1'));

      engine.addRule({
        id: 'rule1',
        name: 'Rule 1',
        conditions: { field: 'x', operator: 'exists' },
        actions: [{ type: 'action1' }],
        triggers: ['non-existent-rule'],
      });

      const results = await engine.evaluate({ data: { x: 1 } });

      expect(executedActions).toEqual(['action1']);
      expect(results).toHaveLength(1);
    });

    test('triggers multiple rules from single source', async () => {
      const engine = new Mairon();
      const executedActions: string[] = [];

      engine.registerHandler('action1', () => executedActions.push('action1'));
      engine.registerHandler('action2', () => executedActions.push('action2'));
      engine.registerHandler('action3', () => executedActions.push('action3'));

      engine.addRule({
        id: 'rule1',
        name: 'Rule 1',
        conditions: { field: 'x', operator: 'exists' },
        actions: [{ type: 'action1' }],
        triggers: ['rule2', 'rule3'],
      });

      engine.addRule({
        id: 'rule2',
        name: 'Rule 2',
        conditions: { field: 'x', operator: 'exists' },
        actions: [{ type: 'action2' }],
      });

      engine.addRule({
        id: 'rule3',
        name: 'Rule 3',
        conditions: { field: 'x', operator: 'exists' },
        actions: [{ type: 'action3' }],
      });

      const results = await engine.evaluate({ data: { x: 1 } });

      expect(executedActions).toEqual(['action1', 'action2', 'action3']);
      expect(results).toHaveLength(3);
    });
  });

  describe('immutable mode', () => {
    test('mutates original data when immutable is false (default)', async () => {
      const engine = new Mairon();
      engine.registerHandler('mutate', (ctx) => {
        (ctx.data as { value: number }).value = 999;
      });
      engine.addRule({
        id: 'r1',
        name: 'R1',
        conditions: { field: 'value', operator: 'exists' },
        actions: [{ type: 'mutate' }],
      });

      const data = { value: 1 };
      await engine.evaluate({ data });

      // Original data is mutated
      expect(data.value).toBe(999);
    });

    test('protects original data when immutable is true', async () => {
      const engine = new Mairon({ immutable: true });
      engine.registerHandler('mutate', (ctx) => {
        (ctx.data as { value: number }).value = 999;
      });
      engine.addRule({
        id: 'r1',
        name: 'R1',
        conditions: { field: 'value', operator: 'exists' },
        actions: [{ type: 'mutate' }],
      });

      const data = { value: 1 };
      await engine.evaluate({ data });

      // Original data is NOT mutated
      expect(data.value).toBe(1);
    });

    test('protects nested objects in immutable mode', async () => {
      const engine = new Mairon({ immutable: true });
      engine.registerHandler('mutate', (ctx) => {
        (ctx.data as { user: { name: string } }).user.name = 'CHANGED';
      });
      engine.addRule({
        id: 'r1',
        name: 'R1',
        conditions: { field: 'user.name', operator: 'exists' },
        actions: [{ type: 'mutate' }],
      });

      const data = { user: { name: 'original' } };
      await engine.evaluate({ data });

      // Original nested data is NOT mutated
      expect(data.user.name).toBe('original');
    });

    test('protects arrays in immutable mode', async () => {
      const engine = new Mairon({ immutable: true });
      engine.registerHandler('mutate', (ctx) => {
        (ctx.data as { items: string[] }).items.push('new-item');
      });
      engine.addRule({
        id: 'r1',
        name: 'R1',
        conditions: { field: 'items', operator: 'exists' },
        actions: [{ type: 'mutate' }],
      });

      const data = { items: ['a', 'b'] };
      await engine.evaluate({ data });

      // Original array is NOT mutated
      expect(data.items).toEqual(['a', 'b']);
    });

    test('protects previousData in immutable mode', async () => {
      const engine = new Mairon({ immutable: true });
      engine.registerHandler('mutate', (ctx) => {
        if (ctx.previousData) {
          (ctx.previousData as { value: number }).value = 999;
        }
      });
      engine.addRule({
        id: 'r1',
        name: 'R1',
        conditions: { field: 'value', operator: 'exists' },
        actions: [{ type: 'mutate' }],
      });

      const data = { value: 2 };
      const previousData = { value: 1 };
      await engine.evaluate({ data, previousData });

      // Original previousData is NOT mutated
      expect(previousData.value).toBe(1);
    });

    test('mutations in handlers still work within the cloned context', async () => {
      const engine = new Mairon({ immutable: true });
      let capturedValue: number | null = null;

      engine.registerHandler('rule1-action', (ctx) => {
        (ctx.data as { value: number }).value = 100;
      });
      engine.registerHandler('rule2-action', (ctx) => {
        // This should see the mutated value within the same evaluation
        capturedValue = (ctx.data as { value: number }).value;
      });

      engine.addRule({
        id: 'rule1',
        name: 'Rule 1',
        priority: 10,
        conditions: { field: 'value', operator: 'exists' },
        actions: [{ type: 'rule1-action' }],
      });
      engine.addRule({
        id: 'rule2',
        name: 'Rule 2',
        priority: 5,
        conditions: { field: 'value', operator: 'exists' },
        actions: [{ type: 'rule2-action' }],
      });

      const data = { value: 1 };
      await engine.evaluate({ data });

      // Original data is NOT mutated
      expect(data.value).toBe(1);
      // But mutations are visible within the same evaluation
      expect(capturedValue).toBe(100);
    });
  });
});
