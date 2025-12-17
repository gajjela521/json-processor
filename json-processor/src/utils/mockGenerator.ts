
import { faker } from '@faker-js/faker';

export const generateMockData = (template: string, count: number = 1): unknown[] => {
    // Template system: Simple replacement of {{key}} with faker values
    // Example: { "name": "{{person.fullName}}", "email": "{{internet.email}}" }

    // We can't really parse arbitrary text templates easily into JSON without `eval` or restricted parsing.
    // A safer approach for now: allow users to pick a "Preset" or "Schema".
    // Or, we parse the Input String as a JSON template.

    const generateItem = (tmplObj: any): any => {
        if (typeof tmplObj === 'string') {
            return tmplObj.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
                try {
                    // key might be 'person.fullName' or 'internet.email'
                    return key.split('.').reduce((obj: any, k: string) => obj && obj[k], faker as any)() || `{{${key}}}`;
                } catch {
                    return `{{${key}}}`;
                }
            });
        }

        if (Array.isArray(tmplObj)) {
            return tmplObj.map(generateItem);
        }

        if (typeof tmplObj === 'object' && tmplObj !== null) {
            const result: any = {};
            for (const k in tmplObj) {
                result[k] = generateItem(tmplObj[k]);
            }
            return result;
        }

        return tmplObj;
    };

    const results = [];
    let parsedTemplate = {};
    try {
        parsedTemplate = JSON.parse(template);
    } catch {
        // Fallback or error
        return [];
    }

    for (let i = 0; i < count; i++) {
        results.push(generateItem(parsedTemplate));
    }

    return results;
};

export const SAMPLE_TEMPLATE = JSON.stringify({
    "id": "{{string.uuid}}",
    "name": "{{person.fullName}}",
    "email": "{{internet.email}}",
    "avatar": "{{image.avatar}}",
    "active": true
}, null, 2);
