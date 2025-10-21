# Mairon

> One engine to rule them all

[![npm version](https://img.shields.io/npm/v/mairon.svg)](https://www.npmjs.com/package/mairon)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)

Mairon is a powerful, flexible, and type-safe rule engine for TypeScript/JavaScript. Define complex business rules declaratively and execute them efficiently against your data.

## Features

✨ **Declarative Rules**: Define rules as JSON-like objects  
🔍 **43+ Operators**: Comprehensive set of comparison, string, array, and type-checking operators  
🎯 **Type-Safe**: Full TypeScript support with generic types  
🔄 **Change Detection**: Track changes between data states  
📝 **Templates**: Dynamic values with time expressions and data references  
🎨 **Event System**: Hook into the evaluation lifecycle  

## Installation

```bash
npm install mairon
# or
yarn add mairon
# or
pnpm add mairon
```

## Quick Start

```typescript
import Mairon from 'mairon';

// Create engine
const engine = new Mairon();

// Register action handlers
engine.registerHandler('notify', (context, params) => {
  console.log(`Notification: ${params.message}`);
});

// Define a rule
engine.addRule({
  id: 'welcome-new-users',
  name: 'Welcome new users',
  conditions: {
    all: [
      { field: 'isNew', operator: 'equals', value: true },
      { field: 'age', operator: 'greaterThanOrEqual', value: 18 }
    ]
  },
  actions: [
    { type: 'notify', params: { message: 'Welcome!' } }
  ]
});

// Evaluate
const results = await engine.evaluate({
  data: { isNew: true, age: 25 }
});

console.log(results[0].matched); // true
```

## Example: Task Management

This example shows how to build automation on top of a Todo object using Mairon.

```typescript
import Mairon, { type Rule } from 'mairon';

type Todo = {
  id: string;
  title: string;
  dueAt?: number;
  priority: 'low' | 'normal' | 'high';
  tags: string[];
  completed: boolean;
  assignee?: string;
};

const engine = new Mairon<Todo>({ enableIndexing: true });

const notifications: string[] = [];

engine.registerHandlers({
  addTag: ({ evaluationContext }, params) => {
    const todo = evaluationContext.data;
    const tag = String(params.tag);
    if (!todo.tags.includes(tag)) {
      todo.tags.push(tag);
    }
  },
  assign: ({ evaluationContext }, params) => {
    evaluationContext.data.assignee = String(params.user);
  },
  notify: ({ evaluationContext }, params) => {
    const todo = evaluationContext.data;
    notifications.push(`${params.message}: ${todo.title}`);
  },
});

const rules: Rule<Todo>[] = [
  {
    id: 'overdue-tasks',
    name: 'Mark overdue tasks',
    priority: 100,
    enabled: true,
    conditions: {
      all: [
        { field: 'completed', operator: 'equals', value: false },
        { field: 'dueAt', operator: 'lessThan', value: '{{ now }}' }
      ]
    },
    actions: [
      { type: 'addTag', params: { tag: 'overdue' } },
      { type: 'notify', params: { message: 'Task is overdue' } }
    ]
  },
  {
    id: 'assign-high-priority',
    name: 'Auto-assign high priority tasks',
    priority: 90,
    enabled: true,
    conditions: {
      all: [
        { field: 'priority', operator: 'equals', value: 'high' },
        { field: 'assignee', operator: 'isUndefined' }
      ]
    },
    actions: [
      { type: 'assign', params: { user: 'team-lead' } }
    ]
  }
];

engine.addRules(rules);

// Evaluate a todo
const todo: Todo = {
  id: '1',
  title: 'Complete project',
  dueAt: Date.now() - 1000,  // Overdue
  priority: 'high',
  tags: [],
  completed: false
};

const results = await engine.evaluate({ data: todo });
console.log(`Matched ${results.filter(r => r.matched).length} rules`);
console.log('Notifications:', notifications);
```

## Core Concepts

### Rules

A rule consists of:
- **Conditions**: Logic tree that evaluates to true/false
- **Actions**: Operations to perform when conditions match
- **Priority**: Higher priority rules execute first
- **Metadata**: Tags, description, and custom data

```typescript
{
  id: 'rule-id',
  name: 'Human readable name',
  priority: 100,
  conditions: {
    all: [  // AND logic
      { field: 'status', operator: 'equals', value: 'active' },
      { field: 'age', operator: 'greaterThan', value: 18 }
    ]
  },
  actions: [
    { type: 'actionName', params: { key: 'value' } }
  ]
}
```

### Conditions

**Simple Conditions:**
```typescript
{ field: 'age', operator: 'greaterThan', value: 21 }
```

**Logical Groups (all = AND, any = OR):**
```typescript
{
  any: [  // OR logic
    { field: 'role', operator: 'equals', value: 'admin' },
    {
      all: [  // Nested AND
        { field: 'role', operator: 'equals', value: 'moderator' },
        { field: 'verified', operator: 'equals', value: true }
      ]
    }
  ]
}
```

### Operators

Mairon includes 43+ operators across multiple categories:

- **Comparison**: `equals`, `greaterThan`, `lessThan`, `between`, etc.
- **String**: `contains`, `startsWith`, `endsWith`, `matches` (regex)
- **Array**: `includes`, `includesAll`, `includesAny`, `isEmpty`
- **Existence**: `exists`, `isNull`, `isDefined`, `isUndefined`
- **Type**: `isString`, `isNumber`, `isBoolean`, `isArray`, `isObject`
- **Change**: `changed`, `changedFrom`, `changedTo`, `increased`, `decreased`
- **Membership**: `in`, `notIn`
- **Length**: `lengthEquals`, `lengthGreaterThan`, etc.

See [Operators Guide](./docs/operators.md) for complete reference.

### Actions & Handlers

Actions are executed when rules match. Register handlers to define behavior:

```typescript
engine.registerHandler('sendEmail', async (context, params) => {
  await emailService.send({
    to: params.recipient,
    subject: params.subject,
    body: params.body
  });
});

// Use in rules
{
  actions: [
    {
      type: 'sendEmail',
      params: {
        recipient: 'user@example.com',
        subject: 'Welcome!',
        body: 'Thanks for signing up'
      }
    }
  ]
}
```

### Templates

Dynamic values using `{{ }}` syntax:

**Time Expressions:**
```typescript
{ field: 'dueAt', operator: 'lessThan', value: '{{ now }}' }
{ field: 'createdAt', operator: 'greaterThan', value: '{{ now - 7d }}' }
```

**Data References:**
```typescript
{ field: 'confirmEmail', operator: 'equals', value: '{{ data.email }}' }
```

**In Actions:**
```typescript
{
  type: 'notify',
  params: {
    message: 'Welcome {{ data.name }}! Your ID is {{ data.id }}'
  }
}
```

See [Templates Guide](./docs/templates.md) for complete reference.

### Change Detection

Compare current and previous states:

```typescript
const results = await engine.evaluate({
  data: { status: 'active', lastLogin: Date.now() },
  previousData: { status: 'pending', lastLogin: Date.now() - 86400000 }
});

// Use change operators
{ field: 'status', operator: 'changed' }
{ field: 'status', operator: 'changedFrom', value: 'pending' }
{ field: 'status', operator: 'changedTo', value: 'active' }
{ field: 'loginCount', operator: 'increased' }
```

## API Overview

```typescript
// Create engine
const engine = new Mairon<DataType>(config);

// Add rules
engine.addRule(rule);
engine.addRules([rule1, rule2]);

// Manage rules
engine.updateRule('rule-id', { enabled: false });
engine.removeRule('rule-id');
engine.enableRule('rule-id');
engine.disableRule('rule-id');

// Query rules
const rule = engine.getRule('rule-id');
const all = engine.getRules();
const enabled = engine.getRules({ enabled: true });
const priority = engine.getRules({ priority: { min: 50 } });

// Register handlers
engine.registerHandler('actionType', handler);
engine.registerHandlers({ action1: handler1, action2: handler2 });

// Evaluate
const results = await engine.evaluate({ data });
const results = await engine.evaluate({ data, previousData, context });

// Events
engine.on('ruleMatched', (data) => console.log(data));
engine.on('actionExecuted', (data) => console.log(data));

// Metrics
const metrics = engine.getPerformanceMetrics();
const stats = engine.getStats();
```

## Configuration

```typescript
const engine = new Mairon({
  strict: true,              // Throw on missing handlers
  enableIndexing: true,      // Performance optimization for large rule sets
  validateSchema: true,      // Validate rules on add
  maxRulesPerExecution: 100, // Limit rules per evaluation
  enableTemplates: true,     // Enable template resolution
  stopOnFirstError: false,   // Continue on action errors
});
```

## Advanced Features

### Event System

Hook into the evaluation lifecycle:

```typescript
engine.on('beforeEvaluate', (data) => {
  console.log(`Evaluating ${data.ruleCount} rules`);
});

engine.on('ruleMatched', (data) => {
  console.log(`Rule ${data.rule.name} matched`);
});

engine.on('actionFailed', (data) => {
  console.error(`Action failed:`, data.error);
});

engine.on('afterEvaluate', (data) => {
  console.log(`Completed in ${data.duration}ms`);
});
```

### Rule Filtering

Query specific subsets of rules:

```typescript
// By enabled status
engine.getRules({ enabled: true });

// By priority range
engine.getRules({ priority: { min: 50, max: 100 } });

// By tags
engine.getRules({ tags: ['critical', 'security'] });

// By IDs
engine.getRules({ ids: ['rule-1', 'rule-2'] });
```

### Custom Context

Pass additional data for evaluation:

```typescript
await engine.evaluate({
  data: order,
  context: {
    userId: 'user-123',
    requestId: 'req-456',
    environment: 'production',
    features: { betaAccess: true }
  }
});

// Access in templates
{ field: 'environment', operator: 'equals', value: '{{ context.environment }}' }
```
