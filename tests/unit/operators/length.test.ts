import { clearOperators, getOperator } from '../../../src/operators';
import { registerLengthOperators } from '../../../src/operators/length';

describe('length operators', () => {
  beforeEach(() => {
    clearOperators();
    registerLengthOperators();
  });

  test('lengthEquals for strings', () => {
    const op = getOperator('lengthEquals')!;
    expect(
      op(
        'abc',
        { field: 'name', operator: 'lengthEquals', value: 3 },
        { data: {}, context: {} },
      ),
    ).toBe(true);
    expect(
      op(
        'abcd',
        { field: 'name', operator: 'lengthEquals', value: 3 },
        { data: {}, context: {} },
      ),
    ).toBe(false);
  });

  test('lengthEquals for arrays', () => {
    const op = getOperator('lengthEquals')!;
    expect(
      op(
        [1, 2, 3],
        { field: 'nums', operator: 'lengthEquals', value: 3 },
        { data: {}, context: {} },
      ),
    ).toBe(true);
    expect(
      op(
        [1, 2],
        { field: 'nums', operator: 'lengthEquals', value: 3 },
        { data: {}, context: {} },
      ),
    ).toBe(false);
  });

  test('greater/less than for strings', () => {
    const gt = getOperator('lengthGreaterThan')!;
    const lt = getOperator('lengthLessThan')!;
    const gte = getOperator('lengthGreaterThanOrEqual')!;
    const lte = getOperator('lengthLessThanOrEqual')!;

    expect(
      gt(
        'abcd',
        { field: 'x', operator: 'lengthGreaterThan', value: 3 },
        { data: {}, context: {} },
      ),
    ).toBe(true);
    expect(
      lt(
        'ab',
        { field: 'x', operator: 'lengthLessThan', value: 3 },
        { data: {}, context: {} },
      ),
    ).toBe(true);
    expect(
      gte(
        'abc',
        { field: 'x', operator: 'lengthGreaterThanOrEqual', value: 3 },
        { data: {}, context: {} },
      ),
    ).toBe(true);
    expect(
      lte(
        'abc',
        { field: 'x', operator: 'lengthLessThanOrEqual', value: 3 },
        { data: {}, context: {} },
      ),
    ).toBe(true);
  });

  test('invalid inputs return false', () => {
    const eq = getOperator('lengthEquals')!;
    expect(
      eq(
        123 as unknown as string,
        { field: 'x', operator: 'lengthEquals', value: 3 },
        { data: {}, context: {} },
      ),
    ).toBe(false);
    expect(
      eq(
        {} as unknown as string,
        { field: 'x', operator: 'lengthEquals', value: 3 },
        { data: {}, context: {} },
      ),
    ).toBe(false);
    // invalid target
    expect(
      eq(
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
