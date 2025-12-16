const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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

// Java POJO Generator
export const generateJavaPOJO = (json: unknown, rootClassName: string = 'Root'): string => {
    const classes: string[] = [];

    const getJavaType = (value: unknown): string => {
        if (value === null) return 'Object';
        if (typeof value === 'string') return 'String';
        if (typeof value === 'number') return Number.isInteger(value) ? 'Integer' : 'Double';
        if (typeof value === 'boolean') return 'Boolean';
        if (Array.isArray(value)) {
            if (value.length === 0) return 'List<Object>';
            return `List<${getJavaType(value[0])}>`;
        }
        return 'Object'; // Fallback
    };

    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    const traverse = (obj: any, className: string) => {
        if (typeof obj !== 'object' || obj === null) return;

        // Handle Arrays (assume homogenous objects for class generation)
        if (Array.isArray(obj)) {
            if (obj.length > 0 && typeof obj[0] === 'object') {
                traverse(obj[0], className); // Generate class for array items
            }
            return;
        }

        const fields: string[] = [];

        Object.entries(obj).forEach(([key, value]) => {
            const fieldName = key;
            let fieldType = 'Object';

            if (value === null) {
                fieldType = 'Object';
            } else if (Array.isArray(value)) {
                if (value.length > 0 && typeof value[0] === 'object') {
                    const nestedClassName = capitalize(key) + 'Item';
                    fieldType = `List<${nestedClassName}>`;
                    traverse(value[0], nestedClassName);
                } else {
                    fieldType = `List<${getJavaType(value[0])}>`;
                }
            } else if (typeof value === 'object') {
                const nestedClassName = capitalize(key);
                fieldType = nestedClassName;
                traverse(value, nestedClassName);
            } else {
                fieldType = getJavaType(value);
            }

            fields.push(`    @JsonProperty("${key}")\n    private ${fieldType} ${fieldName};`);
        });

        classes.push(
            `@Data
public class ${className} {
${fields.join('\n\n')}
}`
        );
    };

    traverse(json, rootClassName);
    return `import com.fasterxml.jackson.annotation.JsonProperty;\nimport lombok.Data;\nimport java.util.List;\n\n` + classes.reverse().join('\n\n');
};

// SQL DDL Generator
export const generateSqlDDL = (json: unknown, tableName: string = 'my_table'): string => {
    if (typeof json !== 'object' || json === null || Array.isArray(json)) {
        return '-- Input must be a JSON object to generate a table schema';
    }

    const columns: string[] = [];

    Object.entries(json).forEach(([key, value]) => {
        let sqlType = 'TEXT';
        if (typeof value === 'number') {
            sqlType = Number.isInteger(value) ? 'INTEGER' : 'DECIMAL';
        } else if (typeof value === 'boolean') {
            sqlType = 'BOOLEAN';
        } else if (typeof value === 'object' && value !== null) {
            sqlType = 'JSONB'; // Defaulting to Postgres JSONB for complex objects
        }

        // Basic normalization of column name
        const colName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        columns.push(`    ${colName} ${sqlType}`);
    });

    return `CREATE TABLE ${tableName} (\n${columns.join(',\n')}\n);`;
}

// Helper for existing functions (kept here to ensure availability if needed, though usually defined inside)
// const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

