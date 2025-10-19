import Executor from './Executor';
import Evaluator from './Evaluator';
import RuleManager from './RuleManager';
import EventEmitter from './EventEmitter';

import type {
  Rule,
  RuleFilter,
  RuleEngineConfig,
  EvaluationContext,
  EvaluationResult,
  ActionHandler,
  EngineEvent,
  EventData,
  PerformanceMetrics,
} from '@/types';

class Sauron<T = unknown> extends EventEmitter<EngineEvent, EventData> {
  private manager: RuleManager<T>;
  private evaluator: Evaluator<T>;
  private executor: Executor<T>;
  private config: RuleEngineConfig;
  private metrics: PerformanceMetrics = {
    evaluations: {
      total: 0,
      successful: 0,
      failed: 0,
      averageTime: 0,
      minTime: 0,
      maxTime: 0,
    },
    rules: {
      totalExecuted: 0,
      totalMatched: 0,
      totalSkipped: 0,
      averageExecutionTime: 0,
    },
    actions: { totalExecuted: 0, totalFailed: 0, averageExecutionTime: 0 },
    cache: { hits: 0, misses: 0, hitRate: 0 },
  };

  constructor(
    config?: RuleEngineConfig,
    deps?: {
      manager?: RuleManager<T>;
      evaluator?: Evaluator<T>;
      executor?: Executor<T>;
    },
  ) {
    super();
    this.config = config ?? {};
    this.manager = deps?.manager ?? new RuleManager<T>(this.config);
    this.evaluator = deps?.evaluator ?? new Evaluator<T>();
    this.executor = deps?.executor ?? new Executor<T>();
  }

  addRule(rule: Rule<T>): void {
    this.manager.addRule(rule);
  }

  addRules(rules: Rule<T>[]): void {
    this.manager.addRules(rules);
  }

  removeRule(ruleId: string): void {
    this.manager.removeRule(ruleId);
  }

  updateRule(ruleId: string, updates: Partial<Rule<T>>): void {
    this.manager.updateRule(ruleId, updates);
  }

  getRule(ruleId: string): Rule<T> | undefined {
    return this.manager.getRule(ruleId);
  }

  getRules(filter?: RuleFilter): Rule<T>[] {
    return this.manager.getRules(filter);
  }

  clearRules(): void {
    this.manager.clearRules();
  }

  enableRule(ruleId: string): void {
    this.manager.enableRule(ruleId);
  }

  disableRule(ruleId: string): void {
    this.manager.disableRule(ruleId);
  }

  registerHandler(type: string, handler: ActionHandler<T>): void {
    this.executor.registerHandler(type, handler);
  }

  unregisterHandler(type: string): void {
    this.executor.unregisterHandler(type);
  }

  clearHandlers(): void {
    this.executor.clearHandlers();
  }

  registerHandlers(handlers: Record<string, ActionHandler<T>>): void {
    for (const [type, handler] of Object.entries(handlers)) {
      this.executor.registerHandler(type, handler);
    }
  }

  getRegisteredActions(): string[] {
    return this.executor.getRegisteredActions();
  }

  async evaluate(context: EvaluationContext<T>): Promise<EvaluationResult[]> {
    const start = Date.now();
    const enabledRules = this.config.enableIndexing
      ? this.manager.getRelevantRules(context.data)
      : this.manager.getRules({ enabled: true });
    const sorted = enabledRules.sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
    );
    const limited = this.config.maxRulesPerExecution
      ? sorted.slice(0, this.config.maxRulesPerExecution)
      : sorted;

    this.emit('beforeEvaluate', {
      context,
      ruleCount: limited.length,
      timestamp: Date.now(),
    });

    const results: EvaluationResult[] = [];

