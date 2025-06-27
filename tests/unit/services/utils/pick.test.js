import pick from '../../../src/utils/pick';

describe('pick utility', () => {
  it('should return a new object with only the specified keys', () => {
    const sourceObject = { a: 1, b: 2, c: 3 };
    const keysToPick = ['a', 'c'];
    const result = pick(sourceObject, keysToPick);
    
    // The result should have only keys 'a' and 'c'
    expect(result).toEqual({ a: 1, c: 3 });
    // The result should not have key 'b'
    expect(result).not.toHaveProperty('b');
  });

  it('should handle keys that do not exist in the source object', () => {
    const sourceObject = { a: 1, b: 2 };
    const keysToPick = ['a', 'd']; // 'd' does not exist in source
    const result = pick(sourceObject, keysToPick);

    expect(result).toEqual({ a: 1 });
  });

  it('should return an empty object if no keys are provided', () => {
    const sourceObject = { a: 1, b: 2 };
    const keysToPick = [];
    const result = pick(sourceObject, keysToPick);

    expect(result).toEqual({});
  });

  it('should handle a null or undefined source object gracefully', () => {
    const keysToPick = ['a', 'b'];
    
    // Test with null
    const resultFromNull = pick(null, keysToPick);
    expect(resultFromNull).toEqual({});

    // Test with undefined
    const resultFromUndefined = pick(undefined, keysToPick);
    expect(resultFromUndefined).toEqual({});
  });

  it('should correctly pick properties with falsy values (except undefined)', () => {
    const sourceObject = { a: 0, b: '', c: false, d: null, e: undefined };
    const keysToPick = ['a', 'b', 'c', 'd', 'e'];
    const result = pick(sourceObject, keysToPick);

    expect(result).toEqual({ a: 0, b: '', c: false, d: null });
    // 'e' is undefined, so it should not be picked by hasOwnProperty check
    expect(result).not.toHaveProperty('e');
  });
});
