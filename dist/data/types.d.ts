export type EventType = 'session-start' | 'session-end' | 'tool-start' | 'tool-end' | 'tool-error' | 'agent-start' | 'agent-stop';
export interface PulseEvent {
    id: string;
    ts: string;
    sessionId: string;
    projectDir: string;
    type: EventType;
    toolName?: string;
    toolUseId?: string;
    toolInput?: Record<string, unknown>;
    filePath?: string;
    toolResponse?: {
        stdout?: string;
        stderr?: string;
        interrupted?: boolean;
    };
    message?: string;
    agentId?: string;
    agentType?: string;
    agentTranscriptPath?: string;
    lastAgentMessage?: string;
}
export interface SessionEntry {
    id: string;
    project: string;
    startedAt: string;
    endedAt: string | null;
    toolCount: number;
    agentCount: number;
    errorCount: number;
}
export interface SessionIndex {
    sessions: SessionEntry[];
}
export interface RetentionConfig {
    eventsDays: number;
    serverLogsDays: number;
    maxTotalSizeMb: number;
}
export interface PulseConfig {
    retention: RetentionConfig;
    ports: {
        dashboard: number;
    };
}
export interface SessionStats {
    sessionId: string;
    startedAt: string;
    endedAt: string | null;
    elapsedMs: number;
    toolCounts: Record<string, number>;
    totalTools: number;
    agentCount: number;
    errorCount: number;
}
export interface FileHeatmapEntry {
    filePath: string;
    readCount: number;
    editCount: number;
    writeCount: number;
    total: number;
}
export interface AgentStatusEntry {
    agentId: string;
    agentType: string;
    status: 'running' | 'done';
    startedAt: string;
    endedAt: string | null;
    elapsedMs: number;
    toolCounts: Record<string, number>;
}
export interface TimelineEntry {
    ts: string;
    type: EventType;
    summary: string;
}
export declare const DEFAULT_CONFIG: PulseConfig;
//# sourceMappingURL=types.d.ts.map