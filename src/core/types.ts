export interface EvaluationContext<T = unknown> {
  data: T;
  previousData?: T;
  context?: Record<string, unknown>;
}
