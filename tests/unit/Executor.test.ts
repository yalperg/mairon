import { Executor } from '@/core';
import { TemplateResolver } from '@/utils';

import type { Rule } from '@/types';

function makeRule(): Rule<unknown> {
  return {
    id: 'r',
    name: 'R',
    conditions: { field: 'x', operator: 'equals', value: 1 },
    actions: [{ type: 'noop' }],
  };
}

describe('Executor', () => {
  test('register/unregister handlers', async () => {
    const ex = new Executor(new TemplateResolver());
    const handler = jest.fn();
    ex.registerHandler('notify', handler);
    expect(ex.getRegisteredHandlers()).toContain('notify');
    ex.unregisterHandler('notify');
    expect(ex.getRegisteredHandlers()).not.toContain('notify');
    ex.clearHandlers();
    expect(ex.getRegisteredHandlers().length).toBe(0);
  });

  test('executeAction with missing handler returns failure (non-strict)', async () => {
    const ex = new Executor();
    const res = await ex.executeAction({ type: 'missing' }, makeRule(), {
      data: {},
      context: {},
    });
    expect(res.success).toBe(false);
    expect(res.type).toBe('missing');
  });

  test('executeAction with missing handler throws in strict mode', async () => {
    const ex = new Executor();
    await expect(
      ex.executeAction(
        { type: 'missing' },
        makeRule(),
        { data: {}, context: {} },
        true,
      ),
    ).rejects.toThrow();
  });

  test('executes handler and returns result', async () => {
    const ex = new Executor();
    ex.registerHandler('sum', (_ctx, params) => {
      const a = (params.a as number) || 0;
      const b = (params.b as number) || 0;
      return a + b;
    });
    const res = await ex.executeAction(
      { type: 'sum', params: { a: 2, b: 3 } },
      makeRule(),
      { data: {}, context: {} },
    );
    expect(res.success).toBe(true);
    expect(res.result).toBe(5);
  });

  test('resolves templates in params', async () => {
    const ex = new Executor(new TemplateResolver());
    ex.registerHandler('greet', (_ctx, params) => `Hello ${params.name}`);
    const res = await ex.executeAction(
      { type: 'greet', params: { name: '{{ data.user }}' } },
      makeRule(),
      { data: { user: 'Alice' }, context: {} },
    );
    expect(res.success).toBe(true);
    expect(res.result).toBe('Hello Alice');
  });

  test('executeActions stopOnError', async () => {
    const ex = new Executor();
    ex.registerHandler('fail', () => {
      throw new Error('boom');
    });
    ex.registerHandler('ok', () => 'done');

    const results = await ex.executeActions(
      [{ type: 'fail' }, { type: 'ok' }],
      makeRule(),
      { data: {}, context: {} },
      true,
    );
    expect(results.length).toBe(1);
    expect(results[0].success).toBe(false);
  });
});
