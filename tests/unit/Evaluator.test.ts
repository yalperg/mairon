import { Evaluator } from '@/core';

describe('Evaluator', () => {
  test('evaluates simple condition', () => {
    const evaluator = new Evaluator();
    const result = evaluator.evaluateCondition(
      { field: 'age', operator: 'greaterThan', value: 18 },
      { data: { age: 20 }, context: {} },
    );
    expect(result).toBe(true);
  });

  test('evaluates logical ALL group', () => {
    const evaluator = new Evaluator();
    const result = evaluator.evaluateCondition(
      {
        all: [
          { field: 'age', operator: 'greaterThan', value: 18 },
          { field: 'name', operator: 'startsWith', value: 'A' },
        ],
      },
      { data: { age: 20, name: 'Alice' }, context: {} },
    );
    expect(result).toBe(true);
  });

  test('evaluates logical ANY group', () => {
    const evaluator = new Evaluator();
    const result = evaluator.evaluateCondition(
      {
        any: [
          { field: 'age', operator: 'greaterThan', value: 18 },
          { field: 'name', operator: 'startsWith', value: 'B' },
        ],
      },
      { data: { age: 17, name: 'Bob' }, context: {} },
    );
    expect(result).toBe(true);
  });

  test('resolves templates in condition value', () => {
    const evaluator = new Evaluator();
    const result = evaluator.evaluateCondition(
      { field: 'greeting', operator: 'equals', value: 'Hello {{ data.name }}' },
      { data: { greeting: 'Hello John', name: 'John' }, context: {} },
    );
    expect(result).toBe(true);
  });

  test('change operators respect previousData', () => {
    const evaluator = new Evaluator();
    const result = evaluator.evaluateCondition(
      {
        field: 'status',
        operator: 'changedFromTo',
        from: 'pending',
        to: 'active',
      },
      {
        data: { status: 'active' },
        previousData: { status: 'pending' },
        context: {},
      },
    );
    expect(result).toBe(true);
  });

  test('evaluates NOT condition - negates simple condition', () => {
    const evaluator = new Evaluator();
    const result = evaluator.evaluateCondition(
      { not: { field: 'status', operator: 'equals', value: 'inactive' } },
      { data: { status: 'active' }, context: {} },
    );
    expect(result).toBe(true);
  });

  test('evaluates NOT condition - negates true to false', () => {
    const evaluator = new Evaluator();
    const result = evaluator.evaluateCondition(
      { not: { field: 'status', operator: 'equals', value: 'active' } },
      { data: { status: 'active' }, context: {} },
    );
    expect(result).toBe(false);
  });

  test('evaluates NOT with nested logical group', () => {
    const evaluator = new Evaluator();
    const result = evaluator.evaluateCondition(
      {
        not: {
          all: [
            { field: 'role', operator: 'equals', value: 'admin' },
            { field: 'active', operator: 'equals', value: true },
          ],
        },
      },
      { data: { role: 'admin', active: false }, context: {} },
    );
    expect(result).toBe(true);
  });

  test('evaluates nested NOT conditions', () => {
    const evaluator = new Evaluator();
    const result = evaluator.evaluateCondition(
      { not: { not: { field: 'status', operator: 'equals', value: 'active' } } },
      { data: { status: 'active' }, context: {} },
    );
    expect(result).toBe(true);
  });

  test('evaluates NOT combined with ALL', () => {
    const evaluator = new Evaluator();
    const result = evaluator.evaluateCondition(
      {
        all: [
          { field: 'role', operator: 'equals', value: 'user' },
          { not: { field: 'banned', operator: 'equals', value: true } },
        ],
      },
      { data: { role: 'user', banned: false }, context: {} },
    );
    expect(result).toBe(true);
  });

  describe('explainCondition', () => {
    test('explains simple condition - pass', () => {
      const evaluator = new Evaluator();
      const explanation = evaluator.explainCondition(
        { field: 'age', operator: 'greaterThan', value: 18 },
        { data: { age: 25 } },
      );
      expect(explanation).toEqual({
        type: 'simple',
        field: 'age',
        operator: 'greaterThan',
        expected: 18,
        actual: 25,
        passed: true,
      });
    });

    test('explains simple condition - fail', () => {
      const evaluator = new Evaluator();
      const explanation = evaluator.explainCondition(
        { field: 'age', operator: 'greaterThan', value: 18 },
        { data: { age: 16 } },
      );
      expect(explanation).toEqual({
        type: 'simple',
        field: 'age',
        operator: 'greaterThan',
        expected: 18,
        actual: 16,
        passed: false,
      });
    });

    test('explains ALL group with mixed results', () => {
      const evaluator = new Evaluator();
      const explanation = evaluator.explainCondition(
        {
          all: [
            { field: 'age', operator: 'greaterThan', value: 18 },
            { field: 'verified', operator: 'equals', value: true },
          ],
        },
        { data: { age: 25, verified: false } },
      );
      expect(explanation.type).toBe('all');
      expect(explanation.passed).toBe(false);
      expect('children' in explanation && explanation.children).toHaveLength(2);
      if ('children' in explanation) {
        expect(explanation.children[0].passed).toBe(true);
        expect(explanation.children[1].passed).toBe(false);
      }
    });

    test('explains ANY group with mixed results', () => {
      const evaluator = new Evaluator();
      const explanation = evaluator.explainCondition(
        {
          any: [
            { field: 'role', operator: 'equals', value: 'admin' },
            { field: 'role', operator: 'equals', value: 'moderator' },
          ],
        },
        { data: { role: 'admin' } },
      );
      expect(explanation.type).toBe('any');
      expect(explanation.passed).toBe(true);
      if ('children' in explanation) {
        expect(explanation.children[0].passed).toBe(true);
        expect(explanation.children[1].passed).toBe(false);
      }
    });

    test('explains NOT condition', () => {
      const evaluator = new Evaluator();
      const explanation = evaluator.explainCondition(
        { not: { field: 'banned', operator: 'equals', value: true } },
        { data: { banned: false } },
      );
      expect(explanation.type).toBe('not');
      expect(explanation.passed).toBe(true);
      if ('children' in explanation) {
        expect(explanation.children[0].passed).toBe(false);
      }
    });

    test('explains nested conditions', () => {
      const evaluator = new Evaluator();
      const explanation = evaluator.explainCondition(
        {
          all: [
            { field: 'age', operator: 'greaterThan', value: 18 },
            {
              any: [
                { field: 'role', operator: 'equals', value: 'admin' },
                { field: 'role', operator: 'equals', value: 'user' },
              ],
            },
          ],
        },
        { data: { age: 25, role: 'user' } },
      );
      expect(explanation.type).toBe('all');
      expect(explanation.passed).toBe(true);
      if ('children' in explanation) {
        expect(explanation.children[0].type).toBe('simple');
        expect(explanation.children[1].type).toBe('any');
      }
    });

    test('explains unknown operator as failed', () => {
      const evaluator = new Evaluator();
      const explanation = evaluator.explainCondition(
        { field: 'value', operator: 'unknownOp', value: 123 },
        { data: { value: 123 } },
      );
      expect(explanation.type).toBe('simple');
      expect(explanation.passed).toBe(false);
    });
  });
});
