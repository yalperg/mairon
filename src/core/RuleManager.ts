import isNil from 'lodash/isNil';
import isArray from 'lodash/isArray';
import { Indexer, Validator } from '@/utils';

import type { Rule, RuleFilter, RuleEngineConfig } from '@/types';

class RuleManager<T = unknown> {
  private rules: Map<string, Rule<T>> = new Map();
  private config: RuleEngineConfig;
  private indexer: Indexer;
  private validator: Validator;

  constructor(
    config?: RuleEngineConfig,
    deps?: { indexer?: Indexer; validator?: Validator },
  ) {
    this.config = config ?? {};
    this.indexer = deps?.indexer ?? new Indexer();
    this.validator = deps?.validator ?? new Validator();
  }

  addRule(rule: Rule<T>): void {
    const result = this.validator.validate(rule);
    if (!result.valid) {
      throw new Error(
        `Rule validation failed: ${JSON.stringify(result.errors)}`,
      );
    }

    if (this.rules.has(rule.id)) {
      throw new Error(`Rule with id ${rule.id} already exists`);
    }

    const normalized: Rule<T> = {
      ...rule,
      enabled: isNil(rule.enabled) ? true : rule.enabled,
      priority: isNil(rule.priority) ? 0 : rule.priority,
    };

    this.rules.set(normalized.id, normalized);

    if (this.config.enableIndexing && normalized.enabled) {
      this.indexer.indexRule(normalized);
    }
  }

  addRules(rules: Rule<T>[]): void {
    if (!isArray(rules)) {
      throw new Error('addRules expects an array');
    }
    for (const r of rules) {
      this.addRule(r);
    }
  }

  removeRule(ruleId: string): void {
    if (!this.rules.has(ruleId)) {
      return;
    }
    this.rules.delete(ruleId);
    if (this.config.enableIndexing) {
      this.indexer.removeRule(ruleId);
    }
  }

  updateRule(ruleId: string, updates: Partial<Rule<T>>): void {
    const existing = this.rules.get(ruleId);
    if (!existing) {
      throw new Error(`Rule with id ${ruleId} not found`);
    }

    const updated: Rule<T> = {
      ...existing,
      ...updates,
      id: existing.id,
      enabled: isNil(updates.enabled) ? existing.enabled : updates.enabled,
      priority: isNil(updates.priority) ? existing.priority : updates.priority,
    } as Rule<T>;

    const result = this.validator.validate(updated);
    if (!result.valid) {
      throw new Error(
        `Rule validation failed: ${JSON.stringify(result.errors)}`,
      );
    }

    if (this.config.enableIndexing) {
      this.indexer.removeRule(ruleId);
      if (updated.enabled) {
        this.indexer.indexRule(updated);
      }
    }

    this.rules.set(ruleId, updated);
  }

  getRule(ruleId: string): Rule<T> | undefined {
    return this.rules.get(ruleId);
  }

  getRules(filter?: RuleFilter): Rule<T>[] {
    let values = Array.from(this.rules.values());

    if (filter && !isNil(filter.enabled)) {
      values = values.filter((r) => r.enabled === filter.enabled);
    }

    if (filter && filter.priority) {
      const min = filter.priority.min;
      const max = filter.priority.max;
      values = values.filter((r) => {
        if (!isNil(min) && (r.priority ?? 0) < min) {
          return false;
        }
        if (!isNil(max) && (r.priority ?? 0) > max) {
          return false;
        }
        return true;
      });
    }

    if (filter && filter.tags && filter.tags.length > 0) {
      values = values.filter((r) => {
        if (!r.tags || r.tags.length === 0) {
          return false;
        }
        for (const t of filter.tags!) {
          if (r.tags.includes(t)) {
            return true;
          }
        }
        return false;
      });
    }

    if (filter && filter.ids && filter.ids.length > 0) {
      const idSet = new Set(filter.ids);
      values = values.filter((r) => idSet.has(r.id));
    }

    return values;
  }

  getRelevantRules(data: T): Rule<T>[] {
    const enabledRules = this.getRules({ enabled: true });
    if (!this.config.enableIndexing) {
      return enabledRules;
    }
    const ids = this.indexer.getRelevantRules(data);
    if (ids.size === 0) {
      return enabledRules;
    }
    const idSet = new Set(ids);
    const filtered = enabledRules.filter((r) => idSet.has(r.id));
    if (filtered.length === 0) {
      return enabledRules;
    }
    return filtered;
  }

  clearRules(): void {
    this.rules.clear();
    if (this.config.enableIndexing) {
      this.indexer.clear();
    }
  }

  enableRule(ruleId: string): void {
    const existing = this.rules.get(ruleId);
    if (!existing) {
      throw new Error(`Rule with id ${ruleId} not found`);
    }
    if (existing.enabled) {
      return;
    }
    existing.enabled = true;
    if (this.config.enableIndexing) {
      this.indexer.indexRule(existing);
    }
  }

  disableRule(ruleId: string): void {
    const existing = this.rules.get(ruleId);
    if (!existing) {
      throw new Error(`Rule with id ${ruleId} not found`);
    }
    if (!existing.enabled) {
      return;
    }
    existing.enabled = false;
    if (this.config.enableIndexing) {
      this.indexer.removeRule(ruleId);
    }
  }
}

export default RuleManager;
