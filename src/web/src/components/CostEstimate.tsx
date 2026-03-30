import { usePulseStore } from '../stores/pulseStore.js';

export default function CostEstimate() {
  const events = usePulseStore(s => s.events);

  let totalInputChars = 0;
  let toolCalls = 0;
  const toolCounts: Record<string, number> = {};

  for (const e of events) {
    if (e.type === 'tool-start') {
      toolCalls++;
      if (e.toolName) toolCounts[e.toolName] = (toolCounts[e.toolName] ?? 0) + 1;
      if (e.toolInput) totalInputChars += JSON.stringify(e.toolInput).length;
    }
  }

  const inputTokens = Math.round(totalInputChars / 4);
  const outputTokens = toolCalls * 500;
  const cost = (inputTokens / 1e6) * 3 + (outputTokens / 1e6) * 15;
  const low = cost * 0.5;
  const high = cost * 2.0;

  const sorted = Object.entries(toolCounts).sort(([, a], [, b]) => b - a);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 h-[480px] flex flex-col">
      <h2 className="text-sm font-semibold text-gray-400 mb-3">Cost Estimate</h2>
      <div className="flex-1">
        <div className="text-2xl font-bold text-white mb-1">
          ~${cost.toFixed(2)}
        </div>
        <div className="text-xs text-gray-500 mb-4">
          Range: ${low.toFixed(2)} ~ ${high.toFixed(2)}
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Tool Calls</span>
            <span>{toolCalls}</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min((toolCalls / 100) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-1 text-xs">
          {sorted.slice(0, 6).map(([name, count]) => (
            <div key={name} className="flex justify-between">
              <span className="text-gray-400">{name}</span>
              <span className="text-gray-300">{count}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="text-[10px] text-gray-600 border-t border-gray-800 pt-2 mt-2">
        Estimated 30-60% of actual cost
      </div>
    </div>
  );
}
