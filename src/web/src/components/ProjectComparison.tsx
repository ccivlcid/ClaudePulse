import { buildProjectRows, shortPath } from '../lib/dashboard.js';
import { usePulseStore } from '../stores/pulseStore.js';

export default function ProjectComparison() {
  const sessions = usePulseStore((state) => state.sessions);
  const rows = buildProjectRows(sessions);

  return (
    <div className="card h-[420px] flex flex-col">
      <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="panel-kicker">Portfolio View</p>
          <h2 className="panel-title">Project Comparison</h2>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Compare session volume, agent usage, errors, and estimated cost across projects.
          </p>
        </div>
        <div className="text-right">
          <div className="metric-value text-[26px]">{rows.length}</div>
          <div className="panel-meta">indexed projects</div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty-state flex-1">
          <h3>No project history yet</h3>
          <p>Project summaries will appear after sessions are indexed.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto pt-4">
          <table className="w-full text-[12px] dashboard-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Sessions</th>
                <th>Tools</th>
                <th>Agents</th>
                <th>Errors</th>
                <th>Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.project}>
                  <td title={row.project}>{shortPath(row.project)}</td>
                  <td>{row.sessions}</td>
                  <td>{row.tools}</td>
                  <td>{row.agents}</td>
                  <td style={{ color: row.errors > 0 ? 'var(--red)' : 'var(--text-secondary)' }}>{row.errors}</td>
                  <td>${row.estimatedCost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
