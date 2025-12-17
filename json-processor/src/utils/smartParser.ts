
import yaml from 'js-yaml';
import Papa from 'papaparse';
import { xml2js } from 'xml-js';
import { parseRecursive as jsonParseRecursive } from './jsonParser';

export interface ParseResult {
    data: unknown;
    format: 'json' | 'yaml' | 'xml' | 'csv' | 'unknown';
    error?: string;
}

export const smartParse = (input: string): ParseResult => {
    const trimmed = input.trim();
    if (!trimmed) return { data: null, format: 'unknown' };

    // 1. Try JSON (using existing recursive parser logic for stringified JSON cleanup)
    // We try/catch here because we want to fallback if it's genuinely not JSON
    try {
        // Simple check first: does it start with { or [?
        // JSON can be a primitive too, but for our app, we usually care about objects/arrays
        if (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('"')) {
            const jsonData = jsonParseRecursive(trimmed);
            // If parseRecursive returns the same string, it failed to parse as JSON (based on its implementation)
            // However, our parseRecursive implementation returns input on error.
            // Let's rely on standard JSON.parse first to detect format, then use recursive if needed.
            // Actually, let's just use jsonParseRecursive. If it throws or returns string that looks like input...

            // Let's try standard JSON.parse first to be sure it IS JSON.
            JSON.parse(trimmed); // will throw if invalid
            return { data: jsonData, format: 'json' };
        }
    } catch (e) {
        // Not JSON, continue
    }

    // 2. Try XML
    if (trimmed.startsWith('<')) {
        try {
            const xmlData = xml2js(trimmed, { compact: true, ignoreDeclaration: true, nativeType: true });
            // Should probably unwrap "root" if present? logic depends on user pref, but let's keep raw
            return { data: xmlData, format: 'xml' };
        } catch (e) {
            // Not XML
        }
    }

    // 3. Try YAML
    // YAML is very permissive (e.g. unquoted strings). We should be careful.
    // If it has newlines and key: value structure, it's likely YAML.
    try {
        if (trimmed.includes(':') && trimmed.includes('\n')) {
            const yamlData = yaml.load(trimmed);
            if (typeof yamlData === 'object' && yamlData !== null) {
                return { data: yamlData, format: 'yaml' };
            }
        }
    } catch (e) {
        // Not YAML
    }

    // 4. Try CSV
    // Papa parse is also permissive. check for delimiters.
    try {
        const csvResult = Papa.parse(trimmed, { header: true, skipEmptyLines: true });
        if (csvResult.errors.length === 0 && csvResult.data.length > 0) {
            // detailed check: Ensure it actually has keys/headers, not just one column of garbage
            const firstRow = csvResult.data[0];
            if (typeof firstRow === 'object' && Object.keys(firstRow as object).length > 1) {
                return { data: csvResult.data, format: 'csv' };
            }
        }
    } catch (e) {
        // Not CSV
    }

    // Fallback: It might be a simple string or invalid JSON
    // Let's return error or treating as plain string
    try {
        // One last attempt at flexible JSON (e.g. standard recursive)
        const result = jsonParseRecursive(input);
        if (result !== input) {
            return { data: result, format: 'json' };
        }
    } catch (e) { }

    return { data: null, format: 'unknown', error: 'Could not auto-detect format. Please ensure valid JSON, XML, YAML, or CSV.' };
};
