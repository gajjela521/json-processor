export const generateTypeScriptInterfaces = (json: unknown, rootName: string = 'Root'): string => {
    const interfaces: string[] = [];
    const startName = rootName;

    const getTypeName = (value: unknown): string => {
        if (value === null) return 'null';
        if (Array.isArray(value)) {
            if (value.length === 0) return 'any[]';
            const types = new Set(value.map(getTypeName));
            return Array.from(types).join(' | ') + '[]';
        }
        if (typeof value === 'object') {
            return 'object'; // Should be handled by recursion/interface generation
        }
        return typeof value;
    };

    const traverse = (obj: any, name: string) => {
        if (typeof obj !== 'object' || obj === null) return;
        if (Array.isArray(obj)) {
            if (obj.length > 0) traverse(obj[0], name); // Assume homogenous array
            return;
        }

        const entries: string[] = [];

        Object.entries(obj).forEach(([key, value]) => {
            // Clean key if needed
            const cleanKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;

            if (value === null) {
                entries.push(`  ${cleanKey}: null;`);
            } else if (Array.isArray(value)) {
                if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                    const typeName = capitalize(key) + 'Item';
                    traverse(value[0], typeName);
                    entries.push(`  ${cleanKey}: ${typeName}[];`);
                } else {
                    entries.push(`  ${cleanKey}: ${getTypeName(value)};`);
                }
            } else if (typeof value === 'object') {
                const typeName = capitalize(key);
                traverse(value, typeName);
                entries.push(`  ${cleanKey}: ${typeName};`);
            } else {
                entries.push(`  ${cleanKey}: ${typeof value};`);
            }
        });

        interfaces.push(`export interface ${name} {\n${entries.join('\n')}\n}`);
    };

    traverse(json, startName);
    return interfaces.reverse().join('\n\n');
};

export const generateZodSchema = (json: unknown, rootName: string = 'schema'): string => {
    let result = "import { z } from 'zod';\n\n";

    const traverse = (obj: any): string => {
        if (obj === null) return "z.null()";
        if (Array.isArray(obj)) {
            if (obj.length === 0) return "z.array(z.any())";
            return `z.array(${traverse(obj[0])})`;
        }
        if (typeof obj === 'object') {
            const lines = Object.entries(obj).map(([k, v]) => {
                const keyStr = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `"${k}"`;
                return `  ${keyStr}: ${traverse(v)}`;
            });
            return `z.object({\n${lines.join(',\n')}\n})`;
        }
        if (typeof obj === 'string') return "z.string()";
        if (typeof obj === 'number') return "z.number()";
        if (typeof obj === 'boolean') return "z.boolean()";
        return "z.any()";
    }

    result += `export const ${rootName} = ${traverse(json)};`;
    return result;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
