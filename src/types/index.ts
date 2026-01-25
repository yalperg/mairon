import type {
  Action,
  RuleFilter,
  EngineStats,
  ActionResult,
  SimpleCondition,
  ValidationError,
  EvaluationResult,
  ValidationResult,
  RuleEngineConfig,
  ConditionOperator,
  BuiltInOperator,
} from '@/schemas';

export type {
  Action,
  RuleFilter,
  EngineStats,
  ActionResult,
  SimpleCondition,
  ValidationError,
  EvaluationResult,
  ValidationResult,
  RuleEngineConfig,
  ConditionOperator,
  BuiltInOperator,
};

export type { OperatorFn, OperatorOptions } from '@/core/Operator';

/**
 * A logical group that combines multiple conditions with AND, OR, or NOT logic.
 *
 * @typeParam T - The type of data being evaluated
 *
 * @example
 * ```typescript
 * // AND: all conditions must be true
 * const andGroup: LogicalGroup = {
 *   all: [
 *     { field: 'age', operator: 'greaterThan', value: 18 },
 *     { field: 'verified', operator: 'equals', value: true }
 *   ]
 * };
 *
 * // OR: at least one condition must be true
 * const orGroup: LogicalGroup = {
 *   any: [
 *     { field: 'role', operator: 'equals', value: 'admin' },
 *     { field: 'role', operator: 'equals', value: 'moderator' }
 *   ]
 * };
 *
 * // NOT: condition must be false
 * const notGroup: LogicalGroup = {
 *   not: { field: 'banned', operator: 'equals', value: true }
 * };
 * ```
 */
export interface LogicalGroup<T = unknown> {
  /** All conditions must be true (AND logic) */
  all?: Condition<T>[];
  /** At least one condition must be true (OR logic) */
  any?: Condition<T>[];
  /** The condition must be false (NOT logic) */
  not?: Condition<T>;
}

/**
 * A condition can be either a simple condition or a logical group.
 * Conditions can be nested to create complex evaluation logic.
 *
 * @typeParam T - The type of data being evaluated
 */
export type Condition<T = unknown> = SimpleCondition | LogicalGroup<T>;

/**
 * A rule definition that specifies conditions and actions.
 *
 * @typeParam T - The type of data being evaluated
 *
 * @example
 * ```typescript
 * const rule: Rule<UserData> = {
 *   id: 'premium-welcome',
 *   name: 'Premium User Welcome',
 *   description: 'Send welcome email to new premium users',
 *   enabled: true,
 *   priority: 10,
 *   conditions: {
 *     all: [
 *       { field: 'user.isPremium', operator: 'equals', value: true },
 *       { field: 'user.isNew', operator: 'equals', value: true }
 *     ]
 *   },
 *   actions: [
 *     { type: 'sendEmail', params: { template: 'premium-welcome' } }
 *   ],
 *   tags: ['email', 'onboarding'],
 *   metadata: { author: 'system' }
 * };
 * ```
 */
export interface Rule<T = unknown> {
  /** Unique identifier for the rule */
  id: string;
  /** Human-readable name */
  name: string;
  /** Optional description of what the rule does */
  description?: string;
  /** Whether the rule is active (default: true) */
  enabled?: boolean;
  /** Execution priority - higher values run first (default: 0) */
  priority?: number;
  /** Stop executing remaining actions if one fails */
  stopOnError?: boolean;
  /** The condition(s) that must be met for actions to execute */
  conditions: Condition<T>;
  /** Actions to execute when conditions are met */
  actions: Action[];
  /** Arbitrary metadata for the rule */
  metadata?: Record<string, unknown>;
  /** Tags for categorization and filtering */
  tags?: string[];
  /** Version string for rule versioning */
  version?: string;
}

/**
 * Context provided during rule evaluation.
 *
 * @typeParam T - The type of data being evaluated
 *
 * @example
 * ```typescript
 * const context: EvaluationContext<OrderData> = {
 *   data: currentOrder,
 *   previousData: previousOrderState, // For change detection operators
 *   context: {
 *     requestId: 'req-123',
 *     userId: 'user-456',
 *     timestamp: Date.now()
 *   }
 * };
 * ```
 */
