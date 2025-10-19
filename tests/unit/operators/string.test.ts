import { operators } from '@/core';

import type { EvaluationContext } from '@/types';

describe('string operators', () => {
  const ctx: EvaluationContext<unknown> = {
    data: {},
    previousData: {},
    context: {},
  };

  describe('contains/notContains', () => {
    test('basic string contains', () => {
      const contains = operators.get('contains')!;

      expect(
        contains.evaluate(
          'hello world',
          { field: 'x', operator: 'contains', value: 'world' },
          ctx,
        ),
      ).toBe(true);
      expect(
        contains.evaluate(
          'hello world',
          { field: 'x', operator: 'contains', value: 'foo' },
          ctx,
        ),
      ).toBe(false);
    });

    test('case sensitive', () => {
      const contains = operators.get('contains')!;

      expect(
        contains.evaluate(
          'Hello World',
          { field: 'x', operator: 'contains', value: 'world' },
          ctx,
        ),
      ).toBe(false);
      expect(
        contains.evaluate(
          'Hello World',
          { field: 'x', operator: 'contains', value: 'World' },
          ctx,
        ),
      ).toBe(true);
    });

    test('type coercion', () => {
      const contains = operators.get('contains')!;

      expect(
        contains.evaluate(
          123,
          { field: 'x', operator: 'contains', value: '2' },
          ctx,
        ),
      ).toBe(true);
      expect(
        contains.evaluate(
          true,
          { field: 'x', operator: 'contains', value: 'rue' },
          ctx,
        ),
      ).toBe(true);
    });

    test('null/undefined handling', () => {
      const contains = operators.get('contains')!;

      expect(
        contains.evaluate(
          null,
          { field: 'x', operator: 'contains', value: 'test' },
          ctx,
        ),
      ).toBe(false);
      expect(
        contains.evaluate(
          'test',
          { field: 'x', operator: 'contains', value: null },
          ctx,
        ),
      ).toBe(false);
    });

    test('notContains', () => {
      const notContains = operators.get('notContains')!;

      expect(
        notContains.evaluate(
          'hello world',
          { field: 'x', operator: 'notContains', value: 'foo' },
          ctx,
        ),
      ).toBe(true);
      expect(
        notContains.evaluate(
          'hello world',
          { field: 'x', operator: 'notContains', value: 'world' },
          ctx,
        ),
      ).toBe(false);
    });
  });

  describe('startsWith/endsWith', () => {
    test('startsWith', () => {
      const startsWith = operators.get('startsWith')!;

      expect(
        startsWith.evaluate(
          'hello world',
          { field: 'x', operator: 'startsWith', value: 'hello' },
          ctx,
        ),
      ).toBe(true);
      expect(
        startsWith.evaluate(
          'hello world',
          { field: 'x', operator: 'startsWith', value: 'world' },
          ctx,
        ),
      ).toBe(false);
    });

    test('endsWith', () => {
      const endsWith = operators.get('endsWith')!;

      expect(
        endsWith.evaluate(
          'hello world',
          { field: 'x', operator: 'endsWith', value: 'world' },
          ctx,
        ),
      ).toBe(true);
      expect(
        endsWith.evaluate(
          'hello world',
          { field: 'x', operator: 'endsWith', value: 'hello' },
          ctx,
        ),
      ).toBe(false);
    });

    test('case sensitive', () => {
      const startsWith = operators.get('startsWith')!;
      const endsWith = operators.get('endsWith')!;

      expect(
        startsWith.evaluate(
          'Hello',
          { field: 'x', operator: 'startsWith', value: 'hello' },
          ctx,
        ),
      ).toBe(false);
      expect(
        endsWith.evaluate(
          'World',
          { field: 'x', operator: 'endsWith', value: 'world' },
          ctx,
        ),
      ).toBe(false);
    });

    test('type coercion', () => {
      const startsWith = operators.get('startsWith')!;
      const endsWith = operators.get('endsWith')!;

      expect(
        startsWith.evaluate(
          123,
          { field: 'x', operator: 'startsWith', value: '1' },
          ctx,
        ),
      ).toBe(true);
      expect(
        endsWith.evaluate(
          123,
          { field: 'x', operator: 'endsWith', value: '3' },
          ctx,
        ),
      ).toBe(true);
    });
  });

  describe('matches', () => {
    test('basic regex', () => {
      const matches = operators.get('matches')!;

      expect(
        matches.evaluate(
          'hello123',
          { field: 'x', operator: 'matches', value: '\\d+' },
          ctx,
        ),
      ).toBe(true);
      expect(
        matches.evaluate(
          'hello',
          { field: 'x', operator: 'matches', value: '\\d+' },
          ctx,
        ),
      ).toBe(false);
    });

    test('email pattern', () => {
      const matches = operators.get('matches')!;
      const emailPattern = '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$';

      expect(
        matches.evaluate(
          'test@example.com',
          { field: 'x', operator: 'matches', value: emailPattern },
          ctx,
        ),
      ).toBe(true);
      expect(
        matches.evaluate(
          'invalid-email',
          { field: 'x', operator: 'matches', value: emailPattern },
          ctx,
        ),
      ).toBe(false);
    });

    test('invalid regex returns false', () => {
      const matches = operators.get('matches')!;

      expect(
        matches.evaluate(
          'test',
          { field: 'x', operator: 'matches', value: '[invalid(' },
          ctx,
        ),
      ).toBe(false);
    });

    test('null handling', () => {
      const matches = operators.get('matches')!;

      expect(
        matches.evaluate(
          null,
          { field: 'x', operator: 'matches', value: '.*' },
          ctx,
        ),
      ).toBe(false);
      expect(
        matches.evaluate(
          'test',
          { field: 'x', operator: 'matches', value: null },
          ctx,
        ),
      ).toBe(false);
    });
  });

  describe('matchesAny', () => {
    test('matches one of multiple patterns', () => {
      const matchesAny = operators.get('matchesAny')!;

      expect(
        matchesAny.evaluate(
          'hello123',
          { field: 'x', operator: 'matchesAny', value: ['\\d+', '^world'] },
          ctx,
        ),
      ).toBe(true);
      expect(
        matchesAny.evaluate(
          'hello',
          { field: 'x', operator: 'matchesAny', value: ['\\d+', '^world'] },
          ctx,
        ),
      ).toBe(false);
    });

    test('non-array value returns false', () => {
      const matchesAny = operators.get('matchesAny')!;

      expect(
        matchesAny.evaluate(
          'test',
          { field: 'x', operator: 'matchesAny', value: 'pattern' },
          ctx,
        ),
      ).toBe(false);
    });

    test('skips invalid patterns', () => {
      const matchesAny = operators.get('matchesAny')!;

      expect(
        matchesAny.evaluate(
          'hello123',
          { field: 'x', operator: 'matchesAny', value: ['[invalid(', '\\d+'] },
          ctx,
        ),
      ).toBe(true);
    });

    test('null handling', () => {
      const matchesAny = operators.get('matchesAny')!;

      expect(
        matchesAny.evaluate(
          null,
          { field: 'x', operator: 'matchesAny', value: ['.*'] },
          ctx,
        ),
      ).toBe(false);
      expect(
        matchesAny.evaluate(
          'test',
          { field: 'x', operator: 'matchesAny', value: [null, '.*'] },
          ctx,
        ),
      ).toBe(true);
    });
  });
});
