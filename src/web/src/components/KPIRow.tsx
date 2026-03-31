import { formatDuration } from '../lib/dashboard.js';
import { usePulseStore } from '../stores/pulseStore.js';
import { translations } from '../lib/translations.js';

interface KPIRowProps {
  elapsedMs: number;
  toolCalls: number;
  totalTokens: number;
  hotFiles: number;
  activeAgents: number;
}

export default function KPIRow({
  elapsedMs,
  toolCalls,
  totalTokens,
  hotFiles,
  activeAgents,
}: KPIRowProps) {
  const language = usePulseStore((state) => state.language);
  const t = translations[language];

  const items = [
    { label: t.ELAPSED, value: formatDuration(elapsedMs), color: 'var(--neon-green)' },
    { label: t.TOOL_CALLS, value: toolCalls.toString(), color: 'var(--neon-cyan)' },
    { label: t.TOKENS, value: totalTokens.toLocaleString(), color: 'var(--neon-amber)' },
    { label: t.HOT_FILES, value: hotFiles.toString(), color: 'var(--neon-cyan)' },
    { label: t.ACTIVE_AGENTS, value: activeAgents.toString(), color: activeAgents > 0 ? 'var(--neon-green)' : 'var(--text-faint)' },
  ];

  return (
    <div className="flex bg-[var(--surface)] border-x border-b border-[var(--border)] divide-x divide-[var(--border)]">
      {items.map((item) => (
        <div key={item.label} className="flex-1 px-8 py-3 flex items-center justify-between group hover:bg-[var(--surface-raised)] transition-all">
          <span className="text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-wider">{item.label}</span>
          <span className="text-[16px] font-bold mono" style={{ color: item.color }}>
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
