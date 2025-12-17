
import jmespath from 'jmespath';

export const queryJson = (data: unknown, query: string): unknown => {
    try {
        if (!query.trim()) return data;
        return jmespath.search(data, query);
    } catch (e) {
        // Return null or error object if query is invalid
        return { error: `Invalid JMESPath query: ${e}` };
    }
};
