import defaultOperators from '@/operators';

import type Operator from './Operator';

class Operators<T = unknown> {
  private operators: Map<string, Operator<T>> = new Map();
  private aliases: Map<string, string> = new Map();
  private readonly builtInNames: Set<string>;

  constructor(includeBuiltIn = true) {
    if (includeBuiltIn) {
      for (const [name, operator] of Object.entries(defaultOperators)) {
        this.operators.set(name, operator as Operator<T>);
      }
    }
    this.builtInNames = new Set(this.operators.keys());
  }

  register(operator: Operator<T>): void {
    this.operators.set(operator.name, operator);
  }

  unregister(name: string): boolean {
    if (this.builtInNames.has(name)) {
      return false;
    }
    return this.operators.delete(name);
  }

  get(name: string): Operator<T> | undefined {
    const resolvedName = this.aliases.get(name) ?? name;
    return this.operators.get(resolvedName);
  }

  has(name: string): boolean {
    const resolvedName = this.aliases.get(name) ?? name;
    return this.operators.has(resolvedName);
  }

  registerAlias(alias: string, target: string): void {
    this.aliases.set(alias, target);
  }

  unregisterAlias(alias: string): boolean {
    return this.aliases.delete(alias);
  }

  getAlias(alias: string): string | undefined {
    return this.aliases.get(alias);
  }

  hasAlias(alias: string): boolean {
    return this.aliases.has(alias);
  }

  listAliases(): Record<string, string> {
    return Object.fromEntries(this.aliases);
  }

  clearAliases(): void {
    this.aliases.clear();
  }

  isBuiltIn(name: string): boolean {
    return this.builtInNames.has(name);
  }

  clear(): void {
    this.operators.clear();
  }

  reset(): void {
    const customOperators = [...this.operators.keys()].filter(
      (name) => !this.builtInNames.has(name),
    );
    for (const name of customOperators) {
      this.operators.delete(name);
    }
  }

  list(): string[] {
    return Array.from(this.operators.keys());
  }

  listCustom(): string[] {
    return this.list().filter((name) => !this.builtInNames.has(name));
  }

  listBuiltIn(): string[] {
    return this.list().filter((name) => this.builtInNames.has(name));
  }
}

export default Operators;
