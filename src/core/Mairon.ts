import Executor from './Executor';
import Evaluator from './Evaluator';
import RuleManager from './RuleManager';
import EventEmitter from './EventEmitter';
import StatsTracker from './StatsTracker';
import Operator, { type OperatorFn, type OperatorOptions } from './Operator';
import Operators from './Operators';

import type {
  Rule,
  RuleFilter,
  RuleEngineConfig,
  EvaluationContext,
  EvaluationResult,
  ActionHandler,
  EngineEvent,
  EventData,
  Stats,
} from '@/types';

/**
 * Mairon is a lightweight, type-safe rule engine for JavaScript/TypeScript.
 *
 * @example
 * ```typescript
 * const engine = new Mairon<UserData>();
 *
 * // Add a rule
 * engine.addRule({
 *   id: 'premium-discount',
 *   name: 'Premium User Discount',
 *   conditions: {
 *     all: [
 *       { field: 'user.isPremium', operator: 'equals', value: true },
 *       { field: 'cart.total', operator: 'greaterThan', value: 100 }
 *     ]
 *   },
 *   actions: [{ type: 'applyDiscount', params: { percent: 10 } }]
 * });
 *
 * // Register action handler
 * engine.registerHandler('applyDiscount', (ctx, params) => {
 *   ctx.data.cart.discount = params.percent;
 * });
 *
 * // Evaluate rules
 * const results = await engine.evaluate({ data: userData });
 * ```
 *
 * @typeParam T - The type of data being evaluated
 */
class Mairon<T = unknown> extends EventEmitter<EngineEvent, EventData> {
  private manager: RuleManager<T>;
  private evaluator: Evaluator<T>;
  private executor: Executor<T>;
  private config: RuleEngineConfig;
  private stats: StatsTracker;
  private operators: Operators<T>;

  /**
   * Creates a new Mairon rule engine instance.
   *
   * @param config - Optional configuration options
   * @param deps - Optional dependency injection for testing
   *
   * @example
   * ```typescript
   * // Basic usage
   * const engine = new Mairon();
   *
   * // With configuration
   * const engine = new Mairon({
   *   strict: true,
   *   maxRulesPerExecution: 100,
   *   enableIndexing: true
   * });
   * ```
   */
  constructor(
    config?: RuleEngineConfig,
    deps?: {
      manager?: RuleManager<T>;
      evaluator?: Evaluator<T>;
      executor?: Executor<T>;
      operators?: Operators<T>;
    },
  ) {
    super();
    this.config = config ?? {};
    this.operators = deps?.operators ?? new Operators<T>();
    this.manager = deps?.manager ?? new RuleManager<T>(this.config);
    this.evaluator =
      deps?.evaluator ?? new Evaluator<T>(undefined, undefined, this.operators);
    this.executor = deps?.executor ?? new Executor<T>();
    this.stats = new StatsTracker();
  }

  // ============================================================
  // Rule Management
  // ============================================================

  /**
   * Adds a rule to the engine.
   *
   * @param rule - The rule to add
   * @throws Error if a rule with the same ID already exists
   *
   * @example
   * ```typescript
   * engine.addRule({
   *   id: 'rule-1',
   *   name: 'My Rule',
   *   conditions: { field: 'status', operator: 'equals', value: 'active' },
   *   actions: [{ type: 'notify' }]
   * });
   * ```
   */
  addRule(rule: Rule<T>): void {
    this.manager.addRule(rule);
  }

  /**
   * Adds multiple rules to the engine.
   *
   * @param rules - Array of rules to add
   */
  addRules(rules: Rule<T>[]): void {
    this.manager.addRules(rules);
  }

  /**
   * Removes a rule by its ID.
   *
   * @param ruleId - The ID of the rule to remove
   */
  removeRule(ruleId: string): void {
    this.manager.removeRule(ruleId);
  }

  /**
   * Updates an existing rule with partial changes.
   *
   * @param ruleId - The ID of the rule to update
   * @param updates - Partial rule object with fields to update
   */
  updateRule(ruleId: string, updates: Partial<Rule<T>>): void {
    this.manager.updateRule(ruleId, updates);
  }

  /**
   * Retrieves a rule by its ID.
   *
   * @param ruleId - The ID of the rule to retrieve
   * @returns The rule if found, undefined otherwise
   */
  getRule(ruleId: string): Rule<T> | undefined {
    return this.manager.getRule(ruleId);
  }

  /**
   * Retrieves rules matching the optional filter criteria.
   *
   * @param filter - Optional filter to narrow results
   * @returns Array of matching rules
   *
   * @example
   * ```typescript
   * // Get all enabled rules
   * const enabledRules = engine.getRules({ enabled: true });
   *
   * // Get rules with priority >= 5
   * const highPriorityRules = engine.getRules({ priority: { min: 5 } });
   * ```
   */
  getRules(filter?: RuleFilter): Rule<T>[] {
    return this.manager.getRules(filter);
  }

