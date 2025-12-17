
export const toBase64 = (str: string): string => {
    try {
        return btoa(str);
    } catch {
        return "Error: Unable to encode";
    }
}

export const fromBase64 = (str: string): string => {
    try {
        return atob(str);
    } catch {
        return "Error: Invalid Base64 string";
    }
}

export const urlEncode = (str: string): string => encodeURIComponent(str);
export const urlDecode = (str: string): string => decodeURIComponent(str);

export const escapeJson = (str: string): string => {
    return JSON.stringify(str); // Wraps in quotes and escapes internal chars
}

export const unescapeJson = (str: string): string => {
    try {
        // If it starts with quote, standard JSON parse handles it
        if (str.startsWith('"')) return JSON.parse(str);
        // If regular string, maybe just return it? But "unescape" usually implies removing slashes.
        // Let's assume input is a raw string content dealing with slashes
        return str.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    } catch {
        return str;
    }
}
