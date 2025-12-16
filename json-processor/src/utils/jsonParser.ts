/**
 * Utility to parse JSON recursively.
 * It attempts to parse a string as JSON. If successful, it recursively checks if any values
 * in the result are also stringified JSON and parses them.
 */

export const parseRecursive = (input: unknown): unknown => {
    // If input is not a string, it might be an object/array we need to traverse
    if (typeof input !== 'string') {
        if (typeof input === 'object' && input !== null) {
            if (Array.isArray(input)) {
                return input.map(item => parseRecursive(item));
            }
            const result: Record<string, unknown> = {};
            for (const key in input) {
                if (Object.prototype.hasOwnProperty.call(input, key)) {
                    result[key] = parseRecursive((input as Record<string, unknown>)[key]);
                }
            }
            return result;
        }
        // Primitives (number, boolean, null, etc.) return as is
        return input;
    }

    // Input is a string, try to parse it
    try {
        const parsed = JSON.parse(input);

        // If parsing results in a string, it might be double-stringified (e.g. "\"{\\\"a\\\":1}\"")
        // OR it might just be a simple string. 
        // We recurse to see if the inner content is actionable.
        // However, JSON.parse('"abc"') -> "abc". Endless recursion risk if we don't check change.

        if (parsed === input) {
            // No change (e.g. input was just a plain string that didn't change type/content significantly enough to be "unwrapped")
            // actually JSON.parse("abc") throws error usually unless quotes. 
            // JSON.parse('"abc"') -> 'abc'. 
            return parsed;
        }

        // If parsed is a primitive, return it.
        if (typeof parsed !== 'object' && typeof parsed !== 'string') {
            return parsed;
        }

        // Recurse on the result
        return parseRecursive(parsed);
    } catch (e) {
        // Not valid JSON, return original string
        return input;
    }
};

export const formatJson = (data: unknown): string => {
    try {
        return JSON.stringify(data, null, 2);
    } catch (e) {
        return String(data);
    }
}
