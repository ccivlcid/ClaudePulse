import { useServerLogs } from '../hooks/useServerLogs.js';
import { buildAlertItems, formatClock, shortPath } from '../lib/dashboard.js';
import { usePulseStore } from '../stores/pulseStore.js';

export default function ErrorPanel() {
  const events = usePulseStore((state) => state.events);
  const activeSessionId = usePulseStore((state) => state.activeSessionId);
  const { logs } = useServerLogs(activeSessionId, 25);
  const alerts = buildAlertItems(events, logs);
  const criticalCount = alerts.filter((alert) => alert.severity === 'ERROR').length;

  return (
    <div className="card card-alert min-h-[320px] flex flex-col">
      <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="panel-kicker">P0 Monitoring</p>
          <h2 className="panel-title">Alert Center</h2>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Tool failures, server errors, and warnings surfaced in one place.
          </p>
        </div>
        <div className="text-right">
          <div className="metric-value text-[26px]">{alerts.length}</div>
          <div className="panel-meta">{criticalCount} critical</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-4 space-y-3 pr-1">
        {alerts.length === 0 ? (
          <div className="empty-state h-full">
            <h3>No alerts</h3>
            <p>Tool failures, server errors, and test warnings will appear here.</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <article key={alert.id} className={`alert-item ${alert.severity === 'ERROR' ? 'is-error' : 'is-warn'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`status-pill ${alert.severity === 'ERROR' ? 'is-error' : 'is-warn'}`}>{alert.severity}</span>
                  <span className="status-pill is-neutral">{alert.source}</span>
                </div>
                <span className="panel-meta shrink-0">{formatClock(alert.ts)}</span>
              </div>
              <h3 className="mt-3 text-[14px] font-medium leading-tight">{alert.title}</h3>
              <p className="mt-2 text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {alert.message}
              </p>
              {alert.filePath && (
                <p className="mt-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {shortPath(alert.filePath)}
                </p>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
