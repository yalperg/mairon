import { Operators } from '@/core';

import type { EvaluationContext } from '@/types';

const operators = new Operators();

describe('array operators', () => {
  const ctx: EvaluationContext<unknown> = {
    data: {},
    previousData: {},
    context: {},
  };

  describe('includes/excludes', () => {
    test('includes with array', () => {
      const includes = operators.get('includes')!;

      expect(
        includes.evaluate(
          [1, 2, 3],
          { field: 'x', operator: 'includes', value: 2 },
          ctx,
        ),
      ).toBe(true);
      expect(
        includes.evaluate(
          [1, 2, 3],
          { field: 'x', operator: 'includes', value: 4 },
          ctx,
        ),
      ).toBe(false);
      expect(
        includes.evaluate(
          ['a', 'b'],
          { field: 'x', operator: 'includes', value: 'a' },
          ctx,
        ),
      ).toBe(true);
    });

    test('excludes with array', () => {
      const excludes = operators.get('excludes')!;

      expect(
        excludes.evaluate(
          [1, 2, 3],
          { field: 'x', operator: 'excludes', value: 4 },
          ctx,
        ),
      ).toBe(true);
      expect(
        excludes.evaluate(
          [1, 2, 3],
          { field: 'x', operator: 'excludes', value: 2 },
          ctx,
        ),
      ).toBe(false);
    });

    test('non-array returns false', () => {
      const includes = operators.get('includes')!;

      expect(
        includes.evaluate(
          'string',
          { field: 'x', operator: 'includes', value: 's' },
          ctx,
        ),
      ).toBe(false);
      expect(
        includes.evaluate(
          123,
          { field: 'x', operator: 'includes', value: 1 },
          ctx,
        ),
      ).toBe(false);
      expect(
        includes.evaluate(
          null,
          { field: 'x', operator: 'includes', value: 1 },
          ctx,
        ),
      ).toBe(false);
    });
  });

  describe('includesAll', () => {
    test('includes all elements', () => {
      const includesAll = operators.get('includesAll')!;

      expect(
        includesAll.evaluate(
          [1, 2, 3, 4],
          { field: 'x', operator: 'includesAll', value: [2, 3] },
          ctx,
        ),
      ).toBe(true);
      expect(
        includesAll.evaluate(
          [1, 2, 3],
          { field: 'x', operator: 'includesAll', value: [1, 2, 3] },
          ctx,
        ),
      ).toBe(true);
    });

    test('missing some elements', () => {
      const includesAll = operators.get('includesAll')!;

      expect(
        includesAll.evaluate(
          [1, 2],
          { field: 'x', operator: 'includesAll', value: [1, 2, 3] },
          ctx,
        ),
      ).toBe(false);
      expect(
        includesAll.evaluate(
          [1, 2, 3],
          { field: 'x', operator: 'includesAll', value: [4, 5] },
          ctx,
        ),
      ).toBe(false);
    });

    test('empty array checks', () => {
      const includesAll = operators.get('includesAll')!;

      expect(
        includesAll.evaluate(
          [1, 2, 3],
          { field: 'x', operator: 'includesAll', value: [] },
          ctx,
        ),
      ).toBe(true);
      expect(
        includesAll.evaluate(
          [],
          { field: 'x', operator: 'includesAll', value: [1] },
          ctx,
        ),
      ).toBe(false);
    });

    test('non-array value returns false', () => {
      const includesAll = operators.get('includesAll')!;

      expect(
        includesAll.evaluate(
          [1, 2],
          { field: 'x', operator: 'includesAll', value: 'not-array' },
          ctx,
        ),
      ).toBe(false);
      expect(
        includesAll.evaluate(
          'not-array',
          { field: 'x', operator: 'includesAll', value: [1] },
          ctx,
        ),
      ).toBe(false);
    });
  });

  describe('includesAny', () => {
    test('includes at least one element', () => {
      const includesAny = operators.get('includesAny')!;

      expect(
        includesAny.evaluate(
          [1, 2, 3],
          { field: 'x', operator: 'includesAny', value: [2, 4, 5] },
          ctx,
        ),
      ).toBe(true);
      expect(
        includesAny.evaluate(
          [1, 2, 3],
          { field: 'x', operator: 'includesAny', value: [3] },
          ctx,
        ),
      ).toBe(true);
    });

    test('no common elements', () => {
      const includesAny = operators.get('includesAny')!;

      expect(
        includesAny.evaluate(
          [1, 2, 3],
          { field: 'x', operator: 'includesAny', value: [4, 5, 6] },
          ctx,
        ),
      ).toBe(false);
    });

    test('empty array checks', () => {
      const includesAny = operators.get('includesAny')!;

      expect(
        includesAny.evaluate(
          [1, 2, 3],
          { field: 'x', operator: 'includesAny', value: [] },
          ctx,
        ),
      ).toBe(false);
      expect(
        includesAny.evaluate(
          [],
          { field: 'x', operator: 'includesAny', value: [1] },
          ctx,
        ),
      ).toBe(false);
    });

    test('non-array value returns false', () => {
      const includesAny = operators.get('includesAny')!;

      expect(
        includesAny.evaluate(
          [1, 2],
          { field: 'x', operator: 'includesAny', value: 'not-array' },
          ctx,
        ),
      ).toBe(false);
      expect(
        includesAny.evaluate(
          'not-array',
          { field: 'x', operator: 'includesAny', value: [1] },
          ctx,
        ),
      ).toBe(false);
    });
  });

  describe('isEmpty/isNotEmpty', () => {
    test('isEmpty checks', () => {
      const isEmpty = operators.get('isEmpty')!;

      expect(
        isEmpty.evaluate([], { field: 'x', operator: 'isEmpty' }, ctx),
      ).toBe(true);
      expect(
        isEmpty.evaluate([1], { field: 'x', operator: 'isEmpty' }, ctx),
      ).toBe(false);
      expect(
        isEmpty.evaluate([1, 2, 3], { field: 'x', operator: 'isEmpty' }, ctx),
      ).toBe(false);
    });

    test('isNotEmpty checks', () => {
      const isNotEmpty = operators.get('isNotEmpty')!;

      expect(
        isNotEmpty.evaluate([1], { field: 'x', operator: 'isNotEmpty' }, ctx),
      ).toBe(true);
      expect(
        isNotEmpty.evaluate(
          [1, 2, 3],
          { field: 'x', operator: 'isNotEmpty' },
          ctx,
        ),
      ).toBe(true);
      expect(
        isNotEmpty.evaluate([], { field: 'x', operator: 'isNotEmpty' }, ctx),
      ).toBe(false);
    });

    test('non-array returns false', () => {
      const isEmpty = operators.get('isEmpty')!;
      const isNotEmpty = operators.get('isNotEmpty')!;

      expect(
        isEmpty.evaluate('string', { field: 'x', operator: 'isEmpty' }, ctx),
      ).toBe(false);
      expect(
        isEmpty.evaluate(null, { field: 'x', operator: 'isEmpty' }, ctx),
      ).toBe(false);
      expect(
        isNotEmpty.evaluate(123, { field: 'x', operator: 'isNotEmpty' }, ctx),
      ).toBe(false);
    });
  });
});
