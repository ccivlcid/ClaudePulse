import { type LogLevel } from './error-detector.js';
export interface ServerLogEntry {
    ts: string;
    level: LogLevel;
    source: 'stdout' | 'stderr';
    text: string;
    port?: number;
    serverReady?: boolean;
}
export declare function parseLogLine(text: string, source: 'stdout' | 'stderr'): ServerLogEntry;
export declare function parseLogChunk(chunk: string, source: 'stdout' | 'stderr'): ServerLogEntry[];
//# sourceMappingURL=log-parser.d.ts.map