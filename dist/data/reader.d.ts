import type { PulseEvent, SessionStats, FileHeatmapEntry, AgentStatusEntry, TimelineEntry } from './types.js';
export declare function readSessionEvents(sessionId: string): PulseEvent[];
export declare function getSessionStats(sessionId: string): SessionStats;
export declare function getFileHeatmap(sessionId: string): FileHeatmapEntry[];
export declare function getAgentStatus(sessionId: string): AgentStatusEntry[];
export declare function getTimeline(sessionId: string): TimelineEntry[];
//# sourceMappingURL=reader.d.ts.map