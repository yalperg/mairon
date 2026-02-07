# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-07

### Added

- **Custom Operators**: Register domain-specific operators with `registerOperator()`, supporting both sync and async functions
- **Operator Aliases**: Define alternative names for operators via `registerOperator()` with alias support
- **NOT Conditions**: Logical `not` group for negating condition blocks alongside `all` and `any`
- **Explainability**: `engine.explain()` method provides detailed breakdowns of why rules matched or didn't match
- **Rule Serialization**: Export/import engine state with `toJSON()`, `loadJSON()`, `exportRules()`, and `importRules()` methods
- **Async Operators**: Operators can now return Promises, enabling external API calls during evaluation
- **Rule Chaining**: Rules can trigger dependent rules automatically via the `triggers` array
- **Immutable Mode**: New `immutable` config option clones data before action execution, protecting original objects from mutation

### Changed

- Operators registry is now instance-based instead of a global singleton, allowing isolated engine instances
- `getRegisteredActions()` renamed to `getRegisteredHandlers()` for consistency
- `PerformanceMetrics` replaced with `Stats` and `StatsTracker` for cleaner statistics API
- Removed `enableTemplates` configuration option (templates are always enabled)
- Removed schema validation configuration option for simpler setup

### Documentation

- Added comprehensive JSDoc documentation across all public APIs

## [1.0.0] - 2025-10-21

### Added

#### Core Features
- **Rule Engine**: Powerful declarative rule engine with condition evaluation and action execution
- **43+ Operators**: Comprehensive operator set across multiple categories
  - Comparison operators: `equals`, `notEquals`, `greaterThan`, `lessThan`, `greaterThanOrEqual`, `lessThanOrEqual`, `between`
  - String operators: `contains`, `notContains`, `startsWith`, `endsWith`, `matches`, `matchesAny`
  - Array operators: `includes`, `excludes`, `includesAll`, `includesAny`, `isEmpty`, `isNotEmpty`
  - Existence operators: `exists`, `notExists`, `isNull`, `isNotNull`, `isDefined`, `isUndefined`
  - Type checking operators: `isString`, `isNumber`, `isBoolean`, `isArray`, `isObject`
  - Change detection operators: `changed`, `changedFrom`, `changedTo`, `changedFromTo`, `increased`, `decreased`
  - Membership operators: `in`, `notIn`
  - Length operators: `lengthEquals`, `lengthGreaterThan`, `lengthLessThan`, `lengthGreaterThanOrEqual`, `lengthLessThanOrEqual`

#### Advanced Features
- **Template System**: Dynamic value resolution with `{{ }}` syntax
  - Time expressions: `{{ now }}`, `{{ now +/- duration }}`
  - Data references: `{{ data.field.path }}`
  - Previous data references: `{{ previousData.field }}`
  - Context references: `{{ context.field }}`
- **Change Detection**: Compare current and previous data states
- **Event System**: Hook into evaluation lifecycle with events
  - `beforeEvaluate`, `afterEvaluate`, `ruleMatched`, `ruleSkipped`, `actionExecuted`, `actionFailed`, `error`
- **Performance Optimization**
  - Smart indexing for large rule sets
  - Field access caching
  - Template resolution caching
  - Short-circuit evaluation
- **Rule Management**
  - Add, remove, update, enable, disable rules
  - Query rules with filters (enabled, priority, tags, IDs)
  - Priority-based execution order
- **Action Handlers**
  - Register sync/async action handlers
  - Template resolution in action parameters
  - Error handling with `continueOnError` and `stopOnError`
- **Configuration Options**
  - Strict mode for missing handlers
  - Schema validation
  - Indexing toggle
  - Max rules per execution limit

#### Type Safety
- Full TypeScript support with generic types
- Comprehensive type definitions
- Type-safe rule definitions and handlers
- Zod schemas for runtime validation

#### Documentation
- **README**: Feature overview, quick start, and examples
- **Operators Guide**: Detailed documentation for all operators
- **Templates Guide**: Complete template system documentation

### Technical Details

#### Dependencies
- **Runtime**: lodash, zod
- **Development**: TypeScript, Jest, ESLint, Prettier, esbuild

#### Package Information
- **Package Name**: `mairon`
- **License**: MIT
- **Author**: Yunus Alper Göl
- **Repository**: https://github.com/yalperg/mairon
