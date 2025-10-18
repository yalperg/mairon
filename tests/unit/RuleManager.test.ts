import { RuleManager } from '../../src/core/RuleManager';
import { Indexer } from '../../src/utils/Indexer';
import { Validator } from '../../src/utils/Validator';
import { Rule } from '../../src/core/types';

function sampleRule(id: string, enabled?: boolean, priority?: number): Rule<unknown> {
  const rule: Rule<unknown> = {
    id,
    name: `R-${id}`,
    conditions: { field: 'status', operator: 'equals', value: 'active' },
    actions: [{ type: 'notify' }],
  };
  if (enabled !== undefined) {
    rule.enabled = enabled;
  }
  if (priority !== undefined) {
    rule.priority = priority;
  }
  return rule;
}

describe('RuleManager', () => {
  test('add/get rule with defaults and validation/indexing', () => {
  const manager = new RuleManager({ validateSchema: true, enableIndexing: true }, { indexer: new Indexer(), validator: new Validator() });
  const rule = sampleRule('r1', undefined, undefined);
    manager.addRule(rule);

    const fetched = manager.getRule('r1')!;
    expect(fetched.enabled).toBe(true);
    expect(fetched.priority).toBe(0);
  });

  test('addRules bulk and duplicate prevention', () => {
    const manager = new RuleManager();
    manager.addRules([sampleRule('a'), sampleRule('b')]);
    expect(manager.getRule('a')).toBeTruthy();
    expect(manager.getRule('b')).toBeTruthy();
    expect(() => manager.addRule(sampleRule('a'))).toThrow();
  });

  test('removeRule and clearRules', () => {
    const manager = new RuleManager({ enableIndexing: true });
    manager.addRule(sampleRule('x'));
    manager.addRule(sampleRule('y'));
    manager.removeRule('x');
    expect(manager.getRule('x')).toBeUndefined();
    manager.clearRules();
    expect(manager.getRule('y')).toBeUndefined();
  });

  test('updateRule with reindex', () => {
  const manager = new RuleManager({ validateSchema: true, enableIndexing: true });
  manager.addRule(sampleRule('u', true, 1));
  manager.updateRule('u', { enabled: false, priority: 5, name: 'U' });
    const updated = manager.getRule('u')!;
    expect(updated.enabled).toBe(false);
    expect(updated.priority).toBe(5);
    expect(updated.name).toBe('U');
  });

  test('enable/disable rule', () => {
    const manager = new RuleManager({ enableIndexing: true });
    manager.addRule(sampleRule('t', false));
    manager.enableRule('t');
    expect(manager.getRule('t')!.enabled).toBe(true);
    manager.disableRule('t');
    expect(manager.getRule('t')!.enabled).toBe(false);
  });

  test('getRules with filters', () => {
    const manager = new RuleManager();
    manager.addRules([
      sampleRule('r1', true, 1),
      sampleRule('r2', false, 3),
      { ...sampleRule('r3', true, 2), tags: ['a', 'b'] },
    ]);

    expect(manager.getRules({ enabled: true }).length).toBe(2);
    expect(manager.getRules({ priority: { min: 2 } }).length).toBe(2);
    expect(manager.getRules({ priority: { max: 1 } }).length).toBe(1);
    expect(manager.getRules({ tags: ['b'] }).length).toBe(1);
    expect(manager.getRules({ ids: ['r2'] }).length).toBe(1);
  });
});
