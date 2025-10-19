# One engine to rule them all

Sauron is a powerful rule engine designed to evaluate complex conditions and rules efficiently. It allows to define rules in a simple and intuitive way, making it easy to integrate into various applications. With Sauron, you can create dynamic and flexible rule-based systems that adapt to changing requirements.

### Example Usage

This example shows how to build automation on top of a Todo object using only the Sauron API.

```typescript
import Sauron, { type Rule, type EvaluationResult } from 'sauron';

type Priority = 'low' | 'normal' | 'high';
type Todo = {
  id: string;
  title: string;
  dueAt?: number;
  priority: Priority;
  tags: string[];
  completed: boolean;
  assignee?: string;
};

const engine = new Sauron<Todo>({ enableIndexing: true });

const notifications: string[] = [];

engine.registerHandlers({
  addTag: ({ evaluationContext }, params) => {
    const todo = evaluationContext.data as Todo;
    const tag = String(params.tag);
    if (!todo.tags.includes(tag)) {
      todo.tags = [...todo.tags, tag];
    }
  },
  removeTag: ({ evaluationContext }, params) => {
    const todo = evaluationContext.data as Todo;
    const tag = String(params.tag);
    todo.tags = todo.tags.filter((t) => t !== tag);
  },
  assign: ({ evaluationContext }, params) => {
    const todo = evaluationContext.data as Todo;
    todo.assignee = String(params.user);
  },
  notify: ({ evaluationContext }, params) => {
    const todo = evaluationContext.data as Todo;
    const msg =
      typeof params.message === 'string'
        ? params.message
        : `Todo ${todo.title} requires attention`;
    notifications.push(msg);
  },
});

const rules: Rule<Todo>[] = [
  {
    id: 'overdue-tag',
    name: 'Tag overdue todos and notify',
    enabled: true,
    priority: 100,
    conditions: {
      all: [
        { field: 'completed', operator: 'equals', value: false },
        { field: 'dueAt', operator: 'lessThan', value: Date.now() },
      ],
    },
    actions: [
      { type: 'addTag', params: { tag: 'overdue' } },
      { type: 'notify', params: { message: 'A todo is overdue' } },
    ],
  },
  {
    id: 'high-priority-assign',
    name: 'Assign unowned high priority todos',
    enabled: true,
    priority: 90,
    conditions: {
      all: [
        { field: 'priority', operator: 'equals', value: 'high' },
        { field: 'assignee', operator: 'isEmpty' },
      ],
    },
    actions: [
      { type: 'assign', params: { user: 'team-lead' } },
      { type: 'addTag', params: { tag: 'urgent' } },
    ],
  },
  {
    id: 'cleanup-on-complete',
    name: 'Remove transient tags when completed',
    enabled: true,
    priority: 80,
    conditions: {
      all: [{ field: 'completed', operator: 'equals', value: true }],
    },
    actions: [{ type: 'removeTag', params: { tag: 'overdue' } }],
  },
];

engine.addRules(rules);

const todo: Todo = {
  id: '1',
  title: 'Pay invoice',
  dueAt: Date.now() - 3_600_000,
  priority: 'high',
  tags: [],
  completed: false,
};

const results: EvaluationResult[] = await engine.evaluate({ data: todo });

console.log({
  todo,
  notifications,
  results: results.map((r) => ({
    id: r.ruleId,
    matched: r.matched,
    actions: r.actionsExecuted,
  })),
});
```

With Sauron, you can centralize your business rules and keep your app code simple while rules evolve independently.
