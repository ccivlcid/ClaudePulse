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
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 h-[480px] flex flex-col">
      <h2 className="text-sm font-semibold text-gray-400 mb-3">File Heatmap</h2>
      <div className="flex-1 overflow-y-auto space-y-1.5 text-xs">
        {files.length === 0 && (
          <p className="text-gray-600 italic">No file access yet</p>
        )}
        {files.map(f => {
          const pct = (f.total / maxTotal) * 100;
          const shortPath = f.path.split('/').slice(-2).join('/');
          return (
            <div key={f.path}>
              <div className="flex justify-between mb-0.5">
                <span className="text-gray-300 truncate" title={f.path}>{shortPath}</span>
                <span className="text-gray-500 shrink-0 ml-2">
                  R:{f.read} E:{f.edit} W:{f.write}
                </span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-blue-600 to-orange-500 h-1.5 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
