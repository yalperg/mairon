import { TemplateResolver } from '../../src/utils/TemplateResolver';
import type { EvaluationContext } from '../../src/core/types';

describe('TemplateResolver', () => {
  let resolver: TemplateResolver;

  beforeEach(() => {
    resolver = new TemplateResolver();
  });

  describe('resolve non-string values', () => {
    it('should pass through non-string primitives', () => {
      const context: EvaluationContext = { data: {} };
      
      expect(resolver.resolve(42, context)).toBe(42);
      expect(resolver.resolve(true, context)).toBe(true);
      expect(resolver.resolve(null, context)).toBe(null);
      expect(resolver.resolve(undefined, context)).toBe(undefined);
    });

    it('should recursively resolve arrays', () => {
      const context: EvaluationContext = {
        data: { name: 'John' },
      };

      const result = resolver.resolve(['{{ data.name }}', 'static', 42], context);
      expect(result).toEqual(['John', 'static', 42]);
    });

    it('should recursively resolve objects', () => {
      const context: EvaluationContext = {
        data: { name: 'John', age: 30 },
      };

      const result = resolver.resolve(
        {
          userName: '{{ data.name }}',
          userAge: '{{ data.age }}',
          static: 'value',
        },
        context
      );

      expect(result).toEqual({
        userName: 'John',
        userAge: 30,
        static: 'value',
      });
    });
  });

  describe('time expressions', () => {
    it('should resolve {{ now }}', () => {
      const context: EvaluationContext = { data: {} };
      const before = Date.now();
      const result = resolver.resolve('{{ now }}', context);
      const after = Date.now();

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(before);
      expect(result).toBeLessThanOrEqual(after);
    });

    it('should resolve {{ now - 1h }}', () => {
      const context: EvaluationContext = { data: {} };
      const expected = Date.now() - 60 * 60 * 1000;
      const result = resolver.resolve('{{ now - 1h }}', context) as number;

      expect(Math.abs(result - expected)).toBeLessThan(100);
    });

    it('should resolve {{ now - 7d }}', () => {
      const context: EvaluationContext = { data: {} };
      const expected = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const result = resolver.resolve('{{ now - 7d }}', context) as number;

      expect(Math.abs(result - expected)).toBeLessThan(100);
    });

    it('should resolve {{ now + 30m }}', () => {
      const context: EvaluationContext = { data: {} };
      const expected = Date.now() + 30 * 60 * 1000;
      const result = resolver.resolve('{{ now + 30m }}', context) as number;

      expect(Math.abs(result - expected)).toBeLessThan(100);
    });

    it('should resolve all time units', () => {
      const context: EvaluationContext = { data: {} };
      const now = Date.now();

      const units = [
        { expr: '{{ now - 5s }}', offset: 5 * 1000 },
        { expr: '{{ now - 10m }}', offset: 10 * 60 * 1000 },
        { expr: '{{ now - 2h }}', offset: 2 * 60 * 60 * 1000 },
        { expr: '{{ now - 3d }}', offset: 3 * 24 * 60 * 60 * 1000 },
        { expr: '{{ now - 2w }}', offset: 2 * 7 * 24 * 60 * 60 * 1000 },
      ];

      units.forEach(({ expr, offset }) => {
        const result = resolver.resolve(expr, context) as number;
        const expected = now - offset;
        expect(Math.abs(result - expected)).toBeLessThan(100);
      });
    });
  });

  describe('data references', () => {
    it('should resolve {{ data.field }}', () => {
      const context: EvaluationContext = {
        data: { name: 'John', age: 30 },
      };

      expect(resolver.resolve('{{ data.name }}', context)).toBe('John');
      expect(resolver.resolve('{{ data.age }}', context)).toBe(30);
    });

    it('should resolve nested data references', () => {
      const context: EvaluationContext = {
        data: {
          user: {
            name: 'John',
            email: 'john@example.com',
          },
        },
      };

      expect(resolver.resolve('{{ data.user.name }}', context)).toBe('John');
      expect(resolver.resolve('{{ data.user.email }}', context)).toBe('john@example.com');
    });

    it('should resolve array access in data', () => {
      const context: EvaluationContext = {
        data: {
          items: ['a', 'b', 'c'],
        },
      };

      expect(resolver.resolve('{{ data.items.0 }}', context)).toBe('a');
      expect(resolver.resolve('{{ data.items.2 }}', context)).toBe('c');
    });
  });

  describe('previousData references', () => {
    it('should resolve {{ previousData.field }}', () => {
      const context: EvaluationContext = {
        data: { status: 'done' },
        previousData: { status: 'todo' },
      };

      expect(resolver.resolve('{{ previousData.status }}', context)).toBe('todo');
    });

    it('should handle missing previousData', () => {
      const context: EvaluationContext = {
        data: { status: 'done' },
      };

      expect(resolver.resolve('{{ previousData.status }}', context)).toBeUndefined();
    });
  });

  describe('context references', () => {
    it('should resolve {{ context.field }}', () => {
      const context: EvaluationContext = {
        data: {},
        context: { userId: 'user-123', source: 'api' },
      };

      expect(resolver.resolve('{{ context.userId }}', context)).toBe('user-123');
      expect(resolver.resolve('{{ context.source }}', context)).toBe('api');
    });

    it('should handle nested context fields', () => {
      const context: EvaluationContext = {
        data: {},
        context: {
          metadata: {
            source: 'webhook',
            timestamp: 12345,
          },
        },
      };

      expect(resolver.resolve('{{ context.metadata.source }}', context)).toBe('webhook');
      expect(resolver.resolve('{{ context.metadata.timestamp }}', context)).toBe(12345);
    });
  });

  describe('multiple templates', () => {
    it('should resolve multiple templates in one string', () => {
      const context: EvaluationContext = {
        data: { user: 'John', action: 'completed' },
      };

      const result = resolver.resolve(
        'User {{ data.user }} has {{ data.action }} the task',
        context
      );

      expect(result).toBe('User John has completed the task');
    });

    it('should handle mixed templates', () => {
      const context: EvaluationContext = {
        data: { title: 'Task 1' },
        previousData: { status: 'todo' },
        context: { userId: 'user-123' },
      };

      const result = resolver.resolve(
        '{{ context.userId }} moved {{ data.title }} from {{ previousData.status }}',
        context
      );

      expect(result).toBe('user-123 moved Task 1 from todo');
    });
  });

  describe('invalid templates', () => {
    it('should return original string for invalid expressions', () => {
      const context: EvaluationContext = { data: {} };

      expect(resolver.resolve('{{ invalid syntax }}', context)).toBe('{{invalid syntax}}');
      expect(resolver.resolve('{{ unknown.field }}', context)).toBe('{{unknown.field}}');
    });

    it('should handle non-existent paths', () => {
      const context: EvaluationContext = {
        data: { name: 'John' },
      };

      const result = resolver.resolve('{{ data.nonExistent.field }}', context);
      expect(result).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const context: EvaluationContext = { data: {} };
      expect(resolver.resolve('', context)).toBe('');
    });

    it('should handle strings without templates', () => {
      const context: EvaluationContext = { data: {} };
      expect(resolver.resolve('plain text', context)).toBe('plain text');
    });

    it('should handle empty template value', () => {
      const context: EvaluationContext = {
        data: { empty: '' },
      };
      expect(resolver.resolve('{{ data.empty }}', context)).toBe('');
    });

    it('should handle 0 as value', () => {
      const context: EvaluationContext = {
        data: { count: 0 },
      };
      expect(resolver.resolve('{{ data.count }}', context)).toBe(0);
    });

    it('should handle false as value', () => {
      const context: EvaluationContext = {
        data: { flag: false },
      };
      expect(resolver.resolve('{{ data.flag }}', context)).toBe(false);
    });

    it('should handle null value', () => {
      const context: EvaluationContext = {
        data: { value: null },
      };
      expect(resolver.resolve('{{ data.value }}', context)).toBe(null);
    });

    it('should convert undefined to empty string in multi-template strings', () => {
      const context: EvaluationContext = {
        data: { name: 'John' },
      };

      const result = resolver.resolve(
        'Name: {{ data.name }}, Age: {{ data.age }}',
        context
      );

      expect(result).toBe('Name: John, Age: ');
    });
  });

  describe('clearCache', () => {
    it('should clear the field accessor cache', () => {
      const context: EvaluationContext = {
        data: { name: 'John' },
      };

      resolver.resolve('{{ data.name }}', context);
      resolver.clearCache();

      expect(() => resolver.clearCache()).not.toThrow();
    });
  });
});
