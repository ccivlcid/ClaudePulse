import type { SessionEntry, RetentionConfig } from './types.js';
export declare function addSession(session: SessionEntry): void;
export declare function updateSession(sessionId: string, updates: Partial<SessionEntry>): void;
export declare function getSessions(): SessionEntry[];
export declare function getActiveSession(): SessionEntry | null;
export declare function getSessionById(sessionId: string): SessionEntry | null;
export declare function removeSession(sessionId: string): boolean;
export declare function removeAllSessions(): void;
export declare function cleanupExpired(config: RetentionConfig): void;
//# sourceMappingURL=index-manager.d.ts.map