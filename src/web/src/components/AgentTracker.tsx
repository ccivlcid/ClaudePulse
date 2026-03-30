import { usePulseStore } from '../stores/pulseStore.js';

export default function AgentTracker() {
  const events = usePulseStore(s => s.events);

  const agents = new Map<string, {
    agentId: string;
    agentType: string;
    status: 'running' | 'done';
    startTs: string;
    endTs?: string;
    tools: Record<string, number>;
  }>();

  for (const e of events) {
    if (e.type === 'agent-start' && e.agentId) {
      agents.set(e.agentId, {
        agentId: e.agentId,
        agentType: e.agentType ?? 'unknown',
        status: 'running',
        startTs: e.ts,
        tools: {},
      });
    }
    if (e.type === 'agent-stop' && e.agentId) {
      const a = agents.get(e.agentId);
      if (a) { a.status = 'done'; a.endTs = e.ts; }
    }
  }

  const agentList = [...agents.values()];

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 h-[480px] flex flex-col">
      <h2 className="text-sm font-semibold text-gray-400 mb-3">Agent Tracker</h2>
      <div className="flex-1 overflow-y-auto space-y-2 text-xs">
        {agentList.length === 0 && (
          <p className="text-gray-600 italic">No agents</p>
        )}
        {agentList.map(a => {
          const elapsed = Math.round(
            ((a.endTs ? new Date(a.endTs).getTime() : Date.now()) - new Date(a.startTs).getTime()) / 1000
          );
          return (
            <div key={a.agentId} className="border border-gray-800 rounded p-2">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  a.status === 'running'
                    ? 'bg-green-900 text-green-300'
                    : 'bg-gray-800 text-gray-400'
                }`}>
                  {a.status === 'running' ? 'RUNNING' : 'DONE'}
                </span>
                <span className="text-gray-300">{a.agentType}</span>
              </div>
              <div className="text-gray-500">{elapsed}s elapsed</div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-xs text-gray-500 border-t border-gray-800 pt-2">
        Active: {agentList.filter(a => a.status === 'running').length} |
        Done: {agentList.filter(a => a.status === 'done').length}
      </div>
    </div>
  );
}
