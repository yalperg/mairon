import { FieldAccessor } from '@/utils';

describe('FieldAccessor', () => {
  let accessor: FieldAccessor;

  beforeEach(() => {
    accessor = new FieldAccessor();
  });

  describe('get', () => {
    it('should resolve simple field access', () => {
      const obj = { name: 'John', age: 30 };
      expect(accessor.get(obj, 'name')).toBe('John');
      expect(accessor.get(obj, 'age')).toBe(30);
    });

    it('should resolve nested field access', () => {
      const obj = {
        user: {
          name: 'John',
          email: 'john@example.com',
        },
      };
      expect(accessor.get(obj, 'user.name')).toBe('John');
      expect(accessor.get(obj, 'user.email')).toBe('john@example.com');
    });

    it('should resolve deep nested paths', () => {
      const obj = {
        company: {
          department: {
            team: {
              lead: {
                name: 'John',
              },
            },
          },
        },
      };
      expect(
        accessor.get(obj, 'company.department.team.lead.name'),
      ).toBe('John');
    });

    it('should resolve array index access', () => {
      const obj = {
        items: ['a', 'b', 'c'],
      };
      expect(accessor.get(obj, 'items.0')).toBe('a');
      expect(accessor.get(obj, 'items.1')).toBe('b');
      expect(accessor.get(obj, 'items.2')).toBe('c');
    });

    it('should resolve nested array access', () => {
      const obj = {
        users: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
        ],
      };
      expect(accessor.get(obj, 'users.0.name')).toBe('John');
      expect(accessor.get(obj, 'users.1.age')).toBe(25);
    });

    it('should return undefined for non-existent paths', () => {
      const obj = { name: 'John' };
      expect(accessor.get(obj, 'age')).toBeUndefined();
      expect(accessor.get(obj, 'user.email')).toBeUndefined();
    });

    it('should handle null values safely', () => {
      expect(accessor.get(null, 'field')).toBeUndefined();
    });

    it('should handle undefined values safely', () => {
      expect(accessor.get(undefined, 'field')).toBeUndefined();
    });

    it('should handle empty path', () => {
      const obj = { name: 'John' };
      expect(accessor.get(obj, '')).toBe(obj);
    });

    it('should handle null in nested path', () => {
      const obj = {
        user: null,
      };
      expect(accessor.get(obj, 'user.name')).toBeUndefined();
    });

    it('should handle undefined in nested path', () => {
      const obj = {
        user: undefined,
      };
      expect(accessor.get(obj, 'user.name')).toBeUndefined();
    });

    it('should handle non-object values in path', () => {
      const obj = {
        value: 'string',
      };
      expect(accessor.get(obj, 'value.length')).toBeUndefined();
    });

    it('should handle array out of bounds', () => {
      const obj = {
        items: ['a', 'b'],
      };
      expect(accessor.get(obj, 'items.5')).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle 0 as a valid value', () => {
      const obj = { count: 0 };
      expect(accessor.get(obj, 'count')).toBe(0);
    });

    it('should handle false as a valid value', () => {
      const obj = { flag: false };
      expect(accessor.get(obj, 'flag')).toBe(false);
    });

    it('should handle empty string as a valid value', () => {
      const obj = { text: '' };
      expect(accessor.get(obj, 'text')).toBe('');
    });

    it('should handle empty array', () => {
      const obj = { items: [] };
      expect(accessor.get(obj, 'items')).toEqual([]);
    });

    it('should handle empty object', () => {
      const obj = { data: {} };
      expect(accessor.get(obj, 'data')).toEqual({});
    });
  });

  describe('FieldAccessor caching and variants', () => {
    test('bracket index path resolution', () => {
      const fa = new FieldAccessor();
      const obj = { items: ['a', 'b', 'c'] };
      expect(fa.get(obj, 'items[1]')).toBe('b');
    });

    test('get() caches undefined results and survives clear', () => {
      const fa = new FieldAccessor(500);
      const obj = { a: { b: 1 } };
      expect(fa.get(obj, 'a.c')).toBeUndefined();
      expect(fa.get(obj, 'a.c')).toBeUndefined();
      fa.clear();
      expect(fa.get(obj, 'a.c')).toBeUndefined();
    });

    test('get() should return fresh value when object is mutated after caching undefined', () => {
      const fa = new FieldAccessor();
      const obj: Record<string, unknown> = { a: 1 };

      // First call: path doesn't exist, returns undefined
      expect(fa.get(obj, 'b')).toBeUndefined();

      // Mutate object: path now exists
      obj.b = 42;

      // Should return the new value, not cached undefined
      expect(fa.get(obj, 'b')).toBe(42);
    });

    test('get() with primitive roots and empty path', () => {
      const fa = new FieldAccessor();
      expect(fa.get(5 as unknown as object, '')).toBe(5 as unknown as object);
      expect(fa.get('x' as unknown as object, '')).toBe(
        'x' as unknown as object,
      );
    });
  });
});
