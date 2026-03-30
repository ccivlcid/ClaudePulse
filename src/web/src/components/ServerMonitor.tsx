import { useServerLogs } from '../hooks/useServerLogs.js';
import { formatClock, summarizeServer } from '../lib/dashboard.js';
import { usePulseStore } from '../stores/pulseStore.js';

export default function ServerMonitor() {
  const activeSessionId = usePulseStore((state) => state.activeSessionId);
  const { logs, loading } = useServerLogs(activeSessionId, 50);
  const summary = summarizeServer(logs);

  return (
    <div className="card h-[420px] flex flex-col">
      <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="panel-kicker">Diagnostics</p>
          <h2 className="panel-title">Server Summary & Logs</h2>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Request activity, response time, and recent server warnings in one view.
          </p>
        </div>
        <span className={`status-pill ${summary.status === 'ERROR' ? 'is-error' : summary.status === 'WARN' ? 'is-warn' : summary.status === 'LIVE' ? 'is-success' : 'is-neutral'}`}>
          {summary.status}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="summary-stat">
          <span className="metric-label">Requests</span>
          <strong className="metric-value text-[20px]">{summary.requestCount}</strong>
        </div>
        <div className="summary-stat">
          <span className="metric-label">Avg Response</span>
          <strong className="metric-value text-[20px]">{summary.avgResponseTime !== null ? `${summary.avgResponseTime}ms` : '--'}</strong>
        </div>
        <div className="summary-stat">
          <span className="metric-label">Port</span>
          <strong className="metric-value text-[20px]">{summary.port ?? '--'}</strong>
        </div>
        <div className="summary-stat">
          <span className="metric-label">Latest Issue</span>
          <strong className="metric-value text-[20px]">{summary.latestIssue ? formatClock(summary.latestIssue.ts) : '--'}</strong>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-4 pr-1 font-mono text-[11px] space-y-2">
        {loading ? (
          <div className="empty-state h-full font-sans">
            <h3>Loading server logs</h3>
            <p>Recent server output will appear here.</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state h-full font-sans">
            <h3>No server running</h3>
            <p>Start a dev server to monitor logs and errors.</p>
          </div>
        ) : (
          logs.slice().reverse().map((log, index) => (
            <div key={`${log.ts}-${index}`} className={`log-row ${log.level === 'error' ? 'is-error' : log.level === 'warn' ? 'is-warn' : ''}`}>
              <span className="nums shrink-0">{formatClock(log.ts)}</span>
              <span className={`status-pill ${log.level === 'error' ? 'is-error' : log.level === 'warn' ? 'is-warn' : 'is-neutral'}`}>
                {log.level.toUpperCase()}
              </span>
              <span className="min-w-0 break-all">{log.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
