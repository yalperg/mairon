import { clearOperators, getOperator } from '../../../src/operators';
import { registerExistenceOperators } from '../../../src/operators/existence';
import { EvaluationContext } from '../../../src/core/types';

describe('existence operators', () => {
  beforeEach(() => {
    clearOperators();
    registerExistenceOperators();
  });

  const ctx: EvaluationContext<unknown> = {
    data: {},
    previousData: {},
    context: {},
  };

  describe('exists/notExists', () => {
    test('exists checks for undefined only', () => {
      const exists = getOperator('exists')!;

      expect(exists(null, { field: 'x', operator: 'exists' }, ctx)).toBe(true);
      expect(exists(0, { field: 'x', operator: 'exists' }, ctx)).toBe(true);
      expect(exists('', { field: 'x', operator: 'exists' }, ctx)).toBe(true);
      expect(exists(false, { field: 'x', operator: 'exists' }, ctx)).toBe(true);
      expect(exists(undefined, { field: 'x', operator: 'exists' }, ctx)).toBe(
        false,
      );
    });

    test('notExists checks for undefined only', () => {
      const notExists = getOperator('notExists')!;

      expect(
        notExists(undefined, { field: 'x', operator: 'notExists' }, ctx),
      ).toBe(true);
      expect(notExists(null, { field: 'x', operator: 'notExists' }, ctx)).toBe(
        false,
      );
      expect(notExists(0, { field: 'x', operator: 'notExists' }, ctx)).toBe(
        false,
      );
      expect(notExists('', { field: 'x', operator: 'notExists' }, ctx)).toBe(
        false,
      );
    });
  });

  describe('isNull/isNotNull', () => {
    test('isNull checks for null only', () => {
      const isNull = getOperator('isNull')!;

      expect(isNull(null, { field: 'x', operator: 'isNull' }, ctx)).toBe(true);
      expect(isNull(undefined, { field: 'x', operator: 'isNull' }, ctx)).toBe(
        false,
      );
      expect(isNull(0, { field: 'x', operator: 'isNull' }, ctx)).toBe(false);
      expect(isNull('', { field: 'x', operator: 'isNull' }, ctx)).toBe(false);
      expect(isNull(false, { field: 'x', operator: 'isNull' }, ctx)).toBe(
        false,
      );
    });

    test('isNotNull checks for not null', () => {
      const isNotNull = getOperator('isNotNull')!;

      expect(
        isNotNull(undefined, { field: 'x', operator: 'isNotNull' }, ctx),
      ).toBe(true);
      expect(isNotNull(0, { field: 'x', operator: 'isNotNull' }, ctx)).toBe(
        true,
      );
      expect(isNotNull('', { field: 'x', operator: 'isNotNull' }, ctx)).toBe(
        true,
      );
      expect(isNotNull(false, { field: 'x', operator: 'isNotNull' }, ctx)).toBe(
        true,
      );
      expect(isNotNull(null, { field: 'x', operator: 'isNotNull' }, ctx)).toBe(
        false,
      );
    });
  });

  describe('isDefined/isUndefined', () => {
    test('isDefined checks for not undefined', () => {
      const isDefined = getOperator('isDefined')!;

      expect(isDefined(null, { field: 'x', operator: 'isDefined' }, ctx)).toBe(
        true,
      );
      expect(isDefined(0, { field: 'x', operator: 'isDefined' }, ctx)).toBe(
        true,
      );
      expect(isDefined('', { field: 'x', operator: 'isDefined' }, ctx)).toBe(
        true,
      );
      expect(isDefined(false, { field: 'x', operator: 'isDefined' }, ctx)).toBe(
        true,
      );
      expect(
        isDefined(undefined, { field: 'x', operator: 'isDefined' }, ctx),
      ).toBe(false);
    });

    test('isUndefined checks for undefined only', () => {
      const isUndefined = getOperator('isUndefined')!;

      expect(
        isUndefined(undefined, { field: 'x', operator: 'isUndefined' }, ctx),
      ).toBe(true);
      expect(
        isUndefined(null, { field: 'x', operator: 'isUndefined' }, ctx),
      ).toBe(false);
      expect(isUndefined(0, { field: 'x', operator: 'isUndefined' }, ctx)).toBe(
        false,
      );
      expect(
        isUndefined('', { field: 'x', operator: 'isUndefined' }, ctx),
      ).toBe(false);
    });
  });

  describe('null vs undefined distinction', () => {
    test('falsy values are not null or undefined', () => {
      const exists = getOperator('exists')!;
      const isNull = getOperator('isNull')!;
      const isDefined = getOperator('isDefined')!;

      expect(exists(0, { field: 'x', operator: 'exists' }, ctx)).toBe(true);
      expect(exists('', { field: 'x', operator: 'exists' }, ctx)).toBe(true);
      expect(exists(false, { field: 'x', operator: 'exists' }, ctx)).toBe(true);

      expect(isNull(0, { field: 'x', operator: 'isNull' }, ctx)).toBe(false);
      expect(isNull('', { field: 'x', operator: 'isNull' }, ctx)).toBe(false);
      expect(isNull(false, { field: 'x', operator: 'isNull' }, ctx)).toBe(
        false,
      );

      expect(isDefined(0, { field: 'x', operator: 'isDefined' }, ctx)).toBe(
        true,
      );
      expect(isDefined('', { field: 'x', operator: 'isDefined' }, ctx)).toBe(
        true,
      );
      expect(isDefined(false, { field: 'x', operator: 'isDefined' }, ctx)).toBe(
        true,
      );
    });
  });
});
