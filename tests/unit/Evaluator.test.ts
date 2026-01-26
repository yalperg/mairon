import { Evaluator } from '@/core';

describe('Evaluator', () => {
  test('evaluates simple condition', async () => {
    const evaluator = new Evaluator();
    const result = await evaluator.evaluateCondition(
      { field: 'age', operator: 'greaterThan', value: 18 },
      { data: { age: 20 }, context: {} },
    );
    expect(result).toBe(true);
  });

  test('evaluates logical ALL group', async () => {
    const evaluator = new Evaluator();
    const result = await evaluator.evaluateCondition(
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

  test('evaluates logical ANY group', async () => {
    const evaluator = new Evaluator();
    const result = await evaluator.evaluateCondition(
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

  test('resolves templates in condition value', async () => {
    const evaluator = new Evaluator();
    const result = await evaluator.evaluateCondition(
      { field: 'greeting', operator: 'equals', value: 'Hello {{ data.name }}' },
      { data: { greeting: 'Hello John', name: 'John' }, context: {} },
    );
    expect(result).toBe(true);
  });

  test('change operators respect previousData', async () => {
    const evaluator = new Evaluator();
    const result = await evaluator.evaluateCondition(
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

  test('evaluates NOT condition - negates simple condition', async () => {
    const evaluator = new Evaluator();
    const result = await evaluator.evaluateCondition(
      { not: { field: 'status', operator: 'equals', value: 'inactive' } },
      { data: { status: 'active' }, context: {} },
    );
    expect(result).toBe(true);
  });

  test('evaluates NOT condition - negates true to false', async () => {
    const evaluator = new Evaluator();
    const result = await evaluator.evaluateCondition(
      { not: { field: 'status', operator: 'equals', value: 'active' } },
      { data: { status: 'active' }, context: {} },
    );
    expect(result).toBe(false);
  });

  test('evaluates NOT with nested logical group', async () => {
    const evaluator = new Evaluator();
    const result = await evaluator.evaluateCondition(
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

  test('evaluates nested NOT conditions', async () => {
    const evaluator = new Evaluator();
    const result = await evaluator.evaluateCondition(
      { not: { not: { field: 'status', operator: 'equals', value: 'active' } } },
      { data: { status: 'active' }, context: {} },
    );
    expect(result).toBe(true);
  });

  test('evaluates NOT combined with ALL', async () => {
    const evaluator = new Evaluator();
    const result = await evaluator.evaluateCondition(
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
    test('explains simple condition - pass', async () => {
      const evaluator = new Evaluator();
      const explanation = await evaluator.explainCondition(
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

    test('explains simple condition - fail', async () => {
      const evaluator = new Evaluator();
      const explanation = await evaluator.explainCondition(
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

    test('explains ALL group with mixed results', async () => {
      const evaluator = new Evaluator();
      const explanation = await evaluator.explainCondition(
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

    test('explains ANY group with mixed results', async () => {
      const evaluator = new Evaluator();
      const explanation = await evaluator.explainCondition(
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

    test('explains NOT condition', async () => {
      const evaluator = new Evaluator();
      const explanation = await evaluator.explainCondition(
        { not: { field: 'banned', operator: 'equals', value: true } },
        { data: { banned: false } },
      );
      expect(explanation.type).toBe('not');
      expect(explanation.passed).toBe(true);
      if ('children' in explanation) {
        expect(explanation.children[0].passed).toBe(false);
      }
    });

    test('explains nested conditions', async () => {
      const evaluator = new Evaluator();
      const explanation = await evaluator.explainCondition(
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

    test('explains unknown operator as failed', async () => {
      const evaluator = new Evaluator();
      const explanation = await evaluator.explainCondition(
        { field: 'value', operator: 'unknownOp', value: 123 },
        { data: { value: 123 } },
      );
      expect(explanation.type).toBe('simple');
      expect(explanation.passed).toBe(false);
    });
  });

  describe('async operators', () => {
    test('evaluates async operator that resolves to true', async () => {
      const { Operators, Operator } = await import('@/core');
      const operators = new Operators();
      operators.register(
        new Operator('asyncCheck', async () => {
          await new Promise((r) => setTimeout(r, 10));
          return true;
        }),
      );

      const evaluator = new Evaluator(undefined, undefined, operators);
      const result = await evaluator.evaluateCondition(
        { field: 'x', operator: 'asyncCheck' },
        { data: { x: 1 } },
      );
      expect(result).toBe(true);
    });

    test('evaluates async operator that resolves to false', async () => {
      const { Operators, Operator } = await import('@/core');
      const operators = new Operators();
      operators.register(
        new Operator('asyncFalse', async () => {
          await new Promise((r) => setTimeout(r, 10));
          return false;
        }),
      );

      const evaluator = new Evaluator(undefined, undefined, operators);
      const result = await evaluator.evaluateCondition(
        { field: 'x', operator: 'asyncFalse' },
        { data: { x: 1 } },
      );
      expect(result).toBe(false);
    });

    test('evaluates async operator with condition value', async () => {
      const { Operators, Operator } = await import('@/core');
      const operators = new Operators();
      operators.register(
        new Operator('asyncEquals', async (fieldValue, condition) => {
          await new Promise((r) => setTimeout(r, 10));
          return fieldValue === condition.value;
        }),
      );

      const evaluator = new Evaluator(undefined, undefined, operators);
      const result = await evaluator.evaluateCondition(
        { field: 'status', operator: 'asyncEquals', value: 'active' },
        { data: { status: 'active' } },
      );
      expect(result).toBe(true);
    });

    test('evaluates mixed sync and async operators in ALL group', async () => {
      const { Operators, Operator } = await import('@/core');
      const operators = new Operators();
      operators.register(
        new Operator('asyncTrue', async () => {
          await new Promise((r) => setTimeout(r, 10));
          return true;
        }),
      );

      const evaluator = new Evaluator(undefined, undefined, operators);
      const result = await evaluator.evaluateCondition(
        {
          all: [
            { field: 'age', operator: 'greaterThan', value: 18 },
            { field: 'x', operator: 'asyncTrue' },
          ],
        },
        { data: { age: 25, x: 1 } },
      );
      expect(result).toBe(true);
    });

    test('evaluates mixed sync and async operators in ANY group', async () => {
      const { Operators, Operator } = await import('@/core');
      const operators = new Operators();
      operators.register(
        new Operator('asyncFalse', async () => {
          await new Promise((r) => setTimeout(r, 10));
          return false;
        }),
      );

      const evaluator = new Evaluator(undefined, undefined, operators);
      const result = await evaluator.evaluateCondition(
        {
          any: [
            { field: 'age', operator: 'greaterThan', value: 30 },
            { field: 'x', operator: 'asyncFalse' },
            { field: 'status', operator: 'equals', value: 'active' },
          ],
        },
        { data: { age: 25, x: 1, status: 'active' } },
      );
      expect(result).toBe(true);
    });

    test('explains async operator', async () => {
      const { Operators, Operator } = await import('@/core');
      const operators = new Operators();
      operators.register(
        new Operator('asyncCheck', async (fieldValue, condition) => {
          await new Promise((r) => setTimeout(r, 10));
          return fieldValue === condition.value;
        }),
      );

      const evaluator = new Evaluator(undefined, undefined, operators);
      const explanation = await evaluator.explainCondition(
        { field: 'status', operator: 'asyncCheck', value: 'active' },
        { data: { status: 'active' } },
      );
      expect(explanation.type).toBe('simple');
      expect(explanation.passed).toBe(true);
    });
  });
});