  /**
   * Removes all rules from the engine.
   */
  clearRules(): void {
    this.manager.clearRules();
  }

  /**
   * Enables a disabled rule.
   *
   * @param ruleId - The ID of the rule to enable
   */
  enableRule(ruleId: string): void {
    this.manager.enableRule(ruleId);
  }

  /**
   * Disables a rule without removing it.
   *
   * @param ruleId - The ID of the rule to disable
   */
  disableRule(ruleId: string): void {
    this.manager.disableRule(ruleId);
  }

  // ============================================================
  // Action Handlers
  // ============================================================

  /**
   * Registers an action handler for a specific action type.
   *
   * @param type - The action type identifier
   * @param handler - The function to execute when this action is triggered
   *
   * @example
   * ```typescript
   * engine.registerHandler('sendEmail', async (ctx, params) => {
   *   await emailService.send({
   *     to: params.recipient,
   *     subject: params.subject,
   *     body: params.body
   *   });
   * });
   * ```
   */
  registerHandler(type: string, handler: ActionHandler<T>): void {
    this.executor.registerHandler(type, handler);
  }

  /**
   * Removes an action handler.
   *
   * @param type - The action type to unregister
   */
  unregisterHandler(type: string): void {
    this.executor.unregisterHandler(type);
  }

  /**
   * Removes all registered action handlers.
   */
  clearHandlers(): void {
    this.executor.clearHandlers();
  }

  /**
   * Registers multiple action handlers at once.
   *
   * @param handlers - Object mapping action types to handler functions
   *
   * @example
   * ```typescript
   * engine.registerHandlers({
   *   sendEmail: (ctx, params) => emailService.send(params),
   *   logEvent: (ctx, params) => logger.info(params.message),
   *   updateRecord: (ctx, params) => db.update(params)
   * });
   * ```
   */
  registerHandlers(handlers: Record<string, ActionHandler<T>>): void {
    for (const [type, handler] of Object.entries(handlers)) {
      this.executor.registerHandler(type, handler);
    }
  }

  /**
   * Returns a list of all registered action handler types.
   *
   * @returns Array of registered action type names
   */
  getRegisteredHandlers(): string[] {
    return this.executor.getRegisteredHandlers();
  }

  // ============================================================
  // Custom Operators
  // ============================================================

  /**
   * Registers a custom operator for use in conditions.
   *
   * @param name - Unique name for the operator
   * @param fn - The operator function that returns true/false
   * @param options - Optional metadata for the operator
   * @throws Error if name is empty, fn is not a function, or trying to override built-in
   *
   * @example
   * ```typescript
   * // Simple operator
   * engine.registerOperator('isEven', (value) =>
   *   typeof value === 'number' && value % 2 === 0
   * );
   *
   * // Operator with condition value
   * engine.registerOperator('divisibleBy', (value, condition) =>
   *   typeof value === 'number' && value % condition.value === 0
   * );
   *
   * // Usage in rule
   * engine.addRule({
   *   id: 'even-check',
   *   name: 'Even Number Check',
   *   conditions: { field: 'count', operator: 'isEven' },
   *   actions: [{ type: 'notify' }]
   * });
   * ```
   */
  registerOperator(
    name: string,
    fn: OperatorFn<T>,
    options?: OperatorOptions,
  ): void {
    if (!name || typeof name !== 'string') {
      throw new Error('Operator name must be a non-empty string');
    }
    if (typeof fn !== 'function') {
      throw new Error('Operator function must be a function');
    }
    if (this.operators.isBuiltIn(name)) {
      throw new Error(`Cannot override built-in operator: ${name}`);
    }
    const operator = new Operator(name, fn as OperatorFn<unknown>, options);
    this.operators.register(operator);
  }

  /**
   * Removes a custom operator.
   *
   * @param name - The operator name to remove
   * @returns true if removed, false if not found or is built-in
   */
  unregisterOperator(name: string): boolean {
    return this.operators.unregister(name);
  }

  /**
   * Checks if an operator exists (built-in or custom).
   *
   * @param name - The operator name to check
   * @returns true if the operator exists
   */
  hasOperator(name: string): boolean {
    return this.operators.has(name);
  }

  /**
   * Returns all registered operator names (built-in and custom).
   *
   * @returns Array of operator names
   */
  getRegisteredOperators(): string[] {
    return this.operators.list();
  }

  /**
   * Returns only custom (non-built-in) operator names.
   *
   * @returns Array of custom operator names
   */
  getCustomOperators(): string[] {
    return this.operators.listCustom();
  }

