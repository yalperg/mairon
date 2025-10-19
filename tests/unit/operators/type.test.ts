import operators from '../../../src/core/Operators';
import { EvaluationContext } from '../../../src/core/types';

describe('type operators', () => {
  const ctx: EvaluationContext<unknown> = {
    data: {},
    previousData: {},
    context: {},
  };

  describe('isString', () => {
    test('returns true for strings', () => {
      const isString = operators.get('isString')!;

      expect(isString.evaluate('hello', { field: 'x', operator: 'isString' }, ctx)).toBe(
        true,
      );
      expect(isString.evaluate('', { field: 'x', operator: 'isString' }, ctx)).toBe(
        true,
      );
      expect(isString.evaluate('123', { field: 'x', operator: 'isString' }, ctx)).toBe(
        true,
      );
    });

    test('returns false for non-strings', () => {
      const isString = operators.get('isString')!;

      expect(isString.evaluate(123, { field: 'x', operator: 'isString' }, ctx)).toBe(
        false,
      );
      expect(isString.evaluate(true, { field: 'x', operator: 'isString' }, ctx)).toBe(
        false,
      );
      expect(isString.evaluate(null, { field: 'x', operator: 'isString' }, ctx)).toBe(
        false,
      );
      expect(
        isString.evaluate(undefined, { field: 'x', operator: 'isString' }, ctx),
      ).toBe(false);
      expect(isString.evaluate([], { field: 'x', operator: 'isString' }, ctx)).toBe(
        false,
      );
      expect(isString.evaluate({}, { field: 'x', operator: 'isString' }, ctx)).toBe(
        false,
      );
    });
  });

  describe('isNumber', () => {
    test('returns true for numbers', () => {
      const isNumber = operators.get('isNumber')!;

      expect(isNumber.evaluate(123, { field: 'x', operator: 'isNumber' }, ctx)).toBe(
        true,
      );
      expect(isNumber.evaluate(0, { field: 'x', operator: 'isNumber' }, ctx)).toBe(true);
      expect(isNumber.evaluate(-5, { field: 'x', operator: 'isNumber' }, ctx)).toBe(
        true,
      );
      expect(isNumber.evaluate(3.14, { field: 'x', operator: 'isNumber' }, ctx)).toBe(
        true,
      );
    });

    test('returns false for NaN', () => {
      const isNumber = operators.get('isNumber')!;

      expect(isNumber.evaluate(NaN, { field: 'x', operator: 'isNumber' }, ctx)).toBe(
        false,
      );
    });

    test('returns false for non-numbers', () => {
      const isNumber = operators.get('isNumber')!;

      expect(isNumber.evaluate('123', { field: 'x', operator: 'isNumber' }, ctx)).toBe(
        false,
      );
      expect(isNumber.evaluate(true, { field: 'x', operator: 'isNumber' }, ctx)).toBe(
        false,
      );
      expect(isNumber.evaluate(null, { field: 'x', operator: 'isNumber' }, ctx)).toBe(
        false,
      );
      expect(
        isNumber.evaluate(undefined, { field: 'x', operator: 'isNumber' }, ctx),
      ).toBe(false);
      expect(isNumber.evaluate([], { field: 'x', operator: 'isNumber' }, ctx)).toBe(
        false,
      );
      expect(isNumber.evaluate({}, { field: 'x', operator: 'isNumber' }, ctx)).toBe(
        false,
      );
    });
  });

  describe('isBoolean', () => {
    test('returns true for booleans', () => {
      const isBoolean = operators.get('isBoolean')!;

      expect(isBoolean.evaluate(true, { field: 'x', operator: 'isBoolean' }, ctx)).toBe(
        true,
      );
      expect(isBoolean.evaluate(false, { field: 'x', operator: 'isBoolean' }, ctx)).toBe(
        true,
      );
    });

    test('returns false for non-booleans', () => {
      const isBoolean = operators.get('isBoolean')!;

      expect(isBoolean.evaluate(1, { field: 'x', operator: 'isBoolean' }, ctx)).toBe(
        false,
      );
      expect(isBoolean.evaluate(0, { field: 'x', operator: 'isBoolean' }, ctx)).toBe(
        false,
      );
      expect(
        isBoolean.evaluate('true', { field: 'x', operator: 'isBoolean' }, ctx),
      ).toBe(false);
      expect(isBoolean.evaluate(null, { field: 'x', operator: 'isBoolean' }, ctx)).toBe(
        false,
      );
      expect(
        isBoolean.evaluate(undefined, { field: 'x', operator: 'isBoolean' }, ctx),
      ).toBe(false);
    });
  });

  describe('isArray', () => {
    test('returns true for arrays', () => {
      const isArray = operators.get('isArray')!;

      expect(isArray.evaluate([], { field: 'x', operator: 'isArray' }, ctx)).toBe(true);
      expect(isArray.evaluate([1, 2, 3], { field: 'x', operator: 'isArray' }, ctx)).toBe(
        true,
      );
      expect(
        isArray.evaluate(['a', 'b'], { field: 'x', operator: 'isArray' }, ctx),
      ).toBe(true);
    });

    test('returns false for non-arrays', () => {
      const isArray = operators.get('isArray')!;

      expect(isArray.evaluate('array', { field: 'x', operator: 'isArray' }, ctx)).toBe(
        false,
      );
      expect(isArray.evaluate(123, { field: 'x', operator: 'isArray' }, ctx)).toBe(
        false,
      );
      expect(isArray.evaluate({}, { field: 'x', operator: 'isArray' }, ctx)).toBe(false);
      expect(isArray.evaluate(null, { field: 'x', operator: 'isArray' }, ctx)).toBe(
        false,
      );
      expect(isArray.evaluate(undefined, { field: 'x', operator: 'isArray' }, ctx)).toBe(
        false,
      );
    });
  });

  describe('isObject', () => {
    test('returns true for plain objects', () => {
      const isObject = operators.get('isObject')!;

      expect(isObject.evaluate({}, { field: 'x', operator: 'isObject' }, ctx)).toBe(
        true,
      );
      expect(
        isObject.evaluate({ a: 1, b: 2 }, { field: 'x', operator: 'isObject' }, ctx),
      ).toBe(true);
    });

    test('returns false for arrays', () => {
      const isObject = operators.get('isObject')!;

      expect(isObject.evaluate([], { field: 'x', operator: 'isObject' }, ctx)).toBe(
        false,
      );
      expect(
        isObject.evaluate([1, 2, 3], { field: 'x', operator: 'isObject' }, ctx),
      ).toBe(false);
    });

    test('returns false for other types', () => {
      const isObject = operators.get('isObject')!;

      expect(
        isObject.evaluate('object', { field: 'x', operator: 'isObject' }, ctx),
      ).toBe(false);
      expect(isObject.evaluate(123, { field: 'x', operator: 'isObject' }, ctx)).toBe(
        false,
      );
      expect(isObject.evaluate(null, { field: 'x', operator: 'isObject' }, ctx)).toBe(
        false,
      );
      expect(
        isObject.evaluate(undefined, { field: 'x', operator: 'isObject' }, ctx),
      ).toBe(false);
      expect(
        isObject.evaluate(new Date(), { field: 'x', operator: 'isObject' }, ctx),
      ).toBe(false);
    });
  });
});
