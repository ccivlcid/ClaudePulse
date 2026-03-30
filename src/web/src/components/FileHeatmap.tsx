import { usePulseStore } from '../stores/pulseStore.js';

export default function FileHeatmap() {
  const events = usePulseStore(s => s.events);

  const map = new Map<string, { read: number; edit: number; write: number }>();
  for (const e of events) {
    if (e.type !== 'tool-start' || !e.filePath || !e.toolName) continue;
    let entry = map.get(e.filePath);
    if (!entry) { entry = { read: 0, edit: 0, write: 0 }; map.set(e.filePath, entry); }
    if (e.toolName === 'Read' || e.toolName === 'Glob') entry.read++;
    else if (e.toolName === 'Edit') entry.edit++;
    else if (e.toolName === 'Write') entry.write++;
  }

  const files = [...map.entries()]
    .map(([path, counts]) => ({ path, ...counts, total: counts.read + counts.edit + counts.write }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const maxTotal = files[0]?.total ?? 1;

  return (
    <div className="card h-[420px] flex flex-col">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>Files</h2>
        <span className="text-[12px] nums" style={{ color: 'var(--text-faint)' }}>{files.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-[10px] text-[12px]">
        {files.length === 0 ? (
          <p className="text-[13px] pt-8 text-center" style={{ color: 'var(--text-faint)' }}>No file access yet</p>
        ) : (
          files.map((f, i) => {
            const pct = (f.total / maxTotal) * 100;
            const shortPath = f.path.split('/').slice(-2).join('/');
            return (
              <div key={f.path}>
                <div className="flex items-baseline justify-between mb-[3px]">
                  <span className="truncate" style={{ color: i === 0 ? 'var(--text-primary)' : 'var(--text-secondary)' }} title={f.path}>
                    {shortPath}
                  </span>
                  <span className="nums shrink-0 ml-3" style={{ color: 'var(--text-muted)' }}>{f.total}</span>
                </div>
                <div className="h-[3px] rounded-full" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-[3px] rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      background: i === 0 ? 'var(--accent)' : 'var(--text-faint)',
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
