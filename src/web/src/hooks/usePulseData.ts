import { useEffect, useRef } from 'react';
import { usePulseStore, type PulseEvent } from '../stores/pulseStore.js';

const API_BASE = window.location.origin;

function getProjectFilter(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('project');
}

export function usePulseSSE() {
  const { setEvents, addEvent, setConnected, activeSessionId } = usePulseStore();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!activeSessionId) return;

    const url = `${API_BASE}/api/sse?sessionId=${activeSessionId}`;
    const es = new EventSource(url);
    esRef.current = es;
    let initialBatch: PulseEvent[] = [];
    let initialized = false;

    es.addEventListener('pulse-event', (e) => {
      try {
        const event = JSON.parse(e.data) as PulseEvent;
        if (!initialized) {
          initialBatch.push(event);
        } else {
          addEvent(event);
        }
      } catch { /* skip */ }
    });

    es.addEventListener('heartbeat', () => {
      if (!initialized) {
        initialized = true;
        setEvents(initialBatch);
        initialBatch = [];
      }
    });

    es.onopen = () => setConnected(true);
    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) {
        setConnected(false);
      }
    };

    // If no heartbeat within 5s, flush initial batch
    const timeout = setTimeout(() => {
      if (!initialized) {
        initialized = true;
        setEvents(initialBatch);
        initialBatch = [];
      }
    }, 5000);

    return () => {
      clearTimeout(timeout);
      es.close();
      esRef.current = null;
    };
  }, [activeSessionId, setEvents, addEvent, setConnected]);
}

export function useSessions() {
  const { setSessions, setActiveSessionId } = usePulseStore();

  useEffect(() => {
    const project = getProjectFilter();
    const projectParam = project ? `?project=${encodeURIComponent(project)}` : '';

    fetch(`${API_BASE}/api/sessions${projectParam}`)
      .then(r => r.json())
      .then(sessions => {
        setSessions(sessions);
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/sessions/active${projectParam}`)
      .then(r => r.json())
      .then(active => {
        if (active?.id) setActiveSessionId(active.id);
      })
      .catch(() => {});
  }, [setSessions, setActiveSessionId]);
}
