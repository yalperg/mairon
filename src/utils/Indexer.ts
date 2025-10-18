import { Rule, Condition, SimpleCondition } from '../core/types';

export class Indexer {
  private fieldIndex: Map<string, Map<unknown, Set<string>>> = new Map();
  private priorityIndex: Map<number, Set<string>> = new Map();

  indexRule(rule: Rule): void {
    const indexableConditions = this.extractIndexableConditions(rule.conditions);

    for (const condition of indexableConditions) {
      this.indexCondition(condition, rule.id);
    }

    const priority = rule.priority ?? 0;
    if (!this.priorityIndex.has(priority)) {
      this.priorityIndex.set(priority, new Set());
    }
    this.priorityIndex.get(priority)!.add(rule.id);
  }

  removeRule(ruleId: string): void {
    for (const valueMap of this.fieldIndex.values()) {
      for (const ruleIds of valueMap.values()) {
        ruleIds.delete(ruleId);
      }
    }

    for (const ruleIds of this.priorityIndex.values()) {
      ruleIds.delete(ruleId);
    }
  }

  getRelevantRules(data: unknown): Set<string> {
    if (typeof data !== 'object' || data === null) {
      return new Set();
    }

    const relevantRuleIds = new Set<string>();

    for (const [field, valueMap] of this.fieldIndex.entries()) {
      const fieldValue = this.getFieldValue(data, field);

      if (fieldValue !== undefined) {
        const ruleIds = valueMap.get(fieldValue);
        if (ruleIds) {
          for (const ruleId of ruleIds) {
            relevantRuleIds.add(ruleId);
          }
        }
      }
    }

    return relevantRuleIds;
  }

  getRulesByPriority(priority: number): Set<string> {
    return this.priorityIndex.get(priority) ?? new Set();
  }

  clear(): void {
    this.fieldIndex.clear();
    this.priorityIndex.clear();
  }

  getStats(): { fieldCount: number; priorityCount: number; totalRules: number } {
    const allRuleIds = new Set<string>();

    for (const ruleSet of this.priorityIndex.values()) {
      for (const ruleId of ruleSet) {
        allRuleIds.add(ruleId);
      }
    }

    return {
      fieldCount: this.fieldIndex.size,
      priorityCount: this.priorityIndex.size,
      totalRules: allRuleIds.size,
    };
  }

  private extractIndexableConditions(condition: Condition): SimpleCondition[] {
    const indexable: SimpleCondition[] = [];

    if (this.isSimpleCondition(condition)) {
      if (this.isIndexable(condition)) {
        indexable.push(condition);
      }
    } else if ('all' in condition && condition.all) {
      for (const subCondition of condition.all) {
        indexable.push(...this.extractIndexableConditions(subCondition));
      }
    } else if ('any' in condition && condition.any) {
      for (const subCondition of condition.any) {
        indexable.push(...this.extractIndexableConditions(subCondition));
      }
    }

    return indexable;
  }

  private isIndexable(condition: SimpleCondition): boolean {
    const indexableOperators = ['equals', 'in', 'contains'];
    return indexableOperators.includes(condition.operator);
  }

  private indexCondition(condition: SimpleCondition, ruleId: string): void {
    const { field, operator, value } = condition;

    if (!this.fieldIndex.has(field)) {
      this.fieldIndex.set(field, new Map());
    }

    const valueMap = this.fieldIndex.get(field)!;

    if (operator === 'equals') {
      if (!valueMap.has(value)) {
        valueMap.set(value, new Set());
      }
      valueMap.get(value)!.add(ruleId);
    } else if (operator === 'in' && Array.isArray(value)) {
      for (const val of value) {
        if (!valueMap.has(val)) {
          valueMap.set(val, new Set());
        }
        valueMap.get(val)!.add(ruleId);
      }
    } else if (operator === 'contains' && typeof value === 'string') {
      if (!valueMap.has(value)) {
        valueMap.set(value, new Set());
      }
      valueMap.get(value)!.add(ruleId);
    }
  }

  private getFieldValue(obj: unknown, path: string): unknown {
    if (typeof obj !== 'object' || obj === null) {
      return undefined;
    }

    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (typeof current !== 'object' || current === null) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  private isSimpleCondition(condition: Condition): condition is SimpleCondition {
    return 'field' in condition && 'operator' in condition;
  }
}
