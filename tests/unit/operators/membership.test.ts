import { operators } from '@/core';

describe('membership operators', () => {
  test('in: value present in array', () => {
    const op = operators.get('in')!;
    expect(
      op.evaluate(
        'apple',
        { field: 'fruit', operator: 'in', value: ['apple', 'banana'] },
        { data: {}, context: {} },
      ),
    ).toBe(true);
    expect(
      op.evaluate(
        'cherry',
        { field: 'fruit', operator: 'in', value: ['apple', 'banana'] },
        { data: {}, context: {} },
      ),
    ).toBe(false);
  });

  test('in: deep equality match (objects)', () => {
    const op = operators.get('in')!;
    const target = { id: 1, name: 'Alice' };
    const list = [
      { id: 2, name: 'Bob' },
      { id: 1, name: 'Alice' },
    ];
    expect(
      op.evaluate(
        target,
        { field: 'user', operator: 'in', value: list },
        { data: {}, context: {} },
      ),
    ).toBe(true);
  });

  test('notIn: value absent in array', () => {
    const op = operators.get('notIn')!;
    expect(
      op.evaluate(
        'apple',
        { field: 'fruit', operator: 'notIn', value: ['banana', 'orange'] },
        { data: {}, context: {} },
      ),
    ).toBe(true);
    expect(
      op.evaluate(
        'banana',
        { field: 'fruit', operator: 'notIn', value: ['banana', 'orange'] },
        { data: {}, context: {} },
      ),
    ).toBe(false);
  });

  test('invalid value type returns false', () => {
    const inOp = operators.get('in')!;
    const notInOp = operators.get('notIn')!;
    // value must be an array
    expect(
      inOp.evaluate(
        'a',
        { field: 'x', operator: 'in', value: 'abc' as unknown as string[] },
        { data: {}, context: {} },
      ),
    ).toBe(false);
    expect(
      notInOp.evaluate(
        'a',
        { field: 'x', operator: 'notIn', value: 'abc' as unknown as string[] },
        { data: {}, context: {} },
      ),
    ).toBe(false);
  });

  test('handles null and undefined correctly', () => {
    const inOp = operators.get('in')!;
    const notInOp = operators.get('notIn')!;
    expect(
      inOp.evaluate(
        null,
        { field: 'x', operator: 'in', value: [null, 'a'] },
        { data: {}, context: {} },
      ),
    ).toBe(true);
    expect(
      notInOp.evaluate(
        undefined,
        { field: 'x', operator: 'notIn', value: [1, 2, 3] },
        { data: {}, context: {} },
      ),
    ).toBe(true);
  });
});
