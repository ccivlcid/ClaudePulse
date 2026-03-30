import { usePulseSSE, useSessions } from './hooks/usePulseData.js';
import { usePulseStore } from './stores/pulseStore.js';
import ActivityStream from './components/ActivityStream.js';
import FileHeatmap from './components/FileHeatmap.js';
import AgentTracker from './components/AgentTracker.js';
import CostEstimate from './components/CostEstimate.js';
import SessionTimeline from './components/SessionTimeline.js';
import ErrorPanel from './components/ErrorPanel.js';
import ServerMonitor from './components/ServerMonitor.js';
import ProjectComparison from './components/ProjectComparison.js';

export default function App() {
  useSessions();
  usePulseSSE();

  const { connected, activeSessionId, events } = usePulseStore();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight">Claude Pulse</span>
          <span className="text-xs text-gray-500">v0.1.0</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">
            {activeSessionId ? `Session: ${activeSessionId.slice(0, 8)}...` : 'No session'}
          </span>
          <span className={`flex items-center gap-1.5 ${connected ? 'text-green-400' : 'text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            {connected ? 'Live' : 'Disconnected'}
          </span>
          <span className="text-gray-500">{events.length} events</span>
        </div>
      </header>

      {/* Dashboard Grid */}
      <main className="p-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <ActivityStream />
        </div>
        <div>
          <AgentTracker />
        </div>
        <div>
          <FileHeatmap />
        </div>
        <div>
          <CostEstimate />
        </div>
        <div>
          <ErrorPanel />
        </div>
        <div className="xl:col-span-2">
          <SessionTimeline />
        </div>
        <div>
          <ServerMonitor />
        </div>
        <div className="xl:col-span-3">
          <ProjectComparison />
        </div>
      </main>
    </div>
  );
}
