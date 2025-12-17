
import yaml from 'js-yaml';
import Papa from 'papaparse';
import { js2xml } from 'xml-js';

export const toYaml = (data: unknown): string => {
    try {
        return yaml.dump(data);
    } catch (e) {
        return `Error converting to YAML: ${e}`;
    }
};

export const toXml = (data: unknown): string => {
    try {
        const options = { compact: true, ignoreComment: true, spaces: 4 };
        const wrapped = { root: data };
        return js2xml(wrapped, options);
    } catch (e) {
        return `Error converting to XML: ${e}`;
    }
};

export const toCsv = (data: unknown): string => {
    try {
        if (Array.isArray(data)) {
            return Papa.unparse(data);
        }
        if (typeof data === 'object' && data !== null) {
            return Papa.unparse([data]);
        }
        return `Error: CSV conversion requires an array or object. Got ${typeof data}`;
    } catch (e) {
        return `Error converting to CSV: ${e}`;
    }
};

export const toJson = (data: unknown): string => {
    return JSON.stringify(data, null, 2);
};
