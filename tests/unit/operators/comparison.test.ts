import { clearOperators, getOperator } from '../../../src/operators';
import { registerComparisonOperators } from '../../../src/operators/comparison';
import { EvaluationContext } from '../../../src/core/types';

describe('comparison operators', () => {
  beforeEach(() => {
    clearOperators();
    registerComparisonOperators();
  });

  const ctx: EvaluationContext<unknown> = { data: {}, previousData: {}, context: {} };

  test('equals and notEquals', () => {
    const equals = getOperator('equals')!;
    const notEquals = getOperator('notEquals')!;

    expect(equals(5, { field: 'x', operator: 'equals', value: 5 }, ctx)).toBe(true);
    expect(equals(new Date('2020-01-01'), { field: 'x', operator: 'equals', value: new Date('2020-01-01') }, ctx)).toBe(true);
    expect(notEquals('a', { field: 'x', operator: 'notEquals', value: 'b' }, ctx)).toBe(true);
  });

  test('greaterThan/lessThan', () => {
    const gt = getOperator('greaterThan')!;
    const lt = getOperator('lessThan')!;

    expect(gt(10, { field: 'x', operator: 'greaterThan', value: 5 }, ctx)).toBe(true);
    expect(lt(3, { field: 'x', operator: 'lessThan', value: 5 }, ctx)).toBe(true);
    expect(gt('10', { field: 'x', operator: 'greaterThan', value: '9' }, ctx)).toBe(true);
    expect(lt('a', { field: 'x', operator: 'lessThan', value: 'b' }, ctx)).toBe(false);
  });

  test('gte/lte', () => {
    const gte = getOperator('greaterThanOrEqual')!;
    const lte = getOperator('lessThanOrEqual')!;

    expect(gte(5, { field: 'x', operator: 'greaterThanOrEqual', value: 5 }, ctx)).toBe(true);
    expect(lte(5, { field: 'x', operator: 'lessThanOrEqual', value: 5 }, ctx)).toBe(true);
  });

  test('between', () => {
    const between = getOperator('between')!;

    expect(between(5, { field: 'x', operator: 'between', value: [1, 10] }, ctx)).toBe(true);
    expect(between(new Date('2020-01-02'), { field: 'x', operator: 'between', value: [new Date('2020-01-01'), new Date('2020-01-03')] }, ctx)).toBe(true);
    expect(between('x', { field: 'x', operator: 'between', value: [1, 3] }, ctx)).toBe(false);
    expect(between(5, { field: 'x', operator: 'between', value: [10, 20] }, ctx)).toBe(false);
  });
});
