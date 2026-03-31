import type { PulseEvent } from './types.js';
export declare function getPulseDir(): string;
export declare function getSessionsDir(): string;
export declare function getServersDir(): string;
export declare function getSessionFilePath(sessionId: string): string;
export declare function getServerLogPath(sessionId: string): string;
export declare function getIndexPath(): string;
export declare function getConfigPath(): string;
export declare function ensureDirectories(): void;
export declare function appendEvent(sessionId: string, event: PulseEvent): void;
export declare function appendServerLog(sessionId: string, log: Record<string, unknown> | object): void;
//# sourceMappingURL=writer.d.ts.map