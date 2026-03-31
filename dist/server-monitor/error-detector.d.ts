export type LogLevel = 'info' | 'warn' | 'error';
export declare const SERVER_READY_PATTERNS: RegExp[];
export declare function detectLevel(text: string): LogLevel;
export declare function isServerReady(text: string): boolean;
export declare function extractPort(text: string): number | null;
//# sourceMappingURL=error-detector.d.ts.map