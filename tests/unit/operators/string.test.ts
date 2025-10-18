import { clearOperators, getOperator } from '../../../src/operators';
import { registerStringOperators } from '../../../src/operators/string';
import { EvaluationContext } from '../../../src/core/types';

describe('string operators', () => {
  beforeEach(() => {
    clearOperators();
    registerStringOperators();
  });

  const ctx: EvaluationContext<unknown> = {
    data: {},
    previousData: {},
    context: {},
  };

  describe('contains/notContains', () => {
    test('basic string contains', () => {
      const contains = getOperator('contains')!;

      expect(
        contains(
          'hello world',
          { field: 'x', operator: 'contains', value: 'world' },
          ctx,
        ),
      ).toBe(true);
      expect(
        contains(
          'hello world',
          { field: 'x', operator: 'contains', value: 'foo' },
          ctx,
        ),
      ).toBe(false);
    });

    test('case sensitive', () => {
      const contains = getOperator('contains')!;

      expect(
        contains(
          'Hello World',
          { field: 'x', operator: 'contains', value: 'world' },
          ctx,
        ),
      ).toBe(false);
      expect(
        contains(
          'Hello World',
          { field: 'x', operator: 'contains', value: 'World' },
          ctx,
        ),
      ).toBe(true);
    });

    test('type coercion', () => {
      const contains = getOperator('contains')!;

      expect(
        contains(123, { field: 'x', operator: 'contains', value: '2' }, ctx),
      ).toBe(true);
      expect(
        contains(true, { field: 'x', operator: 'contains', value: 'rue' }, ctx),
      ).toBe(true);
    });

    test('null/undefined handling', () => {
      const contains = getOperator('contains')!;

      expect(
        contains(
          null,
          { field: 'x', operator: 'contains', value: 'test' },
          ctx,
        ),
      ).toBe(false);
      expect(
        contains(
          'test',
          { field: 'x', operator: 'contains', value: null },
          ctx,
        ),
      ).toBe(false);
    });

    test('notContains', () => {
      const notContains = getOperator('notContains')!;

      expect(
        notContains(
          'hello world',
          { field: 'x', operator: 'notContains', value: 'foo' },
          ctx,
        ),
      ).toBe(true);
      expect(
        notContains(
          'hello world',
          { field: 'x', operator: 'notContains', value: 'world' },
          ctx,
        ),
      ).toBe(false);
    });
  });

  describe('startsWith/endsWith', () => {
    test('startsWith', () => {
      const startsWith = getOperator('startsWith')!;

      expect(
        startsWith(
          'hello world',
          { field: 'x', operator: 'startsWith', value: 'hello' },
          ctx,
        ),
      ).toBe(true);
      expect(
        startsWith(
          'hello world',
          { field: 'x', operator: 'startsWith', value: 'world' },
          ctx,
        ),
      ).toBe(false);
    });

    test('endsWith', () => {
      const endsWith = getOperator('endsWith')!;

      expect(
        endsWith(
          'hello world',
          { field: 'x', operator: 'endsWith', value: 'world' },
          ctx,
        ),
      ).toBe(true);
      expect(
        endsWith(
          'hello world',
          { field: 'x', operator: 'endsWith', value: 'hello' },
          ctx,
        ),
      ).toBe(false);
    });

    test('case sensitive', () => {
      const startsWith = getOperator('startsWith')!;
      const endsWith = getOperator('endsWith')!;

      expect(
        startsWith(
          'Hello',
          { field: 'x', operator: 'startsWith', value: 'hello' },
          ctx,
        ),
      ).toBe(false);
      expect(
        endsWith(
          'World',
          { field: 'x', operator: 'endsWith', value: 'world' },
          ctx,
        ),
      ).toBe(false);
    });

    test('type coercion', () => {
      const startsWith = getOperator('startsWith')!;
      const endsWith = getOperator('endsWith')!;

      expect(
        startsWith(
          123,
          { field: 'x', operator: 'startsWith', value: '1' },
          ctx,
        ),
      ).toBe(true);
      expect(
        endsWith(123, { field: 'x', operator: 'endsWith', value: '3' }, ctx),
      ).toBe(true);
    });
  });

  describe('matches', () => {
    test('basic regex', () => {
      const matches = getOperator('matches')!;

      expect(
        matches(
          'hello123',
          { field: 'x', operator: 'matches', value: '\\d+' },
          ctx,
        ),
      ).toBe(true);
      expect(
        matches(
          'hello',
          { field: 'x', operator: 'matches', value: '\\d+' },
          ctx,
        ),
      ).toBe(false);
    });

    test('email pattern', () => {
      const matches = getOperator('matches')!;
      const emailPattern = '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$';

      expect(
        matches(
          'test@example.com',
          { field: 'x', operator: 'matches', value: emailPattern },
          ctx,
        ),
      ).toBe(true);
      expect(
        matches(
          'invalid-email',
          { field: 'x', operator: 'matches', value: emailPattern },
          ctx,
        ),
      ).toBe(false);
    });

    test('invalid regex returns false', () => {
      const matches = getOperator('matches')!;

      expect(
        matches(
          'test',
          { field: 'x', operator: 'matches', value: '[invalid(' },
          ctx,
        ),
      ).toBe(false);
    });

    test('null handling', () => {
      const matches = getOperator('matches')!;

      expect(
        matches(null, { field: 'x', operator: 'matches', value: '.*' }, ctx),
      ).toBe(false);
      expect(
        matches('test', { field: 'x', operator: 'matches', value: null }, ctx),
      ).toBe(false);
    });
  });

  describe('matchesAny', () => {
    test('matches one of multiple patterns', () => {
      const matchesAny = getOperator('matchesAny')!;

      expect(
        matchesAny(
          'hello123',
          { field: 'x', operator: 'matchesAny', value: ['\\d+', '^world'] },
          ctx,
        ),
      ).toBe(true);
      expect(
        matchesAny(
          'hello',
          { field: 'x', operator: 'matchesAny', value: ['\\d+', '^world'] },
          ctx,
        ),
      ).toBe(false);
    });

    test('non-array value returns false', () => {
      const matchesAny = getOperator('matchesAny')!;

      expect(
        matchesAny(
          'test',
          { field: 'x', operator: 'matchesAny', value: 'pattern' },
          ctx,
        ),
      ).toBe(false);
    });

    test('skips invalid patterns', () => {
      const matchesAny = getOperator('matchesAny')!;

      expect(
        matchesAny(
          'hello123',
          { field: 'x', operator: 'matchesAny', value: ['[invalid(', '\\d+'] },
          ctx,
        ),
      ).toBe(true);
    });

    test('null handling', () => {
      const matchesAny = getOperator('matchesAny')!;

      expect(
        matchesAny(
          null,
          { field: 'x', operator: 'matchesAny', value: ['.*'] },
          ctx,
        ),
      ).toBe(false);
      expect(
        matchesAny(
          'test',
          { field: 'x', operator: 'matchesAny', value: [null, '.*'] },
          ctx,
        ),
      ).toBe(true);
    });
  });
});
