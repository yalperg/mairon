import defaultOperators from '@/operators';

import type Operator from './Operator';

class Operators<T = unknown> {
  private operators: Map<string, Operator<T>> = new Map();
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
    return this.operators.get(name);
  }

  has(name: string): boolean {
    return this.operators.has(name);
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

export { Operators };
export default new Operators();
