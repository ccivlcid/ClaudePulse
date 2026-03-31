const ERROR_PATTERNS = [
    // JavaScript/TypeScript
    /TypeError|ReferenceError|SyntaxError|RangeError/,
    /Unhandled.*rejection|uncaught.*exception/i,
    // HTTP 4xx/5xx
    /\b[45]\d{2}\b.*\b(GET|POST|PUT|DELETE|PATCH)\b/,
    /\b(GET|POST|PUT|DELETE|PATCH)\b.*\b[45]\d{2}\b/,
    // Build
    /Failed to compile|Build failed|Module not found/i,
    // Network
    /EADDRINUSE|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/,
    // Stack trace
    /^\s+at\s+/m,
];
const WARN_PATTERNS = [
    /\bwarn(ing)?\b/i,
    /\bdeprecated\b/i,
];
export const SERVER_READY_PATTERNS = [
    /listening on|ready on|started at|server running/i,
    /Local:\s+http/,
    /Network:\s+http/,
];
export function detectLevel(text) {
    for (const pattern of ERROR_PATTERNS) {
        if (pattern.test(text))
            return 'error';
    }
    for (const pattern of WARN_PATTERNS) {
        if (pattern.test(text))
            return 'warn';
    }
    return 'info';
}
export function isServerReady(text) {
    return SERVER_READY_PATTERNS.some(p => p.test(text));
}
export function extractPort(text) {
    const match = text.match(/(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d{2,5})/);
    return match ? parseInt(match[1], 10) : null;
}
//# sourceMappingURL=error-detector.js.map