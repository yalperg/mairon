import { Evaluator } from '../../src/core/Evaluator';
import { clearOperators } from '../../src/operators';
import { registerComparisonOperators } from '../../src/operators/comparison';
import { registerStringOperators } from '../../src/operators/string';
import { registerArrayOperators } from '../../src/operators/array';
import { registerExistenceOperators } from '../../src/operators/existence';
import { registerTypeOperators } from '../../src/operators/type';
import { registerChangeOperators } from '../../src/operators/change';
import { registerMembershipOperators } from '../../src/operators/membership';
import { registerLengthOperators } from '../../src/operators/length';

function registerAllOps() {
  registerComparisonOperators();
  registerStringOperators();
  registerArrayOperators();
  registerExistenceOperators();
  registerTypeOperators();
  registerChangeOperators();
  registerMembershipOperators();
  registerLengthOperators();
}

describe('Evaluator', () => {
  beforeEach(() => {
    clearOperators();
    registerAllOps();
  });

  test('evaluates simple condition', () => {
    const evaluator = new Evaluator();
    const result = evaluator.evaluateCondition(
      { field: 'age', operator: 'greaterThan', value: 18 },
      { data: { age: 20 }, context: {} },
    );
    expect(result).toBe(true);
  });

  test('evaluates logical ALL group', () => {
    const evaluator = new Evaluator();
    const result = evaluator.evaluateCondition(
      {
        all: [
          { field: 'age', operator: 'greaterThan', value: 18 },
          { field: 'name', operator: 'startsWith', value: 'A' },
        ],
      },
      { data: { age: 20, name: 'Alice' }, context: {} },
    );
    expect(result).toBe(true);
  });

  test('evaluates logical ANY group', () => {
    const evaluator = new Evaluator();
    const result = evaluator.evaluateCondition(
      {
        any: [
          { field: 'age', operator: 'greaterThan', value: 18 },
          { field: 'name', operator: 'startsWith', value: 'B' },
        ],
      },
      { data: { age: 17, name: 'Bob' }, context: {} },
    );
    expect(result).toBe(true);
  });

  test('resolves templates in condition value', () => {
    const evaluator = new Evaluator();
    const result = evaluator.evaluateCondition(
      { field: 'greeting', operator: 'equals', value: 'Hello {{ data.name }}' },
      { data: { greeting: 'Hello John', name: 'John' }, context: {} },
    );
    expect(result).toBe(true);
  });

  test('change operators respect previousData', () => {
    const evaluator = new Evaluator();
    const result = evaluator.evaluateCondition(
      {
        field: 'status',
        operator: 'changedFromTo',
        from: 'pending',
        to: 'active',
      },
      {
        data: { status: 'active' },
        previousData: { status: 'pending' },
        context: {},
      },
    );
    expect(result).toBe(true);
  });
});
