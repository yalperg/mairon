import { FieldAccessor } from '@/utils';

describe('FieldAccessor', () => {
  let accessor: FieldAccessor;

  beforeEach(() => {
    accessor = new FieldAccessor();
  });

  describe('resolvePath', () => {
    it('should resolve simple field access', () => {
      const obj = { name: 'John', age: 30 };
      expect(accessor.resolvePath(obj, 'name')).toBe('John');
      expect(accessor.resolvePath(obj, 'age')).toBe(30);
    });

    it('should resolve nested field access', () => {
      const obj = {
        user: {
          name: 'John',
          email: 'john@example.com',
        },
      };
      expect(accessor.resolvePath(obj, 'user.name')).toBe('John');
      expect(accessor.resolvePath(obj, 'user.email')).toBe('john@example.com');
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
        accessor.resolvePath(obj, 'company.department.team.lead.name'),
      ).toBe('John');
    });

    it('should resolve array index access', () => {
      const obj = {
        items: ['a', 'b', 'c'],
      };
      expect(accessor.resolvePath(obj, 'items.0')).toBe('a');
      expect(accessor.resolvePath(obj, 'items.1')).toBe('b');
      expect(accessor.resolvePath(obj, 'items.2')).toBe('c');
    });

    it('should resolve nested array access', () => {
      const obj = {
        users: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
        ],
      };
      expect(accessor.resolvePath(obj, 'users.0.name')).toBe('John');
      expect(accessor.resolvePath(obj, 'users.1.age')).toBe(25);
    });

    it('should return undefined for non-existent paths', () => {
      const obj = { name: 'John' };
      expect(accessor.resolvePath(obj, 'age')).toBeUndefined();
      expect(accessor.resolvePath(obj, 'user.email')).toBeUndefined();
    });

    it('should handle null values safely', () => {
      expect(accessor.resolvePath(null, 'field')).toBeUndefined();
    });

    it('should handle undefined values safely', () => {
      expect(accessor.resolvePath(undefined, 'field')).toBeUndefined();
    });

    it('should handle empty path', () => {
      const obj = { name: 'John' };
      expect(accessor.resolvePath(obj, '')).toBe(obj);
    });

    it('should handle null in nested path', () => {
      const obj = {
        user: null,
      };
      expect(accessor.resolvePath(obj, 'user.name')).toBeUndefined();
    });

    it('should handle undefined in nested path', () => {
      const obj = {
        user: undefined,
      };
      expect(accessor.resolvePath(obj, 'user.name')).toBeUndefined();
    });

    it('should handle non-object values in path', () => {
      const obj = {
        value: 'string',
      };
      expect(accessor.resolvePath(obj, 'value.length')).toBeUndefined();
    });

    it('should handle array out of bounds', () => {
      const obj = {
        items: ['a', 'b'],
      };
      expect(accessor.resolvePath(obj, 'items.5')).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle 0 as a valid value', () => {
      const obj = { count: 0 };
      expect(accessor.resolvePath(obj, 'count')).toBe(0);
    });

    it('should handle false as a valid value', () => {
      const obj = { flag: false };
      expect(accessor.resolvePath(obj, 'flag')).toBe(false);
    });

    it('should handle empty string as a valid value', () => {
      const obj = { text: '' };
      expect(accessor.resolvePath(obj, 'text')).toBe('');
    });

    it('should handle empty array', () => {
      const obj = { items: [] };
      expect(accessor.resolvePath(obj, 'items')).toEqual([]);
    });

    it('should handle empty object', () => {
      const obj = { data: {} };
      expect(accessor.resolvePath(obj, 'data')).toEqual({});
    });
  });

  describe('FieldAccessor caching and variants', () => {
    test('bracket index path resolution', () => {
      const fa = new FieldAccessor();
      const obj = { items: ['a', 'b', 'c'] };
      expect(fa.resolvePath(obj, 'items[1]')).toBe('b');
    });

    test('get() caches undefined results and survives clear', () => {
      const fa = new FieldAccessor(500);
      const obj = { a: { b: 1 } };
      expect(fa.get(obj, 'a.c')).toBeUndefined();
      expect(fa.get(obj, 'a.c')).toBeUndefined();
      fa.clear();
      expect(fa.get(obj, 'a.c')).toBeUndefined();
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
