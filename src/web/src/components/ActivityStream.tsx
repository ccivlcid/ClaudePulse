import { useRef, useEffect } from 'react';
import { usePulseStore } from '../stores/pulseStore.js';

const TOOL_COLORS: Record<string, string> = {
  Read: 'text-blue-400',
  Edit: 'text-yellow-400',
  Write: 'text-orange-400',
  Bash: 'text-green-400',
  Grep: 'text-purple-400',
  Glob: 'text-purple-300',
  Agent: 'text-cyan-400',
};

export default function ActivityStream() {
  const events = usePulseStore(s => s.events);
  const bottomRef = useRef<HTMLDivElement>(null);

  const toolEvents = events.filter(e =>
    e.type === 'tool-start' || e.type === 'tool-error'
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [toolEvents.length]);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 h-96 flex flex-col">
      <h2 className="text-sm font-semibold text-gray-400 mb-3">Activity Stream</h2>
      <div className="flex-1 overflow-y-auto space-y-1 font-mono text-xs">
        {toolEvents.length === 0 && (
          <p className="text-gray-600 italic">Waiting for events...</p>
        )}
        {toolEvents.map(e => {
          const time = new Date(e.ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const color = TOOL_COLORS[e.toolName ?? ''] ?? 'text-gray-300';
          const isError = e.type === 'tool-error';

          return (
            <div key={e.id} className={`flex gap-2 ${isError ? 'text-red-400' : ''}`}>
              <span className="text-gray-600 shrink-0">{time}</span>
              <span className={`shrink-0 w-14 ${isError ? 'text-red-400' : color}`}>
                {isError ? 'ERROR' : (e.toolName ?? '?')}
              </span>
              <span className="text-gray-400 truncate">
                {e.filePath ?? (e.toolInput as Record<string, string>)?.command ?? ''}
              </span>
              {isError && e.message && (
                <span className="text-red-300 truncate">{e.message}</span>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
