import { z } from 'zod';

export const builtInOperatorEnum = z.enum([
  'equals',
  'notEquals',
  'greaterThan',
  'lessThan',
  'greaterThanOrEqual',
  'lessThanOrEqual',
  'between',
  'contains',
  'notContains',
  'startsWith',
  'endsWith',
  'matches',
  'matchesAny',
  'includes',
  'excludes',
  'includesAll',
  'includesAny',
  'isEmpty',
  'isNotEmpty',
  'exists',
  'notExists',
  'isNull',
  'isNotNull',
  'isDefined',
  'isUndefined',
  'isString',
  'isNumber',
  'isBoolean',
  'isArray',
  'isObject',
  'changed',
  'changedFrom',
  'changedTo',
  'changedFromTo',
  'increased',
  'decreased',
  'in',
  'notIn',
  'lengthEquals',
  'lengthGreaterThan',
  'lengthLessThan',
  'lengthGreaterThanOrEqual',
  'lengthLessThanOrEqual',
]);

export type BuiltInOperator = z.infer<typeof builtInOperatorEnum>;
export type ConditionOperator = BuiltInOperator | (string & {});

export const simpleConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.string().min(1),
  value: z.unknown().optional(),
  from: z.unknown().optional(),
  to: z.unknown().optional(),
});

export const conditionSchema: z.ZodType<{
  field?: string;
  operator?: string;
  value?: unknown;
  from?: unknown;
  to?: unknown;
  all?: unknown[];
  any?: unknown[];
  not?: unknown;
}> = z.lazy(() =>
  z.union([
    simpleConditionSchema,
    z.object({ all: z.array(conditionSchema).min(1) }),
    z.object({ any: z.array(conditionSchema).min(1) }),
    z.object({ not: conditionSchema }),
  ]),
);

export const actionSchema = z.object({
  type: z.string().min(1),
  params: z.record(z.string(), z.unknown()).optional(),
  continueOnError: z.boolean().optional(),
  timeout: z.number().min(0).optional(),
});

export const ruleSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  enabled: z.boolean().optional(),
  priority: z.number().optional(),
  stopOnError: z.boolean().optional(),
  conditions: conditionSchema,
  actions: z.array(actionSchema).min(1),
  triggers: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+$/)
    .optional(),
});

export const evaluationContextSchema = z.object({
  data: z.unknown(),
  previousData: z.unknown().optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export const actionResultSchema = z.object({
  type: z.string(),
  success: z.boolean(),
  result: z.unknown().optional(),
  error: z.instanceof(Error).optional(),
  executionTime: z.number(),
});

export const evaluationResultSchema = z.object({
  ruleId: z.string(),
  ruleName: z.string(),
  matched: z.boolean(),
  skipped: z.boolean().optional(),
  skipReason: z.string().optional(),
  actionsExecuted: z.array(z.string()),
  actionResults: z.array(actionResultSchema).optional(),
  error: z.instanceof(Error).optional(),
  executionTime: z.number(),
  errorPhase: z.enum(['condition', 'action']).optional(),
  triggeredBy: z.string().optional(),
});

export const validationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string(),
  value: z.unknown().optional(),
  expected: z.string().optional(),
});

export const validationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(validationErrorSchema).optional(),
});

export const ruleEngineConfigSchema = z.object({
  strict: z.boolean().optional(),
  enableLogging: z.boolean().optional(),
  maxRulesPerExecution: z.number().optional(),
  enableIndexing: z.boolean().optional(),
  stopOnFirstError: z.boolean().optional(),
  maxConditionDepth: z.number().optional(),
  collectDetailedResults: z.boolean().optional(),
});

export const ruleFilterSchema = z.object({
  enabled: z.boolean().optional(),
  priority: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  ids: z.array(z.string()).optional(),
});

export const engineStatsSchema = z.object({
  totalRules: z.number(),
  enabledRules: z.number(),
  disabledRules: z.number(),
  registeredHandlers: z.number(),
  lastEvaluationTime: z.number().optional(),
  totalEvaluations: z.number(),
  averageEvaluationTime: z.number().optional(),
  cacheHitRate: z.number().optional(),
});

export type SimpleCondition = z.infer<typeof simpleConditionSchema>;
export type Action = z.infer<typeof actionSchema>;
export type ActionResult = z.infer<typeof actionResultSchema>;
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;
export type ValidationError = z.infer<typeof validationErrorSchema>;
export type ValidationResult = z.infer<typeof validationResultSchema>;
export type RuleEngineConfig = z.infer<typeof ruleEngineConfigSchema>;
export type RuleFilter = z.infer<typeof ruleFilterSchema>;
export type EngineStats = z.infer<typeof engineStatsSchema>;
