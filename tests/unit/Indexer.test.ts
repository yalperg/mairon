import { Indexer } from '@/utils';

import type { Rule } from '@/types';

describe('Indexer', () => {
  let indexer: Indexer;

  beforeEach(() => {
    indexer = new Indexer();
  });

  describe('indexRule', () => {
    it('should index simple equals condition', () => {
      const rule: Rule = {
        id: 'rule-1',
        name: 'Test',
        conditions: { field: 'status', operator: 'equals', value: 'done' },
        actions: [{ type: 'notify' }],
      };

      indexer.indexRule(rule);

      const relevant = indexer.getRelevantRules({ status: 'done' });
      expect(relevant.has('rule-1')).toBe(true);
    });

    it('should index in operator with multiple values', () => {
      const rule: Rule = {
        id: 'rule-2',
        name: 'Test',
        conditions: {
          field: 'priority',
          operator: 'in',
          value: ['high', 'critical'],
        },
        actions: [{ type: 'notify' }],
      };

      indexer.indexRule(rule);

      const relevant1 = indexer.getRelevantRules({ priority: 'high' });
      const relevant2 = indexer.getRelevantRules({ priority: 'critical' });

      expect(relevant1.has('rule-2')).toBe(true);
      expect(relevant2.has('rule-2')).toBe(true);
    });

    it('should index contains operator', () => {
      const rule: Rule = {
        id: 'rule-3',
        name: 'Test',
        conditions: { field: 'message', operator: 'contains', value: 'error' },
        actions: [{ type: 'log' }],
      };

      indexer.indexRule(rule);

      const relevant = indexer.getRelevantRules({ message: 'error' });
      expect(relevant.has('rule-3')).toBe(true);
    });

    it('should not index non-indexable operators', () => {
      const rule: Rule = {
        id: 'rule-4',
        name: 'Test',
        conditions: { field: 'age', operator: 'greaterThan', value: 18 },
        actions: [{ type: 'notify' }],
      };

      indexer.indexRule(rule);

      const relevant = indexer.getRelevantRules({ age: 18 });
      expect(relevant.has('rule-4')).toBe(false);
    });

    it('should index nested conditions in all group', () => {
      const rule: Rule = {
        id: 'rule-5',
        name: 'Test',
        conditions: {
          all: [
            { field: 'status', operator: 'equals', value: 'done' },
            { field: 'priority', operator: 'equals', value: 'high' },
          ],
        },
        actions: [{ type: 'notify' }],
      };

      indexer.indexRule(rule);

      const relevant1 = indexer.getRelevantRules({ status: 'done' });
      const relevant2 = indexer.getRelevantRules({ priority: 'high' });

      expect(relevant1.has('rule-5')).toBe(true);
      expect(relevant2.has('rule-5')).toBe(true);
    });

    it('should index nested conditions in any group', () => {
      const rule: Rule = {
        id: 'rule-6',
        name: 'Test',
        conditions: {
          any: [
            { field: 'status', operator: 'equals', value: 'done' },
            { field: 'status', operator: 'equals', value: 'cancelled' },
          ],
        },
        actions: [{ type: 'notify' }],
      };

      indexer.indexRule(rule);

      const relevant1 = indexer.getRelevantRules({ status: 'done' });
      const relevant2 = indexer.getRelevantRules({ status: 'cancelled' });

      expect(relevant1.has('rule-6')).toBe(true);
      expect(relevant2.has('rule-6')).toBe(true);
    });

    it('should index priority', () => {
      const rule1: Rule = {
        id: 'rule-1',
        name: 'Test',
        priority: 10,
        conditions: { field: 'status', operator: 'equals', value: 'done' },
        actions: [{ type: 'notify' }],
      };

      const rule2: Rule = {
        id: 'rule-2',
        name: 'Test',
        priority: 10,
        conditions: { field: 'status', operator: 'equals', value: 'todo' },
        actions: [{ type: 'log' }],
      };

      indexer.indexRule(rule1);
      indexer.indexRule(rule2);

      const byPriority = indexer.getRulesByPriority(10);
      expect(byPriority.size).toBe(2);
      expect(byPriority.has('rule-1')).toBe(true);
      expect(byPriority.has('rule-2')).toBe(true);
    });

    it('should use default priority 0 when not specified', () => {
      const rule: Rule = {
        id: 'rule-1',
        name: 'Test',
        conditions: { field: 'status', operator: 'equals', value: 'done' },
        actions: [{ type: 'notify' }],
      };

      indexer.indexRule(rule);

      const byPriority = indexer.getRulesByPriority(0);
      expect(byPriority.has('rule-1')).toBe(true);
    });
  });

  describe('removeRule', () => {
    it('should remove rule from field index', () => {
      const rule: Rule = {
        id: 'rule-1',
        name: 'Test',
        conditions: { field: 'status', operator: 'equals', value: 'done' },
        actions: [{ type: 'notify' }],
      };

      indexer.indexRule(rule);
      indexer.removeRule('rule-1');

      const relevant = indexer.getRelevantRules({ status: 'done' });
      expect(relevant.has('rule-1')).toBe(false);
    });

    it('should remove rule from priority index', () => {
      const rule: Rule = {
        id: 'rule-1',
        name: 'Test',
        priority: 10,
        conditions: { field: 'status', operator: 'equals', value: 'done' },
        actions: [{ type: 'notify' }],
      };

      indexer.indexRule(rule);
      indexer.removeRule('rule-1');

      const byPriority = indexer.getRulesByPriority(10);
      expect(byPriority.has('rule-1')).toBe(false);
    });

    it('should not affect other rules', () => {
      const rule1: Rule = {
        id: 'rule-1',
        name: 'Test',
        conditions: { field: 'status', operator: 'equals', value: 'done' },
        actions: [{ type: 'notify' }],
      };

      const rule2: Rule = {
        id: 'rule-2',
        name: 'Test',
        conditions: { field: 'status', operator: 'equals', value: 'done' },
        actions: [{ type: 'log' }],
      };

      indexer.indexRule(rule1);
      indexer.indexRule(rule2);
      indexer.removeRule('rule-1');

      const relevant = indexer.getRelevantRules({ status: 'done' });
      expect(relevant.has('rule-1')).toBe(false);
      expect(relevant.has('rule-2')).toBe(true);
    });
  });

  describe('getRelevantRules', () => {
    it('should return empty set for non-indexed data', () => {
      const rule: Rule = {
        id: 'rule-1',
        name: 'Test',
        conditions: { field: 'status', operator: 'equals', value: 'done' },
        actions: [{ type: 'notify' }],
      };

      indexer.indexRule(rule);

      const relevant = indexer.getRelevantRules({ status: 'pending' });
      expect(relevant.size).toBe(0);
    });

    it('should return multiple matching rules', () => {
      const rule1: Rule = {
        id: 'rule-1',
        name: 'Test',
        conditions: { field: 'status', operator: 'equals', value: 'done' },
        actions: [{ type: 'notify' }],
      };

      const rule2: Rule = {
        id: 'rule-2',
        name: 'Test',
        conditions: { field: 'status', operator: 'equals', value: 'done' },
        actions: [{ type: 'log' }],
      };

      indexer.indexRule(rule1);
      indexer.indexRule(rule2);

      const relevant = indexer.getRelevantRules({ status: 'done' });
      expect(relevant.size).toBe(2);
      expect(relevant.has('rule-1')).toBe(true);
      expect(relevant.has('rule-2')).toBe(true);
    });

    it('should handle nested field paths', () => {
      const rule: Rule = {
        id: 'rule-1',
        name: 'Test',
        conditions: {
          field: 'user.status',
          operator: 'equals',
          value: 'active',
        },
        actions: [{ type: 'notify' }],
      };

      indexer.indexRule(rule);

      const relevant = indexer.getRelevantRules({ user: { status: 'active' } });
      expect(relevant.has('rule-1')).toBe(true);
    });

    it('should return empty set for null/undefined data', () => {
      const rule: Rule = {
        id: 'rule-1',
        name: 'Test',
        conditions: { field: 'status', operator: 'equals', value: 'done' },
        actions: [{ type: 'notify' }],
      };

      indexer.indexRule(rule);

      expect(indexer.getRelevantRules(null).size).toBe(0);
      expect(indexer.getRelevantRules(undefined).size).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all indexes', () => {
      const rule: Rule = {
        id: 'rule-1',
        name: 'Test',
        priority: 10,
        conditions: { field: 'status', operator: 'equals', value: 'done' },
        actions: [{ type: 'notify' }],
      };

      indexer.indexRule(rule);
      indexer.clear();

      const relevant = indexer.getRelevantRules({ status: 'done' });
      const byPriority = indexer.getRulesByPriority(10);

      expect(relevant.size).toBe(0);
      expect(byPriority.size).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const rule1: Rule = {
        id: 'rule-1',
        name: 'Test',
        priority: 10,
        conditions: { field: 'status', operator: 'equals', value: 'done' },
        actions: [{ type: 'notify' }],
      };

      const rule2: Rule = {
        id: 'rule-2',
        name: 'Test',
        priority: 5,
        conditions: { field: 'priority', operator: 'equals', value: 'high' },
        actions: [{ type: 'log' }],
      };

      indexer.indexRule(rule1);
      indexer.indexRule(rule2);

      const stats = indexer.getStats();

      expect(stats.fieldCount).toBe(2);
      expect(stats.priorityCount).toBe(2);
      expect(stats.totalRules).toBe(2);
    });

    it('should return zero stats for empty indexer', () => {
      const stats = indexer.getStats();

      expect(stats.fieldCount).toBe(0);
      expect(stats.priorityCount).toBe(0);
      expect(stats.totalRules).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle deeply nested conditions', () => {
      const rule: Rule = {
        id: 'rule-1',
        name: 'Test',
        conditions: {
          all: [
            {
              any: [
                { field: 'status', operator: 'equals', value: 'done' },
                { field: 'status', operator: 'equals', value: 'cancelled' },
              ],
            },
            { field: 'priority', operator: 'in', value: ['high', 'critical'] },
          ],
        },
        actions: [{ type: 'notify' }],
      };

      indexer.indexRule(rule);

      const relevant1 = indexer.getRelevantRules({ status: 'done' });
      const relevant2 = indexer.getRelevantRules({ priority: 'high' });

      expect(relevant1.has('rule-1')).toBe(true);
      expect(relevant2.has('rule-1')).toBe(true);
    });

    it('should handle rules with no indexable conditions', () => {
      const rule: Rule = {
        id: 'rule-1',
        name: 'Test',
        conditions: { field: 'age', operator: 'greaterThan', value: 18 },
        actions: [{ type: 'notify' }],
      };

      expect(() => indexer.indexRule(rule)).not.toThrow();

      const stats = indexer.getStats();
      expect(stats.totalRules).toBe(1);
    });
  });
});
