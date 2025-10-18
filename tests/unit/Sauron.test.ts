import { Sauron } from '../../src/core/Sauron';

function makeEngine() {
  const engine = new Sauron({ strict: false, enableIndexing: false });
  engine.registerHandler('collect', (_ctx, params) => params);
  return engine;
}

describe('Sauron', () => {
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
