import { describe, it, expect } from 'vitest';
import { parseRecursive } from './jsonParser';

describe('parseRecursive', () => {
    it('should parse simple JSON object', () => {
        const input = '{"a": 1, "b": "test"}';
        const expected = { a: 1, b: "test" };
        expect(parseRecursive(input)).toEqual(expected);
    });

    it('should parse simple JSON array', () => {
        const input = '[1, 2, 3]';
        const expected = [1, 2, 3];
        expect(parseRecursive(input)).toEqual(expected);
    });

    it('should handle nested stringified JSON in object', () => {
        const input = '{"a": 1, "b": "{\\"c\\": 2}"}';
        const expected = { a: 1, b: { c: 2 } };
        expect(parseRecursive(input)).toEqual(expected);
    });

    it('should handle nested stringified JSON in array', () => {
        const input = '[1, "{\\"a\\": 1}"]';
        const expected = [1, { a: 1 }];
        expect(parseRecursive(input)).toEqual(expected);
    });

    it('should return original value if input is not a string or object', () => {
        expect(parseRecursive(123)).toBe(123);
        expect(parseRecursive(null)).toBe(null);
        expect(parseRecursive(true)).toBe(true);
    });

    it('should return original string if it is not valid JSON', () => {
        const input = 'invalid json';
        expect(parseRecursive(input)).toBe(input);
    });

    it('should prevent recursion if string parses to itself', () => {
        // Typically JSON.parse('"abc"') -> "abc". 
        // Our logic handles avoiding infinite loops if the parsed value is the same as input
        // But JSON.parse on simple string usually throws unless quoted.
        const input = '"abc"';
        expect(parseRecursive(input)).toBe("abc");
    });
});
