import { clearOperators, getOperator } from '../../../src/operators';
import { registerArrayOperators } from '../../../src/operators/array';
import { EvaluationContext } from '../../../src/core/types';

describe('array operators', () => {
  beforeEach(() => {
    clearOperators();
    registerArrayOperators();
  });

  const ctx: EvaluationContext<unknown> = {
    data: {},
    previousData: {},
    context: {},
  };

  describe('includes/excludes', () => {
    test('includes with array', () => {
      const includes = getOperator('includes')!;

      expect(
        includes(
          [1, 2, 3],
          { field: 'x', operator: 'includes', value: 2 },
          ctx,
        ),
      ).toBe(true);
      expect(
        includes(
          [1, 2, 3],
          { field: 'x', operator: 'includes', value: 4 },
          ctx,
        ),
      ).toBe(false);
      expect(
        includes(
          ['a', 'b'],
          { field: 'x', operator: 'includes', value: 'a' },
          ctx,
        ),
      ).toBe(true);
    });

    test('excludes with array', () => {
      const excludes = getOperator('excludes')!;

      expect(
        excludes(
          [1, 2, 3],
          { field: 'x', operator: 'excludes', value: 4 },
          ctx,
        ),
      ).toBe(true);
      expect(
        excludes(
          [1, 2, 3],
          { field: 'x', operator: 'excludes', value: 2 },
          ctx,
        ),
      ).toBe(false);
    });

    test('non-array returns false', () => {
      const includes = getOperator('includes')!;

      expect(
        includes(
          'string',
          { field: 'x', operator: 'includes', value: 's' },
          ctx,
        ),
      ).toBe(false);
      expect(
        includes(123, { field: 'x', operator: 'includes', value: 1 }, ctx),
      ).toBe(false);
      expect(
        includes(null, { field: 'x', operator: 'includes', value: 1 }, ctx),
      ).toBe(false);
    });
  });

  describe('includesAll', () => {
    test('includes all elements', () => {
      const includesAll = getOperator('includesAll')!;

      expect(
        includesAll(
          [1, 2, 3, 4],
          { field: 'x', operator: 'includesAll', value: [2, 3] },
          ctx,
        ),
      ).toBe(true);
      expect(
        includesAll(
          [1, 2, 3],
          { field: 'x', operator: 'includesAll', value: [1, 2, 3] },
          ctx,
        ),
      ).toBe(true);
    });

    test('missing some elements', () => {
      const includesAll = getOperator('includesAll')!;

      expect(
        includesAll(
          [1, 2],
          { field: 'x', operator: 'includesAll', value: [1, 2, 3] },
          ctx,
        ),
      ).toBe(false);
      expect(
        includesAll(
          [1, 2, 3],
          { field: 'x', operator: 'includesAll', value: [4, 5] },
          ctx,
        ),
      ).toBe(false);
    });

    test('empty array checks', () => {
      const includesAll = getOperator('includesAll')!;

      expect(
        includesAll(
          [1, 2, 3],
          { field: 'x', operator: 'includesAll', value: [] },
          ctx,
        ),
      ).toBe(true);
      expect(
        includesAll(
          [],
          { field: 'x', operator: 'includesAll', value: [1] },
          ctx,
        ),
      ).toBe(false);
    });

    test('non-array value returns false', () => {
      const includesAll = getOperator('includesAll')!;

      expect(
        includesAll(
          [1, 2],
          { field: 'x', operator: 'includesAll', value: 'not-array' },
          ctx,
        ),
      ).toBe(false);
      expect(
        includesAll(
          'not-array',
          { field: 'x', operator: 'includesAll', value: [1] },
          ctx,
        ),
      ).toBe(false);
    });
  });

  describe('includesAny', () => {
    test('includes at least one element', () => {
      const includesAny = getOperator('includesAny')!;

      expect(
        includesAny(
          [1, 2, 3],
          { field: 'x', operator: 'includesAny', value: [2, 4, 5] },
          ctx,
        ),
      ).toBe(true);
      expect(
        includesAny(
          [1, 2, 3],
          { field: 'x', operator: 'includesAny', value: [3] },
          ctx,
        ),
      ).toBe(true);
    });

    test('no common elements', () => {
      const includesAny = getOperator('includesAny')!;

      expect(
        includesAny(
          [1, 2, 3],
          { field: 'x', operator: 'includesAny', value: [4, 5, 6] },
          ctx,
        ),
      ).toBe(false);
    });

    test('empty array checks', () => {
      const includesAny = getOperator('includesAny')!;

      expect(
        includesAny(
          [1, 2, 3],
          { field: 'x', operator: 'includesAny', value: [] },
          ctx,
        ),
      ).toBe(false);
      expect(
        includesAny(
          [],
          { field: 'x', operator: 'includesAny', value: [1] },
          ctx,
        ),
      ).toBe(false);
    });

    test('non-array value returns false', () => {
      const includesAny = getOperator('includesAny')!;

      expect(
        includesAny(
          [1, 2],
          { field: 'x', operator: 'includesAny', value: 'not-array' },
          ctx,
        ),
      ).toBe(false);
      expect(
        includesAny(
          'not-array',
          { field: 'x', operator: 'includesAny', value: [1] },
          ctx,
        ),
      ).toBe(false);
    });
  });

  describe('isEmpty/isNotEmpty', () => {
    test('isEmpty checks', () => {
      const isEmpty = getOperator('isEmpty')!;

      expect(isEmpty([], { field: 'x', operator: 'isEmpty' }, ctx)).toBe(true);
      expect(isEmpty([1], { field: 'x', operator: 'isEmpty' }, ctx)).toBe(
        false,
      );
      expect(isEmpty([1, 2, 3], { field: 'x', operator: 'isEmpty' }, ctx)).toBe(
        false,
      );
    });

    test('isNotEmpty checks', () => {
      const isNotEmpty = getOperator('isNotEmpty')!;

      expect(isNotEmpty([1], { field: 'x', operator: 'isNotEmpty' }, ctx)).toBe(
        true,
      );
      expect(
        isNotEmpty([1, 2, 3], { field: 'x', operator: 'isNotEmpty' }, ctx),
      ).toBe(true);
      expect(isNotEmpty([], { field: 'x', operator: 'isNotEmpty' }, ctx)).toBe(
        false,
      );
    });

    test('non-array returns false', () => {
      const isEmpty = getOperator('isEmpty')!;
      const isNotEmpty = getOperator('isNotEmpty')!;

      expect(isEmpty('string', { field: 'x', operator: 'isEmpty' }, ctx)).toBe(
        false,
      );
      expect(isEmpty(null, { field: 'x', operator: 'isEmpty' }, ctx)).toBe(
        false,
      );
      expect(isNotEmpty(123, { field: 'x', operator: 'isNotEmpty' }, ctx)).toBe(
        false,
      );
    });
  });
});
