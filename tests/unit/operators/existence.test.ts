import { Operators } from '@/core';

import type { EvaluationContext } from '@/types';

const operators = new Operators();

describe('existence operators', () => {
  const ctx: EvaluationContext<unknown> = {
    data: {},
    previousData: {},
    context: {},
  };

  describe('exists/notExists', () => {
    test('exists checks for undefined only', () => {
      const exists = operators.get('exists')!;

      expect(
        exists.evaluate(null, { field: 'x', operator: 'exists' }, ctx),
      ).toBe(true);
      expect(exists.evaluate(0, { field: 'x', operator: 'exists' }, ctx)).toBe(
        true,
      );
      expect(exists.evaluate('', { field: 'x', operator: 'exists' }, ctx)).toBe(
        true,
      );
      expect(
        exists.evaluate(false, { field: 'x', operator: 'exists' }, ctx),
      ).toBe(true);
      expect(
        exists.evaluate(undefined, { field: 'x', operator: 'exists' }, ctx),
      ).toBe(false);
    });

    test('notExists checks for undefined only', () => {
      const notExists = operators.get('notExists')!;

      expect(
        notExists.evaluate(
          undefined,
          { field: 'x', operator: 'notExists' },
          ctx,
        ),
      ).toBe(true);
      expect(
        notExists.evaluate(null, { field: 'x', operator: 'notExists' }, ctx),
      ).toBe(false);
      expect(
        notExists.evaluate(0, { field: 'x', operator: 'notExists' }, ctx),
      ).toBe(false);
      expect(
        notExists.evaluate('', { field: 'x', operator: 'notExists' }, ctx),
      ).toBe(false);
    });
  });

  describe('isNull/isNotNull', () => {
    test('isNull checks for null only', () => {
      const isNull = operators.get('isNull')!;

      expect(
        isNull.evaluate(null, { field: 'x', operator: 'isNull' }, ctx),
      ).toBe(true);
      expect(
        isNull.evaluate(undefined, { field: 'x', operator: 'isNull' }, ctx),
      ).toBe(false);
      expect(isNull.evaluate(0, { field: 'x', operator: 'isNull' }, ctx)).toBe(
        false,
      );
      expect(isNull.evaluate('', { field: 'x', operator: 'isNull' }, ctx)).toBe(
        false,
      );
      expect(
        isNull.evaluate(false, { field: 'x', operator: 'isNull' }, ctx),
      ).toBe(false);
    });

    test('isNotNull checks for not null', () => {
      const isNotNull = operators.get('isNotNull')!;

      expect(
        isNotNull.evaluate(
          undefined,
          { field: 'x', operator: 'isNotNull' },
          ctx,
        ),
      ).toBe(true);
      expect(
        isNotNull.evaluate(0, { field: 'x', operator: 'isNotNull' }, ctx),
      ).toBe(true);
      expect(
        isNotNull.evaluate('', { field: 'x', operator: 'isNotNull' }, ctx),
      ).toBe(true);
      expect(
        isNotNull.evaluate(false, { field: 'x', operator: 'isNotNull' }, ctx),
      ).toBe(true);
      expect(
        isNotNull.evaluate(null, { field: 'x', operator: 'isNotNull' }, ctx),
      ).toBe(false);
    });
  });

  describe('isDefined/isUndefined', () => {
    test('isDefined checks for not undefined', () => {
      const isDefined = operators.get('isDefined')!;

      expect(
        isDefined.evaluate(null, { field: 'x', operator: 'isDefined' }, ctx),
      ).toBe(true);
      expect(
        isDefined.evaluate(0, { field: 'x', operator: 'isDefined' }, ctx),
      ).toBe(true);
      expect(
        isDefined.evaluate('', { field: 'x', operator: 'isDefined' }, ctx),
      ).toBe(true);
      expect(
        isDefined.evaluate(false, { field: 'x', operator: 'isDefined' }, ctx),
      ).toBe(true);
      expect(
        isDefined.evaluate(
          undefined,
          { field: 'x', operator: 'isDefined' },
          ctx,
        ),
      ).toBe(false);
    });

    test('isUndefined checks for undefined only', () => {
      const isUndefined = operators.get('isUndefined')!;

      expect(
        isUndefined.evaluate(
          undefined,
          { field: 'x', operator: 'isUndefined' },
          ctx,
        ),
      ).toBe(true);
      expect(
        isUndefined.evaluate(
          null,
          { field: 'x', operator: 'isUndefined' },
          ctx,
        ),
      ).toBe(false);
      expect(
        isUndefined.evaluate(0, { field: 'x', operator: 'isUndefined' }, ctx),
      ).toBe(false);
      expect(
        isUndefined.evaluate('', { field: 'x', operator: 'isUndefined' }, ctx),
      ).toBe(false);
    });
  });

  describe('null vs undefined distinction', () => {
    test('falsy values are not null or undefined', () => {
      const exists = operators.get('exists')!;
      const isNull = operators.get('isNull')!;
      const isDefined = operators.get('isDefined')!;

      expect(exists.evaluate(0, { field: 'x', operator: 'exists' }, ctx)).toBe(
        true,
      );
      expect(exists.evaluate('', { field: 'x', operator: 'exists' }, ctx)).toBe(
        true,
      );
      expect(
        exists.evaluate(false, { field: 'x', operator: 'exists' }, ctx),
      ).toBe(true);

      expect(isNull.evaluate(0, { field: 'x', operator: 'isNull' }, ctx)).toBe(
        false,
      );
      expect(isNull.evaluate('', { field: 'x', operator: 'isNull' }, ctx)).toBe(
        false,
      );
      expect(
        isNull.evaluate(false, { field: 'x', operator: 'isNull' }, ctx),
      ).toBe(false);

      expect(
        isDefined.evaluate(0, { field: 'x', operator: 'isDefined' }, ctx),
      ).toBe(true);
      expect(
        isDefined.evaluate('', { field: 'x', operator: 'isDefined' }, ctx),
      ).toBe(true);
      expect(
        isDefined.evaluate(false, { field: 'x', operator: 'isDefined' }, ctx),
      ).toBe(true);
    });
  });
});
