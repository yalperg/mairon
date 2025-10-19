import { operators } from '@/core';

describe('length operators', () => {
  test('lengthEquals for strings', () => {
    const op = operators.get('lengthEquals')!;
    expect(
      op.evaluate(
        'abc',
        { field: 'name', operator: 'lengthEquals', value: 3 },
        { data: {}, context: {} },
      ),
    ).toBe(true);
    expect(
      op.evaluate(
        'abcd',
        { field: 'name', operator: 'lengthEquals', value: 3 },
        { data: {}, context: {} },
      ),
    ).toBe(false);
  });

  test('lengthEquals for arrays', () => {
    const op = operators.get('lengthEquals')!;
    expect(
      op.evaluate(
        [1, 2, 3],
        { field: 'nums', operator: 'lengthEquals', value: 3 },
        { data: {}, context: {} },
      ),
    ).toBe(true);
    expect(
      op.evaluate(
        [1, 2],
        { field: 'nums', operator: 'lengthEquals', value: 3 },
        { data: {}, context: {} },
      ),
    ).toBe(false);
  });

  test('greater/less than for strings', () => {
    const gt = operators.get('lengthGreaterThan')!;
    const lt = operators.get('lengthLessThan')!;
    const gte = operators.get('lengthGreaterThanOrEqual')!;
    const lte = operators.get('lengthLessThanOrEqual')!;

    expect(
      gt.evaluate(
        'abcd',
        { field: 'x', operator: 'lengthGreaterThan', value: 3 },
        { data: {}, context: {} },
      ),
    ).toBe(true);
    expect(
      lt.evaluate(
        'ab',
        { field: 'x', operator: 'lengthLessThan', value: 3 },
        { data: {}, context: {} },
      ),
    ).toBe(true);
    expect(
      gte.evaluate(
        'abc',
        { field: 'x', operator: 'lengthGreaterThanOrEqual', value: 3 },
        { data: {}, context: {} },
      ),
    ).toBe(true);
    expect(
      lte.evaluate(
        'abc',
        { field: 'x', operator: 'lengthLessThanOrEqual', value: 3 },
        { data: {}, context: {} },
      ),
    ).toBe(true);
  });

  test('invalid inputs return false', () => {
    const eq = operators.get('lengthEquals')!;
    expect(
      eq.evaluate(
        123 as unknown as string,
        { field: 'x', operator: 'lengthEquals', value: 3 },
        { data: {}, context: {} },
      ),
    ).toBe(false);
    expect(
      eq.evaluate(
        {} as unknown as string,
        { field: 'x', operator: 'lengthEquals', value: 3 },
        { data: {}, context: {} },
      ),
    ).toBe(false);
    // invalid target
    expect(
      eq.evaluate(
        'abc',
        {
          field: 'x',
          operator: 'lengthEquals',
          value: '3' as unknown as number,
        },
        { data: {}, context: {} },
      ),
    ).toBe(false);
  });
});
