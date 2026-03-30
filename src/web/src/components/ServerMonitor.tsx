import { useState, useEffect } from 'react';

interface ServerLog {
  ts: string;
  level: string;
  source: string;
  text: string;
}

const API_BASE = window.location.origin;

export default function ServerMonitor() {
  const [logs, setLogs] = useState<ServerLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const activeRes = await fetch(`${API_BASE}/api/sessions/active`);
        if (!activeRes.ok) { setLoading(false); return; }
        const active = await activeRes.json();

        const logsRes = await fetch(`${API_BASE}/api/sessions/${active.id}/server-logs?lines=50`);
        const data = await logsRes.json();
        setLogs(data);
      } catch { /* ignore */ }
      setLoading(false);
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 h-[480px] flex flex-col">
      <h2 className="text-sm font-semibold text-gray-400 mb-3">Server Monitor</h2>
      <div className="flex-1 overflow-y-auto font-mono text-xs space-y-0.5">
        {loading && <p className="text-gray-600 italic">Loading...</p>}
        {!loading && logs.length === 0 && (
          <p className="text-gray-600 italic">No server running. Use pulse_start_server to start.</p>
        )}
        {logs.map((log, i) => {
          const time = new Date(log.ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const levelColor = log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-yellow-400' : 'text-gray-400';
          return (
            <div key={i} className="flex gap-2">
              <span className="text-gray-600 shrink-0">{time}</span>
              <span className={`shrink-0 ${levelColor}`}>
                {log.level === 'error' ? '[ERR]' : log.level === 'warn' ? '[WRN]' : '     '}
              </span>
              <span className={log.level === 'error' ? 'text-red-300' : 'text-gray-300'}>
                {log.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
