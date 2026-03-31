import { shortPath } from '../lib/dashboard.js';
import type { FileStat } from '../lib/dashboard.js';
import { usePulseStore } from '../stores/pulseStore.js';
import { translations } from '../lib/translations.js';

interface TopFilesProps {
  files: FileStat[];
  onPopout?: () => void;
}

export default function TopFiles({ files, onPopout }: TopFilesProps) {
  const language = usePulseStore((state) => state.language);
  const t = translations[language];
  const topFiles = files.slice(0, 10);

  return (
    <div className="cli-pane">
      <div className="cli-pane-header">
        <span className="cli-pane-title">{t.TOP_FILES}</span>
        <div className="flex items-center gap-3">
          <span className="text-[var(--text-muted)] text-[12px] font-bold uppercase tracking-wider">{files.length} {t.NODES}</span>
          {onPopout && <button onClick={onPopout} className="cli-btn !px-3 !py-1" title="Popout"><span className="text-[14px] font-bold">↗</span></button>}
        </div>
      </div>

      <div className="cli-pane-content font-mono bg-[var(--bg)] p-0">
        {topFiles.length === 0 ? (
          <div className="h-full flex items-center justify-center opacity-40">
            <span className="text-[14px] font-bold text-[var(--text-faint)] uppercase tracking-[0.2em]">{t.VOID_CONTEXT}</span>
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--surface-raised)] border-b border-[var(--border)]">
                  <th className="pl-8 py-4 w-20 text-[var(--text-faint)] text-[11px] font-bold tracking-wider">{t.TOTAL}</th>
                  <th className="py-4 w-12 text-[var(--neon-green)] text-[11px] font-bold text-center">R</th>
                  <th className="py-4 w-12 text-[var(--neon-amber)] text-[11px] font-bold text-center">E</th>
                  <th className="py-4 w-12 text-[var(--neon-red)] text-[11px] font-bold text-center">W</th>
                  <th className="py-4 pr-8 text-[var(--text-faint)] text-[11px] font-bold tracking-wider">{t.PATH_RESOURCE}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {topFiles.map((f, i) => (
                  <tr key={i} className="group hover:bg-[var(--surface)] transition-colors">
                    <td className="pl-8 py-5 font-bold text-[var(--fg-bright)] text-[16px] mono">{f.total}</td>
                    <td className="py-5 text-[var(--neon-green)] text-[13px] text-center font-bold mono opacity-80">{f.read}</td>
                    <td className="py-5 text-[var(--neon-amber)] text-[13px] text-center font-bold mono opacity-80">{f.edit}</td>
                    <td className="py-5 text-[var(--neon-red)] text-[13px] text-center font-bold mono opacity-80">{f.write}</td>
                    <td className="py-5 pr-8 text-[var(--text-muted)] group-hover:text-[var(--fg)] transition-colors truncate max-w-[180px] font-medium text-[13px] mono uppercase" title={f.path}>
                      {shortPath(f.path)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
