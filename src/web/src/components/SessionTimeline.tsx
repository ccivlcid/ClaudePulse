import { usePulseStore } from '../stores/pulseStore.js';

const TYPE_ICONS: Record<string, string> = {
  'session-start': '▶',
  'session-end': '■',
  'tool-start': '⚡',
  'tool-error': '✗',
  'agent-start': '🤖',
  'agent-stop': '✓',
};

const TYPE_COLORS: Record<string, string> = {
  'session-start': 'border-green-500',
  'session-end': 'border-gray-500',
  'tool-start': 'border-blue-500',
  'tool-error': 'border-red-500',
  'agent-start': 'border-cyan-500',
  'agent-stop': 'border-cyan-700',
};

export default function SessionTimeline() {
  const events = usePulseStore(s => s.events);

  // Show key events only (not tool-end, it's noise)
  const keyEvents = events.filter(e =>
    e.type !== 'tool-end'
  ).slice(-30);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 h-[480px] flex flex-col">
      <h2 className="text-sm font-semibold text-gray-400 mb-3">Session Timeline</h2>
      <div className="flex-1 overflow-y-auto">
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-800" />

          {keyEvents.length === 0 && (
            <p className="text-gray-600 italic text-xs">No events yet</p>
          )}
          {keyEvents.map(e => {
            const time = new Date(e.ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const icon = TYPE_ICONS[e.type] ?? '·';
            const borderColor = TYPE_COLORS[e.type] ?? 'border-gray-600';

            let label = e.type;
            if (e.type === 'tool-start') label = e.toolName ?? 'tool';
            if (e.type === 'tool-error') label = `${e.toolName ?? 'tool'} ERROR`;
            if (e.type === 'agent-start') label = `Agent: ${e.agentType ?? '?'}`;
            if (e.type === 'agent-stop') label = `Agent done: ${e.agentType ?? '?'}`;

            return (
              <div key={e.id} className="relative mb-2 text-xs">
                <div className={`absolute -left-4 top-0.5 w-3 h-3 rounded-full border-2 bg-gray-950 ${borderColor}`} />
                <div className="flex gap-2">
                  <span className="text-gray-600 shrink-0">{time}</span>
                  <span className="shrink-0">{icon}</span>
                  <span className="text-gray-300">{label}</span>
                  {e.filePath && <span className="text-gray-500 truncate">{e.filePath}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
