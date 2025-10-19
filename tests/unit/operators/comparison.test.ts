import { EvaluationContext } from '../../../src/core/types';
import operators from '../../../src/core/Operators';

describe('comparison operators', () => {
  const ctx: EvaluationContext<unknown> = {
    data: {},
    previousData: {},
    context: {},
  };

  test('equals and notEquals', () => {
    const equals = operators.get('equals')!;
    const notEquals = operators.get('notEquals')!;

    expect(equals.evaluate(5, { field: 'x', operator: 'equals', value: 5 }, ctx)).toBe(
      true,
    );
    expect(
      equals.evaluate(
        new Date('2020-01-01'),
        { field: 'x', operator: 'equals', value: new Date('2020-01-01') },
        ctx,
      ),
    ).toBe(true);
    expect(
      notEquals.evaluate('a', { field: 'x', operator: 'notEquals', value: 'b' }, ctx),
    ).toBe(true);
  });

  test('greaterThan/lessThan', () => {
    const gt = operators.get('greaterThan')!;
    const lt = operators.get('lessThan')!;

    expect(gt.evaluate(10, { field: 'x', operator: 'greaterThan', value: 5 }, ctx)).toBe(
      true,
    );
    expect(lt.evaluate(3, { field: 'x', operator: 'lessThan', value: 5 }, ctx)).toBe(
      true,
    );
    expect(
      gt.evaluate('10', { field: 'x', operator: 'greaterThan', value: '9' }, ctx),
    ).toBe(true);
    expect(lt.evaluate('a', { field: 'x', operator: 'lessThan', value: 'b' }, ctx)).toBe(
      false,
    );
  });

  test('gte/lte', () => {
    const gte = operators.get('greaterThanOrEqual')!;
    const lte = operators.get('lessThanOrEqual')!;

    expect(
      gte.evaluate(5, { field: 'x', operator: 'greaterThanOrEqual', value: 5 }, ctx),
    ).toBe(true);
    expect(
      lte.evaluate(5, { field: 'x', operator: 'lessThanOrEqual', value: 5 }, ctx),
    ).toBe(true);
  });

  test('between', () => {
    const between = operators.get('between')!;

    expect(
      between.evaluate(5, { field: 'x', operator: 'between', value: [1, 10] }, ctx),
    ).toBe(true);
    expect(
      between.evaluate(
        new Date('2020-01-02'),
        {
          field: 'x',
          operator: 'between',
          value: [new Date('2020-01-01'), new Date('2020-01-03')],
        },
        ctx,
      ),
    ).toBe(true);
    expect(
      between.evaluate('x', { field: 'x', operator: 'between', value: [1, 3] }, ctx),
    ).toBe(false);
    expect(
      between.evaluate(5, { field: 'x', operator: 'between', value: [10, 20] }, ctx),
    ).toBe(false);
  });
});
