import { usePulseStore } from '../stores/pulseStore.js';

export default function ErrorPanel() {
  const events = usePulseStore(s => s.events);

  const errors = events.filter(e => e.type === 'tool-error');

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 h-96 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-400">Errors & Alerts</h2>
        {errors.length > 0 && (
          <span className="bg-red-900 text-red-300 text-[10px] px-1.5 py-0.5 rounded font-bold">
            {errors.length}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 text-xs">
        {errors.length === 0 && (
          <p className="text-gray-600 italic">No errors</p>
        )}
        {errors.map(e => {
          const time = new Date(e.ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          return (
            <div key={e.id} className="border border-red-900/50 bg-red-950/30 rounded p-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-400 font-bold">ERROR</span>
                <span className="text-gray-500">{time}</span>
                <span className="text-gray-400">{e.toolName}</span>
              </div>
              {e.message && (
                <div className="text-red-300 break-words">{e.message}</div>
              )}
              {e.toolResponse?.stderr && (
                <div className="text-red-300/70 mt-1 break-words">{e.toolResponse.stderr.slice(0, 200)}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
