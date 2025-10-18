import isNil from 'lodash/isNil';
import { TemplateResolver } from '../utils/TemplateResolver';
import {
  Action,
  ActionContext,
  ActionHandler,
  ActionResult,
  EvaluationContext,
  Rule,
} from './types';

export class Executor<T = unknown> {
  private handlers: Map<string, ActionHandler<T>> = new Map();
  private templateResolver: TemplateResolver;

  constructor(templateResolver?: TemplateResolver) {
    this.templateResolver = templateResolver ?? new TemplateResolver();
  }

  registerHandler(type: string, handler: ActionHandler<T>): void {
    this.handlers.set(type, handler);
  }

  unregisterHandler(type: string): void {
    this.handlers.delete(type);
  }

  clearHandlers(): void {
    this.handlers.clear();
  }

  getRegisteredActions(): string[] {
    return Array.from(this.handlers.keys());
  }

  async executeAction(
    action: Action,
    rule: Rule<T>,
    context: EvaluationContext<T>,
    strict = false,
  ): Promise<ActionResult> {
    const handler = this.handlers.get(action.type);
    const start = Date.now();

    if (!handler) {
      if (strict) {
        throw new Error(
          `No handler registered for action type: ${action.type}`,
        );
      }
      return {
        type: action.type,
        success: false,
        error: new Error(
          `No handler registered for action type: ${action.type}`,
        ),
        executionTime: Date.now() - start,
      };
    }

    const resolvedParams = isNil(action.params)
      ? {}
      : (this.templateResolver.resolve(action.params, context) as Record<
          string,
          unknown
        >);
    const actionContext: ActionContext<T> = {
      data: context.data,
      rule,
      action,
      evaluationContext: context,
      ...(context.previousData !== undefined
        ? { previousData: context.previousData }
        : {}),
      ...(context.context !== undefined ? { context: context.context } : {}),
    };

    try {
      const result = await Promise.resolve(
        handler(actionContext, resolvedParams),
      );
      return {
        type: action.type,
        success: true,
        result,
        executionTime: Date.now() - start,
      };
    } catch (err) {
      return {
        type: action.type,
        success: false,
        error: err as Error,
        executionTime: Date.now() - start,
      };
    }
  }

  async executeActions(
    actions: Action[],
    rule: Rule<T>,
    context: EvaluationContext<T>,
    stopOnError = false,
    strict = false,
  ): Promise<ActionResult[]> {
    const results: ActionResult[] = [];
    for (const action of actions) {
      const result = await this.executeAction(action, rule, context, strict);
      results.push(result);
      if (stopOnError && !result.success) {
        break;
      }
    }
    return results;
  }
}
