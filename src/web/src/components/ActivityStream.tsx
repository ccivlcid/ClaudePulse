import { useRef, useEffect } from 'react';
import { usePulseStore } from '../stores/pulseStore.js';

const TOOL_COLOR: Record<string, string> = {
  Read: '#60a5fa',
  Edit: '#f59e0b',
  Write: '#f97316',
  Bash: '#22c55e',
  Grep: '#a78bfa',
  Glob: '#a78bfa',
  Agent: '#22d3ee',
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
    <div className="h-[560px] flex flex-col rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>Activity</h2>
        <span className="text-[12px] nums" style={{ color: 'var(--text-faint)' }}>{toolEvents.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto -mx-5 px-5">
        {toolEvents.length === 0 ? (
          <p className="text-[13px] pt-8 text-center" style={{ color: 'var(--text-faint)' }}>
            Waiting for activity...
          </p>
        ) : (
          <table className="w-full text-[12px]" style={{ borderSpacing: '0 1px' }}>
            <tbody>
              {toolEvents.map(e => {
                const time = new Date(e.ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const isError = e.type === 'tool-error';
                const color = isError ? 'var(--red)' : (TOOL_COLOR[e.toolName ?? ''] ?? 'var(--text-muted)');

                return (
                  <tr key={e.id} className="group hover:bg-white/[0.02]">
                    <td className="py-[5px] pr-3 nums whitespace-nowrap" style={{ color: 'var(--text-faint)' }}>{time}</td>
                    <td className="py-[5px] pr-3 whitespace-nowrap font-medium w-16" style={{ color }}>
                      {isError ? 'ERROR' : e.toolName}
                    </td>
                    <td className="py-[5px] truncate max-w-0" style={{ color: 'var(--text-muted)' }}>
                      {e.filePath ?? (e.toolInput as Record<string, string>)?.command ?? ''}
                    </td>
                    {isError && e.message && (
                      <td className="py-[5px] pl-3 truncate max-w-0 text-[11px]" style={{ color: '#fca5a5' }}>
                        {e.message}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
