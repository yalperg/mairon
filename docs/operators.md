# Operators Reference

Complete guide to all 45+ operators available in Mairon.

## Table of Contents

- [Comparison Operators](#comparison-operators)
- [String Operators](#string-operators)
- [Array Operators](#array-operators)
- [Existence Operators](#existence-operators)
- [Type Checking Operators](#type-checking-operators)
- [Change Detection Operators](#change-detection-operators)
- [Membership Operators](#membership-operators)
- [Length Operators](#length-operators)
- [Operator Summary Table](#operator-summary-table)

---

## Comparison Operators

Operators for numeric and value comparisons.

### `equals`

Tests if field value equals the condition value using deep equality.

**Parameters:**
- `value`: Value to compare against

**Type Coercion:** None - uses strict deep equality

**Examples:**
```typescript
// Numbers
{ field: 'age', operator: 'equals', value: 25 }

// Strings
{ field: 'status', operator: 'equals', value: 'active' }

// Booleans
{ field: 'isVerified', operator: 'equals', value: true }

// Objects (deep equality)
{ field: 'address', operator: 'equals', value: { city: 'NYC', zip: '10001' } }

// Arrays (deep equality)
{ field: 'tags', operator: 'equals', value: ['admin', 'user'] }
```

**Edge Cases:**
- `null` equals `null`
- `undefined` equals `undefined`
- `NaN` does not equal `NaN` (JavaScript behavior)
- Arrays must have same order: `[1,2]` ≠ `[2,1]`

---

### `notEquals`

Tests if field value does not equal the condition value.

**Parameters:**
- `value`: Value to compare against

**Examples:**
```typescript
{ field: 'status', operator: 'notEquals', value: 'deleted' }
{ field: 'count', operator: 'notEquals', value: 0 }
```

**Edge Cases:**
- Returns `true` for `null` !== `undefined`
- Returns `false` for deeply equal objects

---

### `greaterThan`

Tests if field value is greater than the condition value.

**Parameters:**
- `value`: Numeric value to compare against

**Type Coercion:** Converts both values to numbers

**Examples:**
```typescript
{ field: 'age', operator: 'greaterThan', value: 18 }
{ field: 'price', operator: 'greaterThan', value: 99.99 }
{ field: 'score', operator: 'greaterThan', value: 0 }
```

**Type Coercion Behavior:**
```typescript
// String numbers are converted
'100' > 50  // true

// Invalid conversions return false
'abc' > 10  // false (NaN is not greater than 10)
null > 0    // false
undefined > 0 // false
```

**Edge Cases:**
- Non-numeric values convert to `NaN` and return `false`
- `null` and `undefined` return `false`
- Negative numbers work as expected

---

### `lessThan`

Tests if field value is less than the condition value.

**Parameters:**
- `value`: Numeric value to compare against

**Type Coercion:** Converts both values to numbers

**Examples:**
```typescript
{ field: 'age', operator: 'lessThan', value: 65 }
{ field: 'balance', operator: 'lessThan', value: 0 }
{ field: 'temperature', operator: 'lessThan', value: 32 }
```

---

### `greaterThanOrEqual`

Tests if field value is greater than or equal to the condition value.

**Parameters:**
- `value`: Numeric value to compare against

**Type Coercion:** Converts both values to numbers

**Examples:**
```typescript
{ field: 'age', operator: 'greaterThanOrEqual', value: 21 }
{ field: 'quantity', operator: 'greaterThanOrEqual', value: 1 }
```

---

### `lessThanOrEqual`

Tests if field value is less than or equal to the condition value.

**Parameters:**
- `value`: Numeric value to compare against

**Type Coercion:** Converts both values to numbers

**Examples:**
```typescript
{ field: 'age', operator: 'lessThanOrEqual', value: 100 }
{ field: 'discount', operator: 'lessThanOrEqual', value: 50 }
```

---

### `between`

Tests if field value is between two values (inclusive).

**Parameters:**
- `from`: Lower bound (inclusive)
- `to`: Upper bound (inclusive)

**Type Coercion:** Converts all values to numbers

**Examples:**
```typescript
{ field: 'age', operator: 'between', from: 18, to: 65 }
{ field: 'price', operator: 'between', from: 10.00, to: 99.99 }
{ field: 'temperature', operator: 'between', from: -10, to: 50 }
```

**Edge Cases:**
- Order matters: `from` must be ≤ `to`
- Inclusive on both ends: `value >= from && value <= to`
- Non-numeric values return `false`

---

## String Operators

Operators for string matching and comparison.

### `contains`

Tests if field value contains the search string.

**Parameters:**
- `value`: String to search for

**Type Coercion:** Converts both values to strings

**Case Sensitive:** Yes

**Examples:**
```typescript
{ field: 'email', operator: 'contains', value: '@gmail.com' }
{ field: 'description', operator: 'contains', value: 'urgent' }
{ field: 'url', operator: 'contains', value: 'https://' }
```

**Type Coercion Behavior:**
```typescript
// Numbers converted to strings
123 contains '2'  // true ('123' contains '2')

// Booleans converted to strings
true contains 'ru' // true ('true' contains 'ru')
```

**Edge Cases:**
- Empty string is contained in any string
- `null` or `undefined` returns `false`
- Case sensitive: `'Hello'` does not contain `'hello'`

---

### `notContains`

Tests if field value does not contain the search string.

**Parameters:**
- `value`: String to search for

**Type Coercion:** Converts both values to strings

**Case Sensitive:** Yes

**Examples:**
```typescript
{ field: 'email', operator: 'notContains', value: '@spam.com' }
{ field: 'content', operator: 'notContains', value: 'banned_word' }
```

---

### `startsWith`

Tests if field value starts with the given prefix.

**Parameters:**
- `value`: Prefix string

**Type Coercion:** Converts both values to strings

**Case Sensitive:** Yes

**Examples:**
```typescript
{ field: 'email', operator: 'startsWith', value: 'admin' }
{ field: 'phone', operator: 'startsWith', value: '+1' }
{ field: 'url', operator: 'startsWith', value: 'https://' }
```

**Edge Cases:**
- Empty string prefix matches any string
- `null` or `undefined` returns `false`

---

### `endsWith`

Tests if field value ends with the given suffix.

**Parameters:**
- `value`: Suffix string

**Type Coercion:** Converts both values to strings

**Case Sensitive:** Yes

**Examples:**
```typescript
{ field: 'filename', operator: 'endsWith', value: '.pdf' }
{ field: 'email', operator: 'endsWith', value: '@company.com' }
{ field: 'url', operator: 'endsWith', value: '/' }
```

**Edge Cases:**
- Empty string suffix matches any string
- `null` or `undefined` returns `false`

---

### `matches`

Tests if field value matches a regular expression pattern.

**Parameters:**
- `value`: Regular expression pattern (string)

**Type Coercion:** Converts field value to string

**Flags:** Case-sensitive by default

**Examples:**
```typescript
// Email validation
{ field: 'email', operator: 'matches', value: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' }

// Phone number
{ field: 'phone', operator: 'matches', value: '^\\+?1?\\d{10}$' }

// Alphanumeric
{ field: 'username', operator: 'matches', value: '^[a-zA-Z0-9_]+$' }

// Date format (YYYY-MM-DD)
{ field: 'date', operator: 'matches', value: '^\\d{4}-\\d{2}-\\d{2}$' }
```

**Advanced Patterns:**
```typescript
// Case-insensitive (use (?i) flag)
{ field: 'status', operator: 'matches', value: '(?i)^active$' }

// Multiple alternatives
{ field: 'type', operator: 'matches', value: '^(admin|moderator|user)$' }

// Contains specific word boundary
{ field: 'text', operator: 'matches', value: '\\bimportant\\b' }
```

**Edge Cases:**
- Invalid regex patterns return `false`
- `null` or `undefined` returns `false`
- Empty pattern matches empty string

---

### `matchesAny`

Tests if field value matches any pattern in an array of regular expressions.

**Parameters:**
- `value`: Array of regular expression patterns (strings)

**Type Coercion:** Converts field value to string

**Examples:**
```typescript
// Multiple email domains
{
  field: 'email',
  operator: 'matchesAny',
  value: ['@gmail\\.com$', '@yahoo\\.com$', '@hotmail\\.com$']
}

// Multiple file extensions
{
  field: 'filename',
  operator: 'matchesAny',
  value: ['\\.pdf$', '\\.doc$', '\\.docx$']
}

// Multiple patterns
{
  field: 'code',
  operator: 'matchesAny',
  value: ['^[A-Z]{2}\\d{4}$', '^\\d{6}$']
}
```

**Edge Cases:**
- Returns `true` if any pattern matches
- Returns `false` if array is empty
- Invalid patterns are skipped

---

## Array Operators

Operators for array membership and properties.

### `includes`

Tests if array includes a specific value.

**Parameters:**
- `value`: Value to search for

**Type Required:** Field must be an array

**Equality:** Uses strict equality (`===`)

**Examples:**
```typescript
{ field: 'tags', operator: 'includes', value: 'featured' }
{ field: 'roles', operator: 'includes', value: 'admin' }
{ field: 'ids', operator: 'includes', value: 123 }
```

**Edge Cases:**
- Non-array fields return `false`
- Works with any value type
- Uses reference equality for objects

---

### `excludes`

Tests if array does not include a specific value.

**Parameters:**
- `value`: Value that should not be present

**Type Required:** Field must be an array

**Examples:**
```typescript
{ field: 'tags', operator: 'excludes', value: 'spam' }
{ field: 'blocklist', operator: 'excludes', value: userId }
```

---

### `includesAll`

Tests if array includes all values from a specified array.

**Parameters:**
- `value`: Array of values that must all be present

**Type Required:** Both field and value must be arrays

**Equality:** Uses strict equality (`===`)

**Examples:**
```typescript
// User must have all required roles
{
  field: 'roles',
  operator: 'includesAll',
  value: ['user', 'verified']
}

// Product must have all required tags
{
  field: 'tags',
  operator: 'includesAll',
  value: ['organic', 'glutenfree', 'vegan']
}
```

**Edge Cases:**
- Empty `value` array returns `true` (all zero conditions met)
- Order doesn't matter
- Non-array fields or values return `false`

---

### `includesAny`

Tests if array includes any value from a specified array.

**Parameters:**
- `value`: Array of values where at least one must be present

**Type Required:** Both field and value must be arrays

**Equality:** Uses strict equality (`===`)

**Examples:**
```typescript
// User has at least one of these roles
{
  field: 'roles',
  operator: 'includesAny',
  value: ['admin', 'moderator', 'support']
}

// Product has at least one of these categories
{
  field: 'categories',
  operator: 'includesAny',
  value: ['electronics', 'computers', 'phones']
}
```

**Edge Cases:**
- Empty `value` array returns `false` (no match possible)
- Order doesn't matter
- Non-array fields or values return `false`

---

### `isEmpty`

Tests if array is empty (length === 0).

**Parameters:** None

**Type Required:** Field must be an array

**Examples:**
```typescript
{ field: 'errors', operator: 'isEmpty' }
{ field: 'cart', operator: 'isEmpty' }
{ field: 'notifications', operator: 'isEmpty' }
```

**Edge Cases:**
- Non-array values return `false`
- `null` and `undefined` return `false`
- Empty array `[]` returns `true`

---

### `isNotEmpty`

Tests if array is not empty (length > 0).

**Parameters:** None

**Type Required:** Field must be an array

**Examples:**
```typescript
{ field: 'items', operator: 'isNotEmpty' }
{ field: 'tags', operator: 'isNotEmpty' }
```

---

## Existence Operators

Operators for checking value presence and nullability.

### `exists`

Tests if field value exists (not `null` or `undefined`).

**Parameters:** None

**Examples:**
```typescript
{ field: 'email', operator: 'exists' }
{ field: 'phoneNumber', operator: 'exists' }
{ field: 'address.city', operator: 'exists' }
```

**Truthy Values:**
- Empty string `''` - EXISTS
- Zero `0` - EXISTS
- `false` - EXISTS
- Empty array `[]` - EXISTS
- Empty object `{}` - EXISTS

**Falsy Values:**
- `null` - DOES NOT EXIST
- `undefined` - DOES NOT EXIST

---

### `notExists`

Tests if field value does not exist (`null` or `undefined`).

**Parameters:** None

**Examples:**
```typescript
{ field: 'deletedAt', operator: 'notExists' }
{ field: 'optionalField', operator: 'notExists' }
```

---

### `isNull`

Tests if field value is exactly `null`.

**Parameters:** None

**Examples:**
```typescript
{ field: 'cancelledAt', operator: 'isNull' }
{ field: 'errorMessage', operator: 'isNull' }
```

**Distinction:**
- `null` - returns `true`
- `undefined` - returns `false`
- Other values - return `false`

---

### `isNotNull`

Tests if field value is not `null`.

**Parameters:** None

**Examples:**
```typescript
{ field: 'userId', operator: 'isNotNull' }
{ field: 'data', operator: 'isNotNull' }
```

**Note:** Returns `true` for `undefined`

---

### `isDefined`

Tests if field value is not `undefined`.

**Parameters:** None

**Examples:**
```typescript
{ field: 'config.apiKey', operator: 'isDefined' }
{ field: 'settings.theme', operator: 'isDefined' }
```

**Distinction:**
- `undefined` - returns `false`
- `null` - returns `true`
- Other values - return `true`

---

### `isUndefined`

Tests if field value is exactly `undefined`.

**Parameters:** None

**Examples:**
```typescript
{ field: 'optionalSetting', operator: 'isUndefined' }
{ field: 'unusedField', operator: 'isUndefined' }
```

---

## Type Checking Operators

Operators for runtime type validation.

### `isString`

Tests if field value is a string.

**Parameters:** None

**Examples:**
```typescript
{ field: 'name', operator: 'isString' }
{ field: 'description', operator: 'isString' }
```

**Returns `true` for:**
- String primitives: `'hello'`
- String objects: `new String('hello')`
- Empty strings: `''`

**Returns `false` for:**
- Numbers: `123`
- Booleans: `true`
- `null`, `undefined`
- Arrays, objects

---

### `isNumber`

Tests if field value is a number.

**Parameters:** None

**Examples:**
```typescript
{ field: 'age', operator: 'isNumber' }
{ field: 'price', operator: 'isNumber' }
{ field: 'score', operator: 'isNumber' }
```

**Returns `true` for:**
- Number primitives: `42`
- Number objects: `new Number(42)`
- Floats: `3.14`
- Zero: `0`
- Negative numbers: `-5`
- `Infinity`, `-Infinity`
- **Note:** `NaN` returns `true` (it's type number)

**Returns `false` for:**
- String numbers: `'123'`
- Booleans
- `null`, `undefined`

---

### `isBoolean`

Tests if field value is a boolean.

**Parameters:** None

**Examples:**
```typescript
{ field: 'isActive', operator: 'isBoolean' }
{ field: 'completed', operator: 'isBoolean' }
```

**Returns `true` for:**
- Boolean primitives: `true`, `false`
- Boolean objects: `new Boolean(true)`

**Returns `false` for:**
- Truthy values: `1`, `'yes'`
- Falsy values: `0`, `''`, `null`

---

### `isArray`

Tests if field value is an array.

**Parameters:** None

**Examples:**
```typescript
{ field: 'tags', operator: 'isArray' }
{ field: 'items', operator: 'isArray' }
```

**Returns `true` for:**
- Arrays: `[]`, `[1, 2, 3]`
- Array-like but checks with `Array.isArray()`

**Returns `false` for:**
- Objects: `{}`
- Array-like objects: `{ 0: 'a', length: 1 }`
- `null`, `undefined`

---

### `isObject`

Tests if field value is an object (but not array or null).

**Parameters:** None

**Examples:**
```typescript
{ field: 'metadata', operator: 'isObject' }
{ field: 'settings', operator: 'isObject' }
{ field: 'address', operator: 'isObject' }
```

**Returns `true` for:**
- Plain objects: `{}`
- Instances: `new Date()`, `new Error()`
- Functions (they're objects)

**Returns `false` for:**
- `null` (even though `typeof null === 'object'`)
- Arrays
- Primitives: strings, numbers, booleans

---

## Change Detection Operators

Operators for detecting changes between current and previous data. **Requires `previousData` in evaluation context.**

### `changed`

Tests if field value changed from previous data.

**Parameters:** None

**Equality:** Uses deep equality check

**Examples:**
```typescript
{ field: 'status', operator: 'changed' }
{ field: 'email', operator: 'changed' }
{ field: 'settings.theme', operator: 'changed' }
```

**Evaluation:**
```typescript
engine.evaluate({
  data: { status: 'active' },
  previousData: { status: 'pending' }
});
// ✓ Changed

engine.evaluate({
  data: { status: 'active' },
  previousData: { status: 'active' }
});
// ✗ Not changed
```

**Edge Cases:**
- No `previousData` returns `false`
- Deep equality check for objects/arrays
- `undefined` → value counts as changed
- value → `undefined` counts as changed

---

### `changedFrom`

Tests if field value changed from a specific value.

**Parameters:**
- `value`: The previous value to check against

**Equality:** Uses deep equality check

**Examples:**
```typescript
// Status changed from pending
{ field: 'status', operator: 'changedFrom', value: 'pending' }

// Price changed from zero
{ field: 'price', operator: 'changedFrom', value: 0 }

// Flag changed from false
{ field: 'isActive', operator: 'changedFrom', value: false }
```

**Evaluation:**
```typescript
engine.evaluate({
  data: { status: 'active' },
  previousData: { status: 'pending' }
});
// With condition: { field: 'status', operator: 'changedFrom', value: 'pending' }
// ✓ Matches (was 'pending', now something else)
```

**Edge Cases:**
- No `previousData` returns `false`
- Current value must be different
- Previous value must equal specified value

---

### `changedTo`

Tests if field value changed to a specific value.

**Parameters:**
- `value`: The new value to check against

**Equality:** Uses deep equality check

**Examples:**
```typescript
// Status changed to active
{ field: 'status', operator: 'changedTo', value: 'active' }

// Became verified
{ field: 'isVerified', operator: 'changedTo', value: true }

// Price became zero
{ field: 'price', operator: 'changedTo', value: 0 }
```

**Evaluation:**
```typescript
engine.evaluate({
  data: { status: 'active' },
  previousData: { status: 'pending' }
});
// With condition: { field: 'status', operator: 'changedTo', value: 'active' }
// ✓ Matches (now 'active', was something else)
```

---

### `changedFromTo`

Tests if field value changed from one specific value to another.

**Parameters:**
- `from`: The previous value
- `to`: The new value

**Equality:** Uses deep equality check

**Examples:**
```typescript
// Status changed from pending to active
{
  field: 'status',
  operator: 'changedFromTo',
  from: 'pending',
  to: 'active'
}

// Subscription upgraded
{
  field: 'plan',
  operator: 'changedFromTo',
  from: 'free',
  to: 'premium'
}
```

**Evaluation:**
```typescript
engine.evaluate({
  data: { status: 'active' },
  previousData: { status: 'pending' }
});
// With condition: { field: 'status', operator: 'changedFromTo', from: 'pending', to: 'active' }
// ✓ Matches exactly
```

**Edge Cases:**
- Both `from` and `to` must match exactly
- No `previousData` returns `false`

---

### `increased`

Tests if numeric field value increased.

**Parameters:** None

**Type Coercion:** Converts values to numbers

**Examples:**
```typescript
{ field: 'followers', operator: 'increased' }
{ field: 'balance', operator: 'increased' }
{ field: 'score', operator: 'increased' }
```

**Evaluation:**
```typescript
engine.evaluate({
  data: { score: 100 },
  previousData: { score: 75 }
});
// ✓ Increased (100 > 75)

engine.evaluate({
  data: { score: 100 },
  previousData: { score: 100 }
});
// ✗ Not increased (same value)
```

**Edge Cases:**
- No `previousData` returns `false`
- Non-numeric values return `false`
- Requires strictly greater than (not equal)

---

### `decreased`

Tests if numeric field value decreased.

**Parameters:** None

**Type Coercion:** Converts values to numbers

**Examples:**
```typescript
{ field: 'stock', operator: 'decreased' }
{ field: 'errors', operator: 'decreased' }
{ field: 'temperature', operator: 'decreased' }
```

**Evaluation:**
```typescript
engine.evaluate({
  data: { stock: 10 },
  previousData: { stock: 50 }
});
// ✓ Decreased (10 < 50)
```

---

## Membership Operators

Operators for checking if a value is in a set.

### `in`

Tests if field value is in an array of allowed values.

**Parameters:**
- `value`: Array of allowed values

**Equality:** Uses strict equality (`===`)

**Examples:**
```typescript
// Status is one of these
{
  field: 'status',
  operator: 'in',
  value: ['active', 'pending', 'verified']
}

// Priority level check
{
  field: 'priority',
  operator: 'in',
  value: [1, 2, 3, 4, 5]
}

// Role whitelist
{
  field: 'role',
  operator: 'in',
  value: ['admin', 'moderator']
}
```

**Edge Cases:**
- Empty array returns `false`
- Works with any value type
- `null` and `undefined` can be in the array

---

### `notIn`

Tests if field value is not in an array of disallowed values.

**Parameters:**
- `value`: Array of disallowed values

**Equality:** Uses strict equality (`===`)

**Examples:**
```typescript
// Status is not any of these
{
  field: 'status',
  operator: 'notIn',
  value: ['deleted', 'banned', 'suspended']
}

// Not on blocklist
{
  field: 'userId',
  operator: 'notIn',
  value: blockedUserIds
}
```

**Edge Cases:**
- Empty array returns `true` (not in empty set)
- `null` field with `null` in array returns `false`

---

## Length Operators

Operators for checking the length of strings or arrays.

### `lengthEquals`

Tests if string or array length equals a specific value.

**Parameters:**
- `value`: Expected length (number)

**Applicable To:** Strings and arrays

**Examples:**
```typescript
// ZIP code length
{ field: 'zipCode', operator: 'lengthEquals', value: 5 }

// Array size
{ field: 'items', operator: 'lengthEquals', value: 3 }

// Fixed-length code
{ field: 'verificationCode', operator: 'lengthEquals', value: 6 }
```

**Edge Cases:**
- Non-string/non-array values return `false`
- Empty string has length 0
- `null` and `undefined` return `false`

---

### `lengthGreaterThan`

Tests if string or array length is greater than a value.

**Parameters:**
- `value`: Minimum length (exclusive)

**Examples:**
```typescript
// Password minimum
{ field: 'password', operator: 'lengthGreaterThan', value: 7 } // At least 8

// Must have items
{ field: 'cart', operator: 'lengthGreaterThan', value: 0 }

// Description length
{ field: 'description', operator: 'lengthGreaterThan', value: 100 }
```

---

### `lengthLessThan`

Tests if string or array length is less than a value.

**Parameters:**
- `value`: Maximum length (exclusive)

**Examples:**
```typescript
// Short name
{ field: 'username', operator: 'lengthLessThan', value: 21 } // Max 20

// Limited items
{ field: 'selections', operator: 'lengthLessThan', value: 6 } // Max 5
```

---

### `lengthGreaterThanOrEqual`

Tests if string or array length is greater than or equal to a value.

**Parameters:**
- `value`: Minimum length (inclusive)

**Examples:**
```typescript
// Password minimum
{ field: 'password', operator: 'lengthGreaterThanOrEqual', value: 8 }

// Required items
{ field: 'answers', operator: 'lengthGreaterThanOrEqual', value: 1 }
```

---

### `lengthLessThanOrEqual`

Tests if string or array length is less than or equal to a value.

**Parameters:**
- `value`: Maximum length (inclusive)

**Examples:**
```typescript
// Username maximum
{ field: 'username', operator: 'lengthLessThanOrEqual', value: 20 }

// Tweet length
{ field: 'tweet', operator: 'lengthLessThanOrEqual', value: 280 }

// Selection limit
{ field: 'choices', operator: 'lengthLessThanOrEqual', value: 5 }
```

---

## Operator Summary Table

| Operator | Category | Parameters | Description |
|----------|----------|------------|-------------|
| `equals` | Comparison | `value` | Deep equality check |
| `notEquals` | Comparison | `value` | Deep inequality check |
| `greaterThan` | Comparison | `value` | Numeric greater than |
| `lessThan` | Comparison | `value` | Numeric less than |
| `greaterThanOrEqual` | Comparison | `value` | Numeric ≥ |
| `lessThanOrEqual` | Comparison | `value` | Numeric ≤ |
| `between` | Comparison | `from`, `to` | Numeric range (inclusive) |
| `contains` | String | `value` | String contains substring |
| `notContains` | String | `value` | String doesn't contain substring |
| `startsWith` | String | `value` | String starts with prefix |
| `endsWith` | String | `value` | String ends with suffix |
| `matches` | String | `value` | Regex pattern match |
| `matchesAny` | String | `value` (array) | Matches any regex pattern |
| `includes` | Array | `value` | Array includes value |
| `excludes` | Array | `value` | Array doesn't include value |
| `includesAll` | Array | `value` (array) | Array includes all values |
| `includesAny` | Array | `value` (array) | Array includes any value |
| `isEmpty` | Array | none | Array is empty |
| `isNotEmpty` | Array | none | Array is not empty |
| `exists` | Existence | none | Not null or undefined |
| `notExists` | Existence | none | Null or undefined |
| `isNull` | Existence | none | Exactly null |
| `isNotNull` | Existence | none | Not null |
| `isDefined` | Existence | none | Not undefined |
| `isUndefined` | Existence | none | Exactly undefined |
| `isString` | Type | none | Value is string |
| `isNumber` | Type | none | Value is number |
| `isBoolean` | Type | none | Value is boolean |
| `isArray` | Type | none | Value is array |
| `isObject` | Type | none | Value is object (not array/null) |
| `changed` | Change | none | Value changed |
| `changedFrom` | Change | `value` | Changed from specific value |
| `changedTo` | Change | `value` | Changed to specific value |
| `changedFromTo` | Change | `from`, `to` | Changed from X to Y |
| `increased` | Change | none | Numeric value increased |
| `decreased` | Change | none | Numeric value decreased |
| `in` | Membership | `value` (array) | Value in array |
| `notIn` | Membership | `value` (array) | Value not in array |
| `lengthEquals` | Length | `value` | Length equals |
| `lengthGreaterThan` | Length | `value` | Length > |
| `lengthLessThan` | Length | `value` | Length < |
| `lengthGreaterThanOrEqual` | Length | `value` | Length ≥ |
| `lengthLessThanOrEqual` | Length | `value` | Length ≤ |
