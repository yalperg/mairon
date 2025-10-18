import { clearOperators, getOperator } from '../../../src/operators';
import { registerTypeOperators } from '../../../src/operators/type';
import { EvaluationContext } from '../../../src/core/types';

describe('type operators', () => {
  beforeEach(() => {
    clearOperators();
    registerTypeOperators();
  });

  const ctx: EvaluationContext<unknown> = { data: {}, previousData: {}, context: {} };

  describe('isString', () => {
    test('returns true for strings', () => {
      const isString = getOperator('isString')!;

      expect(isString('hello', { field: 'x', operator: 'isString' }, ctx)).toBe(true);
      expect(isString('', { field: 'x', operator: 'isString' }, ctx)).toBe(true);
      expect(isString('123', { field: 'x', operator: 'isString' }, ctx)).toBe(true);
    });

    test('returns false for non-strings', () => {
      const isString = getOperator('isString')!;

      expect(isString(123, { field: 'x', operator: 'isString' }, ctx)).toBe(false);
      expect(isString(true, { field: 'x', operator: 'isString' }, ctx)).toBe(false);
      expect(isString(null, { field: 'x', operator: 'isString' }, ctx)).toBe(false);
      expect(isString(undefined, { field: 'x', operator: 'isString' }, ctx)).toBe(false);
      expect(isString([], { field: 'x', operator: 'isString' }, ctx)).toBe(false);
      expect(isString({}, { field: 'x', operator: 'isString' }, ctx)).toBe(false);
    });
  });

  describe('isNumber', () => {
    test('returns true for numbers', () => {
      const isNumber = getOperator('isNumber')!;

      expect(isNumber(123, { field: 'x', operator: 'isNumber' }, ctx)).toBe(true);
      expect(isNumber(0, { field: 'x', operator: 'isNumber' }, ctx)).toBe(true);
      expect(isNumber(-5, { field: 'x', operator: 'isNumber' }, ctx)).toBe(true);
      expect(isNumber(3.14, { field: 'x', operator: 'isNumber' }, ctx)).toBe(true);
    });

    test('returns false for NaN', () => {
      const isNumber = getOperator('isNumber')!;

      expect(isNumber(NaN, { field: 'x', operator: 'isNumber' }, ctx)).toBe(false);
    });

    test('returns false for non-numbers', () => {
      const isNumber = getOperator('isNumber')!;

      expect(isNumber('123', { field: 'x', operator: 'isNumber' }, ctx)).toBe(false);
      expect(isNumber(true, { field: 'x', operator: 'isNumber' }, ctx)).toBe(false);
      expect(isNumber(null, { field: 'x', operator: 'isNumber' }, ctx)).toBe(false);
      expect(isNumber(undefined, { field: 'x', operator: 'isNumber' }, ctx)).toBe(false);
      expect(isNumber([], { field: 'x', operator: 'isNumber' }, ctx)).toBe(false);
      expect(isNumber({}, { field: 'x', operator: 'isNumber' }, ctx)).toBe(false);
    });
  });

  describe('isBoolean', () => {
    test('returns true for booleans', () => {
      const isBoolean = getOperator('isBoolean')!;

      expect(isBoolean(true, { field: 'x', operator: 'isBoolean' }, ctx)).toBe(true);
      expect(isBoolean(false, { field: 'x', operator: 'isBoolean' }, ctx)).toBe(true);
    });

    test('returns false for non-booleans', () => {
      const isBoolean = getOperator('isBoolean')!;

      expect(isBoolean(1, { field: 'x', operator: 'isBoolean' }, ctx)).toBe(false);
      expect(isBoolean(0, { field: 'x', operator: 'isBoolean' }, ctx)).toBe(false);
      expect(isBoolean('true', { field: 'x', operator: 'isBoolean' }, ctx)).toBe(false);
      expect(isBoolean(null, { field: 'x', operator: 'isBoolean' }, ctx)).toBe(false);
      expect(isBoolean(undefined, { field: 'x', operator: 'isBoolean' }, ctx)).toBe(false);
    });
  });

  describe('isArray', () => {
    test('returns true for arrays', () => {
      const isArray = getOperator('isArray')!;

      expect(isArray([], { field: 'x', operator: 'isArray' }, ctx)).toBe(true);
      expect(isArray([1, 2, 3], { field: 'x', operator: 'isArray' }, ctx)).toBe(true);
      expect(isArray(['a', 'b'], { field: 'x', operator: 'isArray' }, ctx)).toBe(true);
    });

    test('returns false for non-arrays', () => {
      const isArray = getOperator('isArray')!;

      expect(isArray('array', { field: 'x', operator: 'isArray' }, ctx)).toBe(false);
      expect(isArray(123, { field: 'x', operator: 'isArray' }, ctx)).toBe(false);
      expect(isArray({}, { field: 'x', operator: 'isArray' }, ctx)).toBe(false);
      expect(isArray(null, { field: 'x', operator: 'isArray' }, ctx)).toBe(false);
      expect(isArray(undefined, { field: 'x', operator: 'isArray' }, ctx)).toBe(false);
    });
  });

  describe('isObject', () => {
    test('returns true for plain objects', () => {
      const isObject = getOperator('isObject')!;

      expect(isObject({}, { field: 'x', operator: 'isObject' }, ctx)).toBe(true);
      expect(isObject({ a: 1, b: 2 }, { field: 'x', operator: 'isObject' }, ctx)).toBe(true);
    });

    test('returns false for arrays', () => {
      const isObject = getOperator('isObject')!;

      expect(isObject([], { field: 'x', operator: 'isObject' }, ctx)).toBe(false);
      expect(isObject([1, 2, 3], { field: 'x', operator: 'isObject' }, ctx)).toBe(false);
    });

    test('returns false for other types', () => {
      const isObject = getOperator('isObject')!;

      expect(isObject('object', { field: 'x', operator: 'isObject' }, ctx)).toBe(false);
      expect(isObject(123, { field: 'x', operator: 'isObject' }, ctx)).toBe(false);
      expect(isObject(null, { field: 'x', operator: 'isObject' }, ctx)).toBe(false);
      expect(isObject(undefined, { field: 'x', operator: 'isObject' }, ctx)).toBe(false);
      expect(isObject(new Date(), { field: 'x', operator: 'isObject' }, ctx)).toBe(false);
    });
  });
});
