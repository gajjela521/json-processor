
import { jwtDecode } from 'jwt-decode';

export interface JwtDetails {
    header: unknown;
    payload: unknown;
    isExpired: boolean;
    expiresAt?: string;
    isValid: boolean;
    error?: string;
}

export const decodeJwt = (token: string): JwtDetails => {
    try {
        const decoded = jwtDecode(token);
        const header = jwtDecode(token, { header: true });

        // Check for expiration
        let isExpired = false;
        let expiresAt = undefined;

        if (typeof decoded === 'object' && decoded !== null && 'exp' in decoded) {
            const exp = (decoded as any).exp;
            if (typeof exp === 'number') {
                const expirationDate = new Date(exp * 1000);
                expiresAt = expirationDate.toLocaleString();
                if (Date.now() >= exp * 1000) {
                    isExpired = true;
                }
            }
        }

        return {
            header,
            payload: decoded,
            isExpired,
            expiresAt,
            isValid: true
        };
    } catch (e) {
        return {
            header: null,
            payload: null,
            isExpired: false,
            isValid: false,
            error: "Invalid JWT Format"
        };
    }
};

export const isPossiblyJwt = (text: string): boolean => {
    // Basic heuristic: 3 parts separated by dots, starts with eyJ (base64 for {"...)
    const parts = text.trim().split('.');
    return parts.length === 3 && text.trim().startsWith('eyJ');
};
