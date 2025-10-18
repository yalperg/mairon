import {
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
} from '../schema';

export {
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
};

export interface LogicalGroup<T = unknown> {
  all?: Condition<T>[];
  any?: Condition<T>[];
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
  params: Record<string, unknown>
) => void | Promise<void> | unknown;