  /**
   * Registers multiple custom operators at once.
   *
   * @param operatorMap - Object mapping operator names to functions or config objects
   *
   * @example
   * ```typescript
   * engine.registerOperators({
   *   isEven: (value) => value % 2 === 0,
   *   isOdd: (value) => value % 2 !== 0,
   *   divisibleBy: {
   *     fn: (value, condition) => value % condition.value === 0,
   *     options: { description: 'Check if divisible by value' }
   *   }
   * });
   * ```
   */
  registerOperators(
    operatorMap: Record<
      string,
      OperatorFn<T> | { fn: OperatorFn<T>; options?: OperatorOptions }
    >,
  ): void {
    for (const [name, value] of Object.entries(operatorMap)) {
      if (typeof value === 'function') {
        this.registerOperator(name, value);
      } else {
        this.registerOperator(name, value.fn, value.options);
      }
    }
  }

  /**
   * Removes all custom operators, keeping built-in operators intact.
   */
  clearCustomOperators(): void {
    this.operators.reset();
  }

  // ============================================================
  // Operator Aliases
  // ============================================================

  /**
   * Registers an alias for an existing operator.
   *
   * @param alias - The alias name to register
   * @param target - The existing operator name to alias
   * @throws Error if alias/target is empty or target doesn't exist
   *
   * @example
   * ```typescript
   * engine.registerAlias('eq', 'equals');
   * engine.registerAlias('gt', 'greaterThan');
   * engine.registerAlias('gte', 'greaterThanOrEqual');
   *
   * // Now you can use 'eq' instead of 'equals'
   * engine.addRule({
   *   id: 'test',
   *   name: 'Test',
   *   conditions: { field: 'status', operator: 'eq', value: 'active' },
   *   actions: []
   * });
   * ```
   */
  registerAlias(alias: string, target: string): void {
    if (!alias || typeof alias !== 'string') {
      throw new Error('Alias must be a non-empty string');
    }
    if (!target || typeof target !== 'string') {
      throw new Error('Target operator must be a non-empty string');
    }
    if (!this.operators.has(target)) {
      throw new Error(`Target operator does not exist: ${target}`);
    }
    this.operators.registerAlias(alias, target);
  }

  /**
   * Removes an operator alias.
   *
   * @param alias - The alias to remove
   * @returns true if removed, false if not found
   */
  unregisterAlias(alias: string): boolean {
    return this.operators.unregisterAlias(alias);
  }

  /**
   * Checks if an alias exists.
   *
   * @param alias - The alias name to check
   * @returns true if the alias exists
   */
  hasAlias(alias: string): boolean {
    return this.operators.hasAlias(alias);
  }

  /**
   * Gets the target operator for an alias.
   *
   * @param alias - The alias name
   * @returns The target operator name, or undefined if not found
   */
  getAlias(alias: string): string | undefined {
    return this.operators.getAlias(alias);
  }

  /**
   * Returns all registered aliases.
   *
   * @returns Object mapping alias names to target operator names
   */
  getAliases(): Record<string, string> {
    return this.operators.listAliases();
  }

  /**
   * Removes all operator aliases.
   */
  clearAliases(): void {
    this.operators.clearAliases();
  }

  // ============================================================
  // Evaluation
  // ============================================================

  /**
   * Evaluates all enabled rules against the provided context.
   *
   * Rules are evaluated in priority order (highest first). For each rule:
   * 1. Conditions are evaluated against the context data
   * 2. If conditions match, registered action handlers are executed
   * 3. Results are collected and returned
   *
   * @param context - The evaluation context containing data to evaluate
   * @returns Promise resolving to array of evaluation results
   *
   * @example
   * ```typescript
   * const results = await engine.evaluate({
   *   data: {
   *     user: { id: 1, isPremium: true },
   *     cart: { total: 150, items: ['item1', 'item2'] }
   *   },
   *   context: {
   *     requestId: 'req-123',
   *     timestamp: Date.now()
   *   }
   * });
   *
   * for (const result of results) {
   *   if (result.matched) {
   *     console.log(`Rule ${result.ruleName} matched!`);
   *   }
   * }
   * ```
   */
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
          this.stats.trackRuleExecution(res.executionTime, false);
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
          this.stats.trackActionExecution(ar.executionTime, ar.success);
        }

        const res: EvaluationResult = {
          ruleId: rule.id,
          ruleName: rule.name,
          matched: true,
          actionsExecuted: rule.actions.map((a) => a.type),
          actionResults,
          executionTime: Date.now() - ruleStart,
        };
        this.stats.trackRuleExecution(res.executionTime, true);
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
        this.stats.trackRuleExecution(res.executionTime, false);
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
    this.stats.trackEvaluation(duration, true);
    return results;
  }

  // ============================================================
  // Stats & Configuration
  // ============================================================

  /**
   * Returns execution statistics.
   *
   * @returns Statistics object with evaluation, rule, and action metrics
   */
  getStats(): Stats {
    return this.stats.getStats();
  }

  /**
   * Returns a copy of the current configuration.
   *
   * @returns Current engine configuration
   */
  getConfig(): RuleEngineConfig {
    return { ...this.config };
  }

  /**
   * Updates the engine configuration.
   *
   * @param config - Partial configuration to merge with existing config
   */
  updateConfig(config: Partial<RuleEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export default Mairon;