    for (const rule of limited) {
      const ruleStart = Date.now();
      try {
        const matched = this.evaluator.evaluateCondition(
          rule.conditions,
          context,
        );
        if (!matched) {
          const res: EvaluationResult = {
            ruleId: rule.id,
            ruleName: rule.name,
            matched: false,
            actionsExecuted: [],
            executionTime: Date.now() - ruleStart,
            skipped: true,
            skipReason: 'condition-failed',
          };
          this.emit('ruleSkipped', {
            rule,
            reason: 'condition-failed',
            context,
            timestamp: Date.now(),
          });
          this.metrics.rules.totalExecuted += 1;
          this.metrics.rules.totalSkipped += 1;
          const rdur = Date.now() - ruleStart;
          const rAvg = this.metrics.rules.averageExecutionTime;
          const rCount = this.metrics.rules.totalExecuted;
          this.metrics.rules.averageExecutionTime =
            rAvg + (rdur - rAvg) / rCount;
          results.push(res);
          continue;
        }

        this.emit('ruleMatched', { rule, context, timestamp: Date.now() });

        const actionResults = await this.executor.executeActions(
          rule.actions,
          rule,
          context,
          rule.stopOnError === true,
          this.config.strict === true,
        );

        for (const ar of actionResults) {
          if (ar.success) {
            this.emit('actionExecuted', {
              rule,
              action: { type: ar.type },
              result: ar,
              timestamp: Date.now(),
            });
          } else {
            this.emit('actionFailed', {
              rule,
              action: { type: ar.type },
              error: ar.error as Error,
              timestamp: Date.now(),
            });
          }
          this.metrics.actions.totalExecuted += 1;
          if (!ar.success) {
            this.metrics.actions.totalFailed += 1;
          }
          const aAvg = this.metrics.actions.averageExecutionTime;
          const aCount = this.metrics.actions.totalExecuted;
          this.metrics.actions.averageExecutionTime =
            aAvg + (ar.executionTime - aAvg) / aCount;
        }

        const res: EvaluationResult = {
          ruleId: rule.id,
          ruleName: rule.name,
          matched: true,
          actionsExecuted: rule.actions.map((a) => a.type),
          actionResults,
          executionTime: Date.now() - ruleStart,
        };
        this.metrics.rules.totalExecuted += 1;
        this.metrics.rules.totalMatched += 1;
        const rdur = res.executionTime;
        const rAvg = this.metrics.rules.averageExecutionTime;
        const rCount = this.metrics.rules.totalExecuted;
        this.metrics.rules.averageExecutionTime = rAvg + (rdur - rAvg) / rCount;
        results.push(res);
      } catch (err) {
        const res: EvaluationResult = {
          ruleId: rule.id,
          ruleName: rule.name,
          matched: false,
          actionsExecuted: [],
          executionTime: Date.now() - ruleStart,
          error: err as Error,
          errorPhase: 'condition',
        };
        this.emit('error', {
          error: err as Error,
          phase: 'condition',
          context,
          timestamp: Date.now(),
        });
        this.metrics.rules.totalExecuted += 1;
        this.metrics.rules.totalSkipped += 1;
        const rdur = Date.now() - ruleStart;
        const rAvg = this.metrics.rules.averageExecutionTime;
        const rCount = this.metrics.rules.totalExecuted;
        this.metrics.rules.averageExecutionTime = rAvg + (rdur - rAvg) / rCount;
        results.push(res);
      }
    }

    const duration = Date.now() - start;
    this.emit('afterEvaluate', {
      context,
      results,
      duration,
      timestamp: Date.now(),
    });
    this.metrics.evaluations.total += 1;
    this.metrics.evaluations.successful += 1;
    const eAvg = this.metrics.evaluations.averageTime;
    const eCount = this.metrics.evaluations.total;
    this.metrics.evaluations.averageTime = eAvg + (duration - eAvg) / eCount;
    if (
      this.metrics.evaluations.minTime === 0 ||
      duration < this.metrics.evaluations.minTime
    ) {
      this.metrics.evaluations.minTime = duration;
    }
    if (duration > this.metrics.evaluations.maxTime) {
      this.metrics.evaluations.maxTime = duration;
    }
    return results;
  }

  getPerformanceMetrics(): PerformanceMetrics {
    const hits = this.metrics.cache.hits;
    const misses = this.metrics.cache.misses;
    const total = hits + misses;
    const hitRate = total > 0 ? hits / total : 0;
    return {
      evaluations: { ...this.metrics.evaluations },
      rules: { ...this.metrics.rules },
      actions: { ...this.metrics.actions },
      cache: { hits, misses, hitRate },
    };
  }

  getConfig(): RuleEngineConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<RuleEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getStats(): { rules: number; handlers: number } {
    return {
      rules: this.manager.getRules().length,
      handlers: this.getRegisteredActions().length,
    };
  }
}

export default Sauron;
