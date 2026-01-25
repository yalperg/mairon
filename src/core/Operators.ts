import defaultOperators from '@/operators';

import type Operator from './Operator';

/**
 * Registry for managing operators (both built-in and custom).
 *
 * This class maintains a collection of operators that can be used in rule conditions.
 * It supports:
 * - 43 built-in operators (equals, contains, greaterThan, etc.)
 * - Custom operator registration
 * - Operator aliases (e.g., 'eq' → 'equals')
 *
 * @typeParam T - The type of data the operators work with
 *
 * @example
 * ```typescript
 * const operators = new Operators();
 *
 * // Check if operator exists
 * operators.has('equals'); // true
 *
 * // Register custom operator
 * operators.register(new Operator('isEven', (v) => v % 2 === 0));
 *
 * // Create alias
 * operators.registerAlias('eq', 'equals');
 * ```
 */
class Operators<T = unknown> {
  private operators: Map<string, Operator<T>> = new Map();
  private aliases: Map<string, string> = new Map();
  private readonly builtInNames: Set<string>;

  /**
   * Creates a new Operators registry.
   *
   * @param includeBuiltIn - Whether to include the 43 built-in operators (default: true)
   *
   * @example
   * ```typescript
   * // With built-in operators
   * const ops = new Operators();
   *
   * // Without built-in operators (custom only)
   * const customOnly = new Operators(false);
   * ```
   */
  constructor(includeBuiltIn = true) {
    if (includeBuiltIn) {
      for (const [name, operator] of Object.entries(defaultOperators)) {
        this.operators.set(name, operator as Operator<T>);
      }
    }
    this.builtInNames = new Set(this.operators.keys());
  }

  /**
   * Registers a new operator.
   *
   * @param operator - The operator instance to register
   */
  register(operator: Operator<T>): void {
    this.operators.set(operator.name, operator);
  }

  /**
   * Unregisters a custom operator.
   * Built-in operators cannot be unregistered.
   *
   * @param name - The operator name to unregister
   * @returns true if removed, false if not found or is built-in
   */
  unregister(name: string): boolean {
    if (this.builtInNames.has(name)) {
      return false;
    }
    return this.operators.delete(name);
  }

  /**
   * Gets an operator by name or alias.
   *
   * @param name - The operator name or alias
   * @returns The operator if found, undefined otherwise
   */
  get(name: string): Operator<T> | undefined {
    const resolvedName = this.aliases.get(name) ?? name;
    return this.operators.get(resolvedName);
  }

  /**
   * Checks if an operator exists (by name or alias).
   *
   * @param name - The operator name or alias to check
   * @returns true if the operator exists
   */
  has(name: string): boolean {
    const resolvedName = this.aliases.get(name) ?? name;
    return this.operators.has(resolvedName);
  }

  /**
   * Registers an alias for an existing operator.
   *
   * @param alias - The alias name
   * @param target - The target operator name
   */
  registerAlias(alias: string, target: string): void {
    this.aliases.set(alias, target);
  }

  /**
   * Removes an alias.
   *
   * @param alias - The alias to remove
   * @returns true if removed, false if not found
   */
  unregisterAlias(alias: string): boolean {
    return this.aliases.delete(alias);
  }

  /**
   * Gets the target operator name for an alias.
   *
   * @param alias - The alias name
   * @returns The target operator name, or undefined if not found
   */
  getAlias(alias: string): string | undefined {
    return this.aliases.get(alias);
  }

  /**
   * Checks if an alias exists.
   *
   * @param alias - The alias name to check
   * @returns true if the alias exists
   */
  hasAlias(alias: string): boolean {
    return this.aliases.has(alias);
  }

  /**
   * Returns all registered aliases.
   *
   * @returns Object mapping alias names to target operator names
   */
  listAliases(): Record<string, string> {
    return Object.fromEntries(this.aliases);
  }

  /**
   * Removes all aliases.
   */
  clearAliases(): void {
    this.aliases.clear();
  }

  /**
   * Checks if an operator is built-in.
   *
   * @param name - The operator name to check
   * @returns true if the operator is built-in
   */
  isBuiltIn(name: string): boolean {
    return this.builtInNames.has(name);
  }

  /**
   * Removes all operators (including built-in).
   * Use with caution - typically you want `reset()` instead.
   */
  clear(): void {
    this.operators.clear();
  }

  /**
   * Removes all custom operators, keeping built-in operators.
   */
  reset(): void {
    const customOperators = [...this.operators.keys()].filter(
      (name) => !this.builtInNames.has(name),
    );
    for (const name of customOperators) {
      this.operators.delete(name);
    }
  }

  /**
   * Returns all operator names (built-in and custom).
   *
   * @returns Array of operator names
   */
  list(): string[] {
    return Array.from(this.operators.keys());
  }

  /**
   * Returns only custom operator names.
   *
   * @returns Array of custom operator names
   */
  listCustom(): string[] {
    return this.list().filter((name) => !this.builtInNames.has(name));
  }

  /**
   * Returns only built-in operator names.
   *
   * @returns Array of built-in operator names
   */
  listBuiltIn(): string[] {
    return this.list().filter((name) => this.builtInNames.has(name));
  }
}

export default Operators;