export interface EvaluationContext<T = unknown> {
  /** The data to evaluate rules against */
  data: T;
  /** Previous state of data (for change detection operators like 'changed', 'increased') */
  previousData?: T;
  /** Additional context available to operators and actions */
  context?: Record<string, unknown>;
}

/**
 * Context provided to action handlers when executing actions.
 *
 * @typeParam T - The type of data being evaluated
 */
export interface ActionContext<T = unknown> {
  /** The current data */
  data: T;
  /** Previous state of data */
  previousData?: T;
  /** Additional context */
  context?: Record<string, unknown>;
  /** The rule that triggered this action */
  rule: Rule<T>;
  /** The action being executed */
  action: Action;
  /** The full evaluation context */
  evaluationContext: EvaluationContext<T>;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Function signature for action handlers.
 *
 * @typeParam T - The type of data being evaluated
 *
 * @example
 * ```typescript
 * const sendEmailHandler: ActionHandler<UserData> = async (ctx, params) => {
 *   await emailService.send({
 *     to: ctx.data.user.email,
 *     template: params.template as string,
 *     data: ctx.data
 *   });
 * };
 * ```
 */
export type ActionHandler<T = unknown> = (
  context: ActionContext<T>,
  params: Record<string, unknown>,
) => void | Promise<void> | unknown;

/**
 * Events emitted by the rule engine during evaluation.
 */
export type EngineEvent =
  | 'beforeEvaluate'
  | 'afterEvaluate'
  | 'ruleMatched'
  | 'ruleSkipped'
  | 'actionExecuted'
  | 'actionFailed'
  | 'error';

/**
 * Event data payloads for each engine event type.
 */
export interface EventData {
  /** Emitted before evaluation starts */
  beforeEvaluate: {
    context: EvaluationContext;
    ruleCount: number;
    timestamp: number;
  };
  /** Emitted after evaluation completes */
  afterEvaluate: {
    context: EvaluationContext;
    results: EvaluationResult[];
    duration: number;
    timestamp: number;
  };
  /** Emitted when a rule's conditions match */
  ruleMatched: {
    rule: Rule;
    context: EvaluationContext;
    timestamp: number;
  };
  /** Emitted when a rule is skipped (conditions not met) */
  ruleSkipped: {
    rule: Rule;
    reason: string;
    context: EvaluationContext;
    error?: Error;
    timestamp: number;
  };
  /** Emitted when an action executes successfully */
  actionExecuted: {
    rule: Rule;
    action: Action;
    result: ActionResult;
    timestamp: number;
  };
  /** Emitted when an action fails */
  actionFailed: {
    rule: Rule;
    action: Action;
    error: Error;
    timestamp: number;
  };
  /** Emitted on errors during evaluation */
  error: {
    error: Error;
    phase: string;
    context?: unknown;
    timestamp: number;
  };
}

/**
 * Execution statistics tracked by the rule engine.
 *
 * @example
 * ```typescript
 * const stats = engine.getStats();
 * console.log(`Total evaluations: ${stats.evaluations.total}`);
 * console.log(`Average time: ${stats.evaluations.averageTime}ms`);
 * console.log(`Rules matched: ${stats.rules.totalMatched}`);
 * ```
 */
export interface Stats {
  /** Evaluation-level statistics */
  evaluations: {
    /** Total number of evaluations performed */
    total: number;
    /** Number of successful evaluations */
    successful: number;
    /** Number of failed evaluations */
    failed: number;
    /** Average evaluation time in milliseconds */
    averageTime: number;
    /** Minimum evaluation time in milliseconds */
    minTime: number;
    /** Maximum evaluation time in milliseconds */
    maxTime: number;
  };
  /** Rule-level statistics */
  rules: {
    /** Total number of rules executed */
    totalExecuted: number;
    /** Number of rules that matched */
    totalMatched: number;
    /** Number of rules skipped */
    totalSkipped: number;
    /** Average rule execution time in milliseconds */
    averageExecutionTime: number;
  };
  /** Action-level statistics */
  actions: {
    /** Total number of actions executed */
    totalExecuted: number;
    /** Number of actions that failed */
    totalFailed: number;
    /** Average action execution time in milliseconds */
    averageExecutionTime: number;
  };
}
