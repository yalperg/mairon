# Templates Guide

Mairon supports dynamic templates in condition values and action parameters, allowing you to reference data fields, time expressions, and context values at evaluation time.

## Table of Contents

- [Template Syntax](#template-syntax)
- [Time Expressions](#time-expressions)
- [Data References](#data-references)
- [Context References](#context-references)
- [Previous Data References](#previous-data-references)
- [Template Resolution Behavior](#template-resolution-behavior)
- [Use Cases & Examples](#use-cases--examples)
- [Performance Considerations](#performance-considerations)

---

## Template Syntax

Templates use the `{{ }}` syntax familiar from many template engines.

```typescript
// Basic template
"{{ expression }}"

// Multiple templates in a string
"User {{ data.name }} has {{ data.points }} points"

// Templates in condition values
{ field: 'age', operator: 'greaterThan', value: '{{ data.minAge }}' }

// Templates in action params
{ type: 'sendEmail', params: { to: '{{ data.email }}' } }
```

### Template Types

1. **Time Expressions**: `{{ now }}`, `{{ now + 1d }}`
2. **Data References**: `{{ data.field.path }}`
3. **Previous Data**: `{{ previousData.field.path }}`
4. **Context References**: `{{ context.field.path }}`

---

## Time Expressions

Time expressions provide dynamic timestamps relative to the current evaluation time.

### Syntax

```typescript
{{ now }}                  // Current timestamp
{{ now + <amount><unit> }} // Future timestamp
{{ now - <amount><unit> }} // Past timestamp
```

### Units

- `s`: seconds
- `m`: minutes
- `h`: hours
- `d`: days
- `w`: weeks

### Examples

**Basic Usage:**
```typescript
// Check if task is overdue
{
  field: 'dueAt',
  operator: 'lessThan',
  value: '{{ now }}'
}

// Check if item is new (created in last 24 hours)
{
  field: 'createdAt',
  operator: 'greaterThan',
  value: '{{ now - 24h }}'
}

// Check if expiration is soon (within next 7 days)
{
  field: 'expiresAt',
  operator: 'lessThan',
  value: '{{ now + 7d }}'
}
```

**Advanced Examples:**
```typescript
// Item created in last week
{
  field: 'createdAt',
  operator: 'greaterThan',
  value: '{{ now - 1w }}'
}

// Event is in next 30 days
{
  all: [
    {
      field: 'eventDate',
      operator: 'greaterThan',
      value: '{{ now }}'
    },
    {
      field: 'eventDate',
      operator: 'lessThan',
      value: '{{ now + 30d }}'
    }
  ]
}

// Trial ending within 3 days
{
  field: 'trialEndsAt',
  operator: 'between',
  from: '{{ now }}',
  to: '{{ now + 3d }}'
}

// Last activity was over 30 days ago
{
  field: 'lastActiveAt',
  operator: 'lessThan',
  value: '{{ now - 30d }}'
}
```

**Time Calculations:**
```typescript
// 5 minutes = {{ now + 5m }}
Date.now() + (5 * 60 * 1000)

// 2 hours = {{ now + 2h }}
Date.now() + (2 * 60 * 60 * 1000)

// 1 day = {{ now + 1d }}
Date.now() + (24 * 60 * 60 * 1000)

// 2 weeks = {{ now + 2w }}
Date.now() + (2 * 7 * 24 * 60 * 60 * 1000)

// 90 days ago = {{ now - 90d }}
Date.now() - (90 * 24 * 60 * 60 * 1000)
```

### Use Cases

**Task Management:**
```typescript
const rules = [
  {
    id: 'overdue-tasks',
    name: 'Mark overdue tasks',
    conditions: {
      all: [
        { field: 'completed', operator: 'equals', value: false },
        { field: 'dueAt', operator: 'lessThan', value: '{{ now }}' }
      ]
    },
    actions: [{ type: 'addTag', params: { tag: 'overdue' } }]
  },
  {
    id: 'due-soon',
    name: 'Notify about tasks due soon',
    conditions: {
      all: [
        { field: 'completed', operator: 'equals', value: false },
        { field: 'dueAt', operator: 'between', from: '{{ now }}', to: '{{ now + 24h }}' }
      ]
    },
    actions: [{ type: 'notify', params: { message: 'Task due within 24 hours' } }]
  }
];
```

**User Activity:**
```typescript
{
  id: 'inactive-users',
  name: 'Identify inactive users',
  conditions: {
    field: 'lastLoginAt',
    operator: 'lessThan',
    value: '{{ now - 30d }}'
  },
  actions: [{ type: 'sendReengagementEmail', params: {} }]
}
```

**Content Expiration:**
```typescript
{
  id: 'expiring-content',
  name: 'Warn about expiring content',
  conditions: {
    all: [
      { field: 'expiresAt', operator: 'greaterThan', value: '{{ now }}' },
      { field: 'expiresAt', operator: 'lessThan', value: '{{ now + 7d }}' }
    ]
  },
  actions: [{ type: 'notifyOwner', params: { message: 'Content expires soon' } }]
}
```

---

## Data References

Access fields from the current data being evaluated.

### Syntax

```typescript
{{ data.fieldName }}           // Top-level field
{{ data.nested.field }}        // Nested field
{{ data.array.0.field }}       // Array element
{{ data.deeply.nested.path }}  // Deep nesting
```

### Examples

**Simple Fields:**
```typescript
// Use data from another field
{
  field: 'confirmEmail',
  operator: 'equals',
  value: '{{ data.email }}'
}

// Reference numeric field
{
  field: 'discount',
  operator: 'lessThan',
  value: '{{ data.maxDiscount }}'
}
```

**Nested Fields:**
```typescript
// Access nested object properties
{
  field: 'shippingAddress.city',
  operator: 'equals',
  value: '{{ data.billingAddress.city }}'
}

// Complex nesting
{
  field: 'role',
  operator: 'equals',
  value: '{{ data.team.settings.defaultRole }}'
}
```

**In Action Parameters:**
```typescript
{
  type: 'sendEmail',
  params: {
    to: '{{ data.email }}',
    subject: 'Welcome {{ data.name }}!',
    userId: '{{ data.id }}'
  }
}

{
  type: 'createAuditLog',
  params: {
    action: 'user_updated',
    userId: '{{ data.id }}',
    userName: '{{ data.name }}',
    timestamp: '{{ now }}'
  }
}
```

**Complete Example:**
```typescript
const rule = {
  id: 'manager-approval',
  name: 'Require manager approval for large requests',
  conditions: {
    all: [
      { field: 'amount', operator: 'greaterThan', value: '{{ data.approvalThreshold }}' },
      { field: 'status', operator: 'equals', value: 'pending' }
    ]
  },
  actions: [
    {
      type: 'requestApproval',
      params: {
        from: '{{ data.requesterId }}',
        to: '{{ data.managerId }}',
        amount: '{{ data.amount }}',
        reason: 'Amount exceeds threshold'
      }
    }
  ]
};

// Evaluate with data
engine.evaluate({
  data: {
    requesterId: 'user123',
    managerId: 'mgr456',
    amount: 5000,
    approvalThreshold: 1000,
    status: 'pending'
  }
});
```

---

## Context References

Access additional context data passed during evaluation.

### Syntax

```typescript
{{ context.fieldName }}        // Context field
{{ context.nested.field }}     // Nested context
```

### Examples

**Request Context:**
```typescript
// Evaluate with context
engine.evaluate({
  data: userData,
  context: {
    requestId: 'req-123',
    userId: 'user-456',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    environment: 'production'
  }
});

// Use in conditions
{
  field: 'allowedEnvironments',
  operator: 'includes',
  value: '{{ context.environment }}'
}

// Use in actions
{
  type: 'logEvent',
  params: {
    event: 'rule_matched',
    requestId: '{{ context.requestId }}',
    userId: '{{ context.userId }}',
    ip: '{{ context.ipAddress }}'
  }
}
```

**Session Context:**
```typescript
engine.evaluate({
  data: order,
  context: {
    sessionId: 'sess-789',
    customerId: 'cust-123',
    cartTotal: 299.99,
    couponCode: 'SAVE20',
    isFirstPurchase: true
  }
});

// Check first purchase discount
{
  all: [
    { field: 'total', operator: 'greaterThan', value: 100 },
    { field: 'couponCode', operator: 'equals', value: '{{ context.couponCode }}' }
  ]
}
```

**Feature Flags:**
```typescript
engine.evaluate({
  data: user,
  context: {
    features: {
      newUi: true,
      betaAccess: false,
      advancedReports: true
    }
  }
});

// Check feature flag
{
  field: 'requestedFeature',
  operator: 'equals',
  value: 'advancedReports'
}
// Then in action handler, check {{ context.features.advancedReports }}
```

---

## Previous Data References

Access the previous state of data for change detection.

### Syntax

```typescript
{{ previousData.fieldName }}   // Previous field value
{{ previousData.nested.field }} // Nested previous value
```

### Examples

**Status Changes:**
```typescript
engine.evaluate({
  data: { status: 'active', userId: '123' },
  previousData: { status: 'pending', userId: '123' }
});

// Notify about status change
{
  type: 'notify',
  params: {
    message: 'Status changed from {{ previousData.status }} to {{ data.status }}',
    userId: '{{ data.userId }}'
  }
}
// Result: "Status changed from pending to active"
```

**Value Comparisons:**
```typescript
// Check if balance increased by a certain amount
{
  all: [
    { field: 'balance', operator: 'increased' },
    {
      field: 'balance',
      operator: 'greaterThan',
      value: '{{ previousData.balance }}' // This is redundant with 'increased', just for illustration
    }
  ]
}
```

**Audit Logging:**
```typescript
{
  type: 'logChange',
  params: {
    entity: 'user',
    entityId: '{{ data.id }}',
    field: 'email',
    oldValue: '{{ previousData.email }}',
    newValue: '{{ data.email }}',
    changedBy: '{{ context.userId }}',
    timestamp: '{{ now }}'
  }
}
```

**Complete Example:**
```typescript
const rule = {
  id: 'price-change-alert',
  name: 'Alert on significant price changes',
  conditions: {
    all: [
      { field: 'price', operator: 'changed' }
    ]
  },
  actions: [
    {
      type: 'sendAlert',
      params: {
        productId: '{{ data.id }}',
        productName: '{{ data.name }}',
        oldPrice: '{{ previousData.price }}',
        newPrice: '{{ data.price }}',
        message: 'Price changed from ${{ previousData.price }} to ${{ data.price }}'
      }
    }
  ]
};

engine.evaluate({
  data: { id: 'prod-1', name: 'Widget', price: 29.99 },
  previousData: { id: 'prod-1', name: 'Widget', price: 24.99 }
});
// Alert: "Price changed from $24.99 to $29.99"
```

---

## Template Resolution Behavior

### Single Template = Full Value

When a template is the entire value, it resolves to the actual type:

```typescript
// Resolves to number
{ field: 'age', operator: 'greaterThan', value: '{{ now }}' }
// value becomes: 1698172800000 (number)

// Resolves to string
{ field: 'name', operator: 'equals', value: '{{ data.userName }}' }
// value becomes: "Alice" (string)

// Resolves to object
{ field: 'settings', operator: 'equals', value: '{{ data.defaultSettings }}' }
// value becomes: { theme: 'dark', lang: 'en' } (object)
```

### Multiple Templates = String

When there are multiple templates or text around them, result is always a string:

```typescript
// Multiple templates
'{{ data.firstName }} {{ data.lastName }}'
// Resolves to: "Alice Smith" (string)

// Template with text
'Hello {{ data.name }}!'
// Resolves to: "Hello Alice!" (string)

// Numeric templates in string
'User has {{ data.points }} points'
// Resolves to: "User has 100 points" (string, not number)
```

### Nested Object Templates

Templates in nested objects are resolved recursively:

```typescript
{
  type: 'sendEmail',
  params: {
    to: '{{ data.email }}',
    subject: 'Welcome {{ data.name }}',
    body: {
      greeting: 'Hello {{ data.name }}',
      link: '{{ context.baseUrl }}/verify/{{ data.token }}',
      timestamp: '{{ now }}'
    },
    metadata: {
      userId: '{{ data.id }}',
      environment: '{{ context.env }}'
    }
  }
}

// All templates at all levels are resolved
```

### Array Templates

Templates in arrays are resolved for each element:

```typescript
{
  type: 'notifyMultiple',
  params: {
    recipients: [
      '{{ data.email }}',
      '{{ data.alternateEmail }}',
      '{{ context.adminEmail }}'
    ],
    message: 'Alert for {{ data.name }}'
  }
}
```

### Undefined/Null Handling

When a template resolves to `undefined` or `null`:

**Single template:**
```typescript
'{{ data.nonExistent }}' → undefined
```

**In string with other content:**
```typescript
'Name: {{ data.missingField }}' → 'Name: '
'Value is {{ data.nullField }}' → 'Value is '
```

---

## Use Cases & Examples

### Dynamic Conditions

**Time-based rules:**
```typescript
{
  id: 'weekend-discount',
  name: 'Apply weekend discount',
  conditions: {
    all: [
      { field: 'dayOfWeek', operator: 'in', value: ['Saturday', 'Sunday'] },
      { field: 'createdAt', operator: 'greaterThan', value: '{{ now - 2h }}' }
    ]
  },
  actions: [
    {
      type: 'applyDiscount',
      params: { percentage: 15, code: 'WEEKEND15' }
    }
  ]
}
```

**Field comparison:**
```typescript
{
  id: 'shipping-billing-match',
  name: 'Validate matching addresses',
  conditions: {
    all: [
      {
        field: 'shippingAddress.city',
        operator: 'notEquals',
        value: '{{ data.billingAddress.city }}'
      },
      { field: 'requireVerification', operator: 'equals', value: true }
    ]
  },
  actions: [
    { type: 'requestAddressVerification', params: {} }
  ]
}
```

### Personalized Actions

**Email notifications:**
```typescript
{
  type: 'sendEmail',
  params: {
    to: '{{ data.email }}',
    subject: 'Welcome to {{ context.appName }}, {{ data.firstName }}!',
    body: `
      Hi {{ data.firstName }},
      
      Your account {{ data.username }} has been created successfully.
      
      Account ID: {{ data.id }}
      Created: {{ now }}
      Environment: {{ context.environment }}
    `
  }
}
```

**Webhook calls:**
```typescript
{
  type: 'webhook',
  params: {
    url: '{{ context.webhookUrl }}',
    method: 'POST',
    body: {
      event: 'user.updated',
      userId: '{{ data.id }}',
      changes: {
        email: {
          from: '{{ previousData.email }}',
          to: '{{ data.email }}'
        }
      },
      timestamp: '{{ now }}',
      requestId: '{{ context.requestId }}'
    }
  }
}
```

### Audit Trail

```typescript
{
  id: 'audit-critical-changes',
  name: 'Log all critical field changes',
  conditions: {
    any: [
      { field: 'email', operator: 'changed' },
      { field: 'role', operator: 'changed' },
      { field: 'permissions', operator: 'changed' }
    ]
  },
  actions: [
    {
      type: 'createAuditLog',
      params: {
        entityType: 'user',
        entityId: '{{ data.id }}',
        action: 'update',
        changes: {
          email: {
            old: '{{ previousData.email }}',
            new: '{{ data.email }}'
          },
          role: {
            old: '{{ previousData.role }}',
            new: '{{ data.role }}'
          }
        },
        performedBy: '{{ context.userId }}',
        performedAt: '{{ now }}',
        ipAddress: '{{ context.ipAddress }}',
        sessionId: '{{ context.sessionId }}'
      }
    }
  ]
}
```

### Dynamic Thresholds

```typescript
{
  id: 'spending-limit',
  name: 'Check spending against user limit',
  conditions: {
    all: [
      {
        field: 'transactionAmount',
        operator: 'greaterThan',
        value: '{{ data.dailySpendingLimit }}'
      },
      { field: 'status', operator: 'equals', value: 'pending' }
    ]
  },
  actions: [
    {
      type: 'blockTransaction',
      params: {
        transactionId: '{{ data.transactionId }}',
        amount: '{{ data.transactionAmount }}',
        limit: '{{ data.dailySpendingLimit }}',
        reason: 'Exceeds daily spending limit of ${{ data.dailySpendingLimit }}'
      }
    }
  ]
}
```

---

## Performance Considerations

### Caching

Mairon caches resolved template expressions for improved performance:

- Templates are parsed once
- Expression results are cached with TTL
- Field access results are cached
- Cache is cleared after each evaluation

### Best Practices

**1. Use static values when possible:**
```typescript
// Good - static value
{ field: 'status', operator: 'equals', value: 'active' }

// Unnecessary - template for static value
{ field: 'status', operator: 'equals', value: '{{ "active" }}' }
```

**2. Minimize nested template resolution:**
```typescript
// Better - direct reference
{ field: 'email', operator: 'equals', value: '{{ data.email }}' }

// Slower - nested object access
{ field: 'email', operator: 'equals', value: '{{ data.contact.primary.email }}' }
```

**3. Limit template complexity:**
```typescript
// Good - simple templates
'User {{ data.name }} logged in at {{ now }}'

// Avoid - many templates
'{{ data.title }} {{ data.first }} {{ data.middle }} {{ data.last }} ({{ data.suffix }})'
```

**4. Reuse context data:**
```typescript
// Provide commonly used data in context
engine.evaluate({
  data: order,
  context: {
    baseUrl: 'https://api.example.com',
    env: 'production',
    appName: 'MyApp'
  }
});
```

### Configuration

Disable templates if not needed:

```typescript
const engine = new Mairon({
  enableTemplates: false  // Disable template resolution
});
```

---

## Error Handling

### Invalid Template Syntax

Invalid templates are returned as-is:

```typescript
'{{ invalid syntax'  → '{{ invalid syntax'
'{{ }}'              → '{{ }}'
```

### Nonexistent Paths

Missing paths resolve to `undefined`:

```typescript
'{{ data.doesNotExist }}'           → undefined
'Name: {{ data.missing.nested }}'   → 'Name: '
```

### Type Conversion

When templates are converted to strings in interpolation:

```typescript
'{{ data.nullValue }}'     → ''
'{{ data.undefinedValue }}' → ''
'{{ data.number }}'        → '123'
'{{ data.boolean }}'       → 'true'
'{{ data.object }}'        → '[object Object]'
```
