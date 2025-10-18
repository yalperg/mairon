import { clearOperators, getOperator } from '../../../src/operators';
import { registerMembershipOperators } from '../../../src/operators/membership';
import { registerComparisonOperators } from '../../../src/operators/comparison';

describe('membership operators', () => {
  beforeEach(() => {
    clearOperators();
    // include equals for some sanity checks in tests
    registerComparisonOperators();
    registerMembershipOperators();
  });

  test('in: value present in array', () => {
    const op = getOperator('in')!;
    expect(
      op(
        'apple',
        { field: 'fruit', operator: 'in', value: ['apple', 'banana'] },
        { data: {}, context: {} },
      ),
    ).toBe(true);
    expect(
      op(
        'cherry',
        { field: 'fruit', operator: 'in', value: ['apple', 'banana'] },
        { data: {}, context: {} },
      ),
    ).toBe(false);
  });

  test('in: deep equality match (objects)', () => {
    const op = getOperator('in')!;
    const target = { id: 1, name: 'Alice' };
    const list = [
      { id: 2, name: 'Bob' },
      { id: 1, name: 'Alice' },
    ];
    expect(
      op(
        target,
        { field: 'user', operator: 'in', value: list },
        { data: {}, context: {} },
      ),
    ).toBe(true);
  });

  test('notIn: value absent in array', () => {
    const op = getOperator('notIn')!;
    expect(
      op(
        'apple',
        { field: 'fruit', operator: 'notIn', value: ['banana', 'orange'] },
        { data: {}, context: {} },
      ),
    ).toBe(true);
    expect(
      op(
        'banana',
        { field: 'fruit', operator: 'notIn', value: ['banana', 'orange'] },
        { data: {}, context: {} },
      ),
    ).toBe(false);
  });

  test('invalid value type returns false', () => {
    const inOp = getOperator('in')!;
    const notInOp = getOperator('notIn')!;
    // value must be an array
    expect(
      inOp(
        'a',
        { field: 'x', operator: 'in', value: 'abc' as unknown as string[] },
        { data: {}, context: {} },
      ),
    ).toBe(false);
    expect(
      notInOp(
        'a',
        { field: 'x', operator: 'notIn', value: 'abc' as unknown as string[] },
        { data: {}, context: {} },
      ),
    ).toBe(false);
  });

  test('handles null and undefined correctly', () => {
    const inOp = getOperator('in')!;
    const notInOp = getOperator('notIn')!;
    expect(
      inOp(
        null,
        { field: 'x', operator: 'in', value: [null, 'a'] },
        { data: {}, context: {} },
      ),
    ).toBe(true);
    expect(
      notInOp(
        undefined,
        { field: 'x', operator: 'notIn', value: [1, 2, 3] },
        { data: {}, context: {} },
      ),
    ).toBe(true);
  });
});
