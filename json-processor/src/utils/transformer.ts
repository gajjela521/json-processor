
export const runTransformer = (data: unknown, code: string): unknown => {
    try {
        // Safe-ish eval: using new Function()
        // Code should be a function body or expression that returns result
        // We supply 'data' as argument

        // If code is "x => x.id", we want to execute it.
        // If code is "return data.map(...)", we wrap it.

        // Let's assume user writes a full function body or expression.
        // We wrap it in a function `(data) => { ... }`

        // 1. Detect if it looks like an arrow function
        let fn;
        if (code.trim().startsWith('data') || code.includes('=>')) {
            // e.g. "data => data.map(x=>x)" or "(data) => { ... }"
            // This is tricky to eval directly without robust parsing.

            // Simpler approach: User writes the BODY of the function.
            // Variable 'data' is available.
            fn = new Function('data', code.includes('return') ? code : `return ${code}`);
        } else {
            fn = new Function('data', code);
        }

        return fn(data);
    } catch (e) {
        return { error: `Transformation Error: ${e}` };
    }
};
