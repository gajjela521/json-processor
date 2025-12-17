
export interface ApiResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: unknown;
    duration: number; // ms
    size: string;
    success: boolean;
    error?: string; // For network errors or CORS failures
}

export interface ApiRequest {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: string; // Assumed stringified JSON if method is POST/PUT
}

export const executeRequest = async (req: ApiRequest): Promise<ApiResponse> => {
    const start = performance.now();
    try {
        const options: RequestInit = {
            method: req.method,
            headers: req.headers || {},
        };

        // Add body if applicable
        if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
            options.body = req.body;
            // Default content type if not set
            if (options.headers && !Object.keys(options.headers).some(k => k.toLowerCase() === 'content-type')) {
                (options.headers as any)['Content-Type'] = 'application/json';
            }
        }

        const response = await fetch(req.url, options);
        const end = performance.now();
        const duration = Math.round(end - start);

        // Parse Headers
        const resHeaders: Record<string, string> = {};
        response.headers.forEach((val, key) => {
            resHeaders[key] = val;
        });

        // Determine Size (approx)
        const sizeBytes = (response.headers.get('content-length') || '0');
        const size = formatSize(parseInt(sizeBytes));

        // Parse Body
        const text = await response.text();
        let data: unknown = text;
        try {
            data = JSON.parse(text);
        } catch { }

        return {
            status: response.status,
            statusText: response.statusText,
            headers: resHeaders,
            data,
            duration,
            size: size === '0 B' && text.length > 0 ? formatSize(text.length) : size,
            success: response.ok
        };

    } catch (error) {
        const end = performance.now();
        return {
            status: 0,
            statusText: 'Network Error',
            headers: {},
            data: null,
            duration: Math.round(end - start),
            size: '0 B',
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
};

const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
