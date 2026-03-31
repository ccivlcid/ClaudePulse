import { type ChildProcess } from 'node:child_process';
interface ManagedServer {
    process: ChildProcess;
    command: string;
    port: number | null;
    sessionId: string;
    startedAt: string;
    ready: boolean;
}
export declare function getServerStatus(): ManagedServer | null;
export declare function startServer(sessionId: string, command: string, port?: number): {
    pid: number;
    message: string;
};
export declare function stopServer(): {
    message: string;
};
export {};
//# sourceMappingURL=process-manager.d.ts.map