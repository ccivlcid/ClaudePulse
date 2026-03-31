type ToolResult = {
    content: {
        type: 'text';
        text: string;
    }[];
    isError?: boolean;
};
export declare function pulseSessionStats(params: {
    sessionId?: string;
}): ToolResult;
export declare function pulseFileHeatmap(params: {
    sessionId?: string;
    top?: number;
}): ToolResult;
export declare function pulseAgentStatus(params: {
    sessionId?: string;
}): ToolResult;
export declare function pulseTimeline(params: {
    sessionId?: string;
}): ToolResult;
export declare function pulseServerLogs(params: {
    lines?: number;
    sessionId?: string;
}): ToolResult;
export declare function pulseServerErrors(params: {
    since?: string;
    sessionId?: string;
}): ToolResult;
export declare function pulseServerHealth(params: {
    sessionId?: string;
}): ToolResult;
export declare function pulseStartServer(params: {
    command: string;
    port?: number;
}): ToolResult;
export declare function pulseStopServer(): ToolResult;
export declare function pulseTokenUsage(params: {
    sessionId?: string;
}): ToolResult;
export declare function pulseOpenDashboard(params: {
    port?: number;
}): ToolResult;
export {};
//# sourceMappingURL=tools.d.ts.map