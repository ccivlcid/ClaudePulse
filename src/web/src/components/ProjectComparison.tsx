import { usePulseStore } from '../stores/pulseStore.js';

export default function ProjectComparison() {
  const sessions = usePulseStore(s => s.sessions);

  // Group by project
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
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      <h2 className="text-sm font-semibold text-gray-400 mb-3">Project Comparison</h2>
      {sorted.length === 0 ? (
        <p className="text-gray-600 italic text-xs">No session data</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left py-2 pr-4">Project</th>
                <th className="text-right py-2 px-3">Sessions</th>
                <th className="text-right py-2 px-3">Tools</th>
                <th className="text-right py-2 px-3">Agents</th>
                <th className="text-right py-2 px-3">Errors</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => (
                <tr key={p.project} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-2 pr-4 text-gray-300 truncate max-w-xs" title={p.project}>
                    {p.project.split('/').slice(-2).join('/')}
                  </td>
                  <td className="text-right py-2 px-3 text-gray-400">{p.sessions}</td>
                  <td className="text-right py-2 px-3 text-gray-300">{p.tools}</td>
                  <td className="text-right py-2 px-3 text-gray-400">{p.agents}</td>
                  <td className="text-right py-2 px-3">
                    <span className={p.errors > 0 ? 'text-red-400' : 'text-gray-500'}>{p.errors}</span>
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
