import { create } from 'zustand';

export interface PulseEvent {
  id: string;
  ts: string;
  sessionId: string;
  projectDir: string;
  type: string;
  toolName?: string;
  toolUseId?: string;
  toolInput?: Record<string, unknown>;
  filePath?: string;
  toolResponse?: { stdout?: string; stderr?: string; interrupted?: boolean };
  message?: string;
  agentId?: string;
  agentType?: string;
  lastAgentMessage?: string;
}

export interface SessionEntry {
  id: string;
  project: string;
  startedAt: string;
  endedAt: string | null;
  toolCount: number;
  agentCount: number;
  errorCount: number;
}

interface PulseState {
  events: PulseEvent[];
  sessions: SessionEntry[];
  activeSessionId: string | null;
  connected: boolean;
  addEvent: (event: PulseEvent) => void;
  setEvents: (events: PulseEvent[]) => void;
  setSessions: (sessions: SessionEntry[]) => void;
  setActiveSessionId: (id: string | null) => void;
  setConnected: (connected: boolean) => void;
}

export const usePulseStore = create<PulseState>((set) => ({
  events: [],
  sessions: [],
  activeSessionId: null,
  connected: false,
  addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
  setEvents: (events) => set({ events }),
  setSessions: (sessions) => set({ sessions }),
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  setConnected: (connected) => set({ connected }),
}));
