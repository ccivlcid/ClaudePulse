import { usePulseStore } from '../stores/pulseStore.js';

export default function ProjectComparison() {
  const sessions = usePulseStore(s => s.sessions);

  const projects = new Map<string, { project: string; sessions: number; tools: number; agents: number; errors: number }>();
  for (const s of sessions) {
    const key = s.project;
    let p = projects.get(key);
    if (!p) {
      p = { project: key, sessions: 0, tools: 0, agents: 0, errors: 0 };
      projects.set(key, p);
    }
    p.sessions++;
    p.tools += s.toolCount;
    p.agents += s.agentCount;
    p.errors += s.errorCount;
  }

  const sorted = [...projects.values()].sort((a, b) => b.tools - a.tools);

  return (
    <div className="card h-[360px] flex flex-col">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>Projects</h2>
        <span className="text-[12px] nums" style={{ color: 'var(--text-faint)' }}>{sorted.length}</span>
      </div>

      {sorted.length === 0 ? (
        <p className="text-[13px] pt-8 text-center" style={{ color: 'var(--text-faint)' }}>No data</p>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ color: 'var(--text-faint)' }}>
                <th className="text-left py-2 pr-4 font-normal">Project</th>
                <th className="text-right py-2 px-2 font-normal w-16">Sessions</th>
                <th className="text-right py-2 px-2 font-normal w-16">Tools</th>
                <th className="text-right py-2 px-2 font-normal w-16">Agents</th>
                <th className="text-right py-2 pl-2 font-normal w-16">Errors</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => (
                <tr key={p.project} className="row-hover" style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="py-2 pr-4 truncate max-w-[200px] font-mono" style={{ color: 'var(--text-secondary)' }} title={p.project}>
                    {p.project.split('/').slice(-2).join('/')}
                  </td>
                  <td className="text-right py-2 px-2 nums" style={{ color: 'var(--text-muted)' }}>{p.sessions}</td>
                  <td className="text-right py-2 px-2 nums font-medium" style={{ color: 'var(--text-primary)' }}>{p.tools}</td>
                  <td className="text-right py-2 px-2 nums" style={{ color: 'var(--text-muted)' }}>{p.agents}</td>
                  <td className="text-right py-2 pl-2 nums" style={{ color: p.errors > 0 ? 'var(--red)' : 'var(--text-faint)' }}>
                    {p.errors}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
