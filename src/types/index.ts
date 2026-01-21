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

export interface LogicalGroup<T = unknown> {
  all?: Condition<T>[];
  any?: Condition<T>[];
  not?: Condition<T>;
}

export type Condition<T = unknown> = SimpleCondition | LogicalGroup<T>;

export interface Rule<T = unknown> {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
  priority?: number;
  stopOnError?: boolean;
  conditions: Condition<T>;
  actions: Action[];
  metadata?: Record<string, unknown>;
  tags?: string[];
  version?: string;
}

export interface EvaluationContext<T = unknown> {
  data: T;
  previousData?: T;
  context?: Record<string, unknown>;
}

export interface ActionContext<T = unknown> {
  data: T;
  previousData?: T;
  context?: Record<string, unknown>;
  rule: Rule<T>;
  action: Action;
  evaluationContext: EvaluationContext<T>;
  metadata?: Record<string, unknown>;
}

export type ActionHandler<T = unknown> = (
  context: ActionContext<T>,
  params: Record<string, unknown>,
) => void | Promise<void> | unknown;

export type EngineEvent =
  | 'beforeEvaluate'
  | 'afterEvaluate'
  | 'ruleMatched'
  | 'ruleSkipped'
  | 'actionExecuted'
  | 'actionFailed'
  | 'error';

export interface EventData {
  beforeEvaluate: {
    context: EvaluationContext;
    ruleCount: number;
    timestamp: number;
  };
  afterEvaluate: {
    context: EvaluationContext;
    results: EvaluationResult[];
    duration: number;
    timestamp: number;
  };
  ruleMatched: {
    rule: Rule;
    context: EvaluationContext;
    timestamp: number;
  };
  ruleSkipped: {
    rule: Rule;
    reason: string;
    context: EvaluationContext;
    error?: Error;
    timestamp: number;
  };
  actionExecuted: {
    rule: Rule;
    action: Action;
    result: ActionResult;
    timestamp: number;
  };
  actionFailed: {
    rule: Rule;
    action: Action;
    error: Error;
    timestamp: number;
  };
  error: {
    error: Error;
    phase: string;
    context?: unknown;
    timestamp: number;
  };
}

export interface Stats {
  evaluations: {
    total: number;
    successful: number;
    failed: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
  };
  rules: {
    totalExecuted: number;
    totalMatched: number;
    totalSkipped: number;
    averageExecutionTime: number;
  };
  actions: {
    totalExecuted: number;
    totalFailed: number;
    averageExecutionTime: number;
  };
}
