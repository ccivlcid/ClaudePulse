import { useEffect, useState } from 'react';
import type { ServerLog } from '../lib/dashboard.js';

const API_BASE = window.location.origin;

export function useServerLogs(sessionId: string | null, lines: number = 50) {
  const [logs, setLogs] = useState<ServerLog[]>([]);
  const [loading, setLoading] = useState(Boolean(sessionId));

  useEffect(() => {
    if (!sessionId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchLogs = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/sessions/${sessionId}/server-logs?lines=${lines}`);
        if (!response.ok) {
          if (!cancelled) setLogs([]);
          return;
        }

        const data = await response.json() as ServerLog[];
        if (!cancelled) setLogs(data);
      } catch {
        if (!cancelled) setLogs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [lines, sessionId]);

  return { logs, loading };
}
