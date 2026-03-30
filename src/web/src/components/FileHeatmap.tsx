import { buildFileStats, shortPath } from '../lib/dashboard.js';
import { usePulseStore } from '../stores/pulseStore.js';

export default function FileHeatmap() {
  const events = usePulseStore((state) => state.events);
  const files = buildFileStats(events).slice(0, 8);
  const maxTotal = files[0]?.total ?? 1;

  return (
    <div className="card h-[420px] flex flex-col">
      <div className="flex items-start justify-between gap-4 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="panel-kicker">Hotspot View</p>
          <h2 className="panel-title">Top Files</h2>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
            Files with the highest read, edit, and write concentration.
          </p>
        </div>
        <div className="text-right">
          <div className="metric-value text-[26px]">{files.length}</div>
          <div className="panel-meta">tracked files</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-4 space-y-3 pr-1">
        {files.length === 0 ? (
          <div className="empty-state h-full">
            <h3>No file activity yet</h3>
            <p>Read, Edit, and Write events will appear here.</p>
          </div>
        ) : (
          files.map((file, index) => (
            <article key={file.path} className="stat-row">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <h3 className="text-[13px] font-medium truncate">{shortPath(file.path)}</h3>
                  <p className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }} title={file.path}>
                    {file.path}
                  </p>
                </div>
                <span className="status-pill is-neutral">{file.total}</span>
              </div>

              <div className="h-[6px] rounded-full mb-2" style={{ background: 'var(--border)' }}>
                <div
                  className="h-[6px] rounded-full"
                  style={{
                    width: `${(file.total / maxTotal) * 100}%`,
                    background: index === 0 ? 'var(--accent)' : 'var(--blue)',
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-2 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                <span className="split-chip">R {file.read}</span>
                <span className="split-chip">E {file.edit}</span>
                <span className="split-chip">W {file.write}</span>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
