import { usePulseStore } from '../stores/pulseStore.js';
import { buildTokenUsage } from '../lib/dashboard.js';
import { translations } from '../lib/translations.js';

interface TokenUsageProps {
  onPopout?: () => void;
}

export default function TokenUsage({ onPopout }: TokenUsageProps) {
  const events = usePulseStore((state) => state.events);
  const language = usePulseStore((state) => state.language);
  const t = translations[language];
  const stats = buildTokenUsage(events);

  return (
    <div className="cli-pane">
      <div className="cli-pane-header">
        <span className="cli-pane-title">{t.TOKEN_USAGE}</span>
        <div className="flex items-center gap-3">
          <span className="text-[var(--text-muted)] text-[12px] font-bold mono tracking-tight">Σ {stats.totalTokens.toLocaleString()}</span>
          {onPopout && <button onClick={onPopout} className="cli-btn !px-3 !py-1" title="Popout"><span className="text-[14px] font-bold">↗</span></button>}
        </div>
      </div>

      <div className="cli-pane-content font-mono bg-[var(--bg)] p-8">
        <div className="grid grid-cols-1 mb-8 border border-[var(--border)] rounded-md overflow-hidden">
          <div className="bg-[var(--surface)] p-6 relative group text-center">
            <div className="text-[var(--text-faint)] text-[11px] font-bold uppercase tracking-widest mb-3">{t.TOTAL_TOKENS}</div>
            <div className="text-[var(--fg-bright)] font-bold text-4xl tracking-tighter leading-none mb-3">
              {stats.totalTokens.toLocaleString()}
            </div>

            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[var(--border-strong)]"></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-[var(--text-faint)] font-bold uppercase tracking-widest">{t.INPUT}</span>
            <span className="text-[18px] text-[var(--fg)] font-bold mono">{stats.inputTokens.toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-[11px] text-[var(--text-faint)] font-bold uppercase tracking-widest">{t.OUTPUT}</span>
            <span className="text-[18px] text-[var(--fg)] font-bold mono">{stats.outputTokens.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex justify-between items-center px-1 mb-2">
            <span className="text-[var(--text-faint)] text-[11px] font-bold uppercase tracking-widest">{t.DISTRIBUTION}</span>
            <span className="text-[var(--text-faint)] text-[11px] font-bold uppercase tracking-widest">{t.USAGE}</span>
          </div>
          
          {stats.toolBreakdown.length === 0 ? (
            <div className="text-[var(--text-faint)] italic text-[14px] font-medium text-center py-10 border border-dashed border-[var(--border)] rounded uppercase tracking-widest">{t.NO_DATA}</div>
          ) : (
            stats.toolBreakdown.slice(0, 4).map((t) => (
              <div key={t.tool} className="flex flex-col gap-2.5 px-1">
                <div className="flex justify-between items-center text-[13px] font-bold uppercase tracking-widest">
                  <span className="text-[var(--neon-cyan)]">{t.tool}</span>
                  <span className="text-[var(--fg)] mono">{(t.input + t.output).toLocaleString()}</span>
                </div>
                <div className="w-full h-2 bg-[var(--surface)] rounded-full overflow-hidden border border-[var(--border)]">
                  <div className="h-full bg-[var(--border-strong)]" style={{ width: `${(t.input + t.output) / stats.totalTokens * 100}%` }}></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
