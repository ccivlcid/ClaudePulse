# Claude Pulse

> A dashboard plugin that visualizes all Claude Code CLI activity in real time

---

## At a Glance

Every file read, edit, and test that Claude Code performs is **automatically recorded** and viewable in real time — either from the CLI or a web dashboard.

```
Claude Code CLI
  │
  ├── Hooks auto-record every tool use  →  ~/.claude-pulse/sessions/*.jsonl
  │
  ├── Query from CLI          "/claude-pulse:stats"
  │
  └── Visualize in dashboard  "/claude-pulse:dashboard"  →  http://localhost:52101
  │
  └── Start/stop dev server   "/claude-pulse:server <command>"  →  http://localhost:<port>
```

---

## Installation

```bash
# 1. Register the marketplace (one-time)
claude plugin marketplace add ccivlcid/ClaudePulse

# 2. Install the plugin
claude plugin install claude-pulse@claude-pulse

# 3. Enable the plugin
claude plugin enable claude-pulse
```

Data collection begins immediately after installation. No additional configuration required.

### Requirements

- Node.js >= 20
- Claude Code CLI

### Plugin Management

```bash
# Uninstall
claude plugin uninstall claude-pulse

# Uninstall (preserve data — keeps ~/.claude-pulse/)
claude plugin uninstall claude-pulse --keep-data

# Update
claude plugin update claude-pulse

# Disable / re-enable
claude plugin disable claude-pulse
claude plugin enable claude-pulse
```

Use scopes to control where the plugin is active:

| Scope   | Flag                    | Applies to                                         |
| ------- | ----------------------- | -------------------------------------------------- |
| user    | `--scope user` (default)| All projects                                       |
| project | `--scope project`       | Current project only (`.claude/settings.json`)     |
| local   | `--scope local`         | Local only (`.claude/settings.local.json`, untracked) |

---

## Usage

### Slash Commands

| Command                     | Description                                      |
| --------------------------- | ------------------------------------------------ |
| `/claude-pulse:stats`       | Current session statistics summary               |
| `/claude-pulse:dashboard`   | Open the web dashboard                           |
| `/claude-pulse:logs`        | View dev server logs                             |
| `/claude-pulse:server`      | Start / stop a dev server                        |
| `/claude-pulse:errors`      | All session errors (tool failures + server errors) |
| `/claude-pulse:heatmap`     | File access frequency ranking                    |
| `/claude-pulse:agents`      | Active agent status                              |
| `/claude-pulse:tokens`      | Estimated token usage                            |
| `/claude-pulse:timeline`    | Session timeline summary                         |
| `/claude-pulse:health`      | Dev server health diagnosis                      |
| `/claude-pulse:reset`       | Reset session data or all data                   |

### 1. Session Statistics

```
> /claude-pulse:stats

── Session Stats ──────────────────
Elapsed: 6m | Tools: 67 | Errors: 1

  Read: 32  Edit: 12  Bash: 8
  Grep: 8   Agent: 4  Write: 3
───────────────────────────────────
```

Natural language also works:

- "Show me the session stats"
- "How much have I used so far?"
- "Which files were modified the most?"

### 2. Web Dashboard

```
> /claude-pulse:dashboard
```

Opens `http://localhost:52101` in your browser automatically.

**Dashboard panels:**

| Panel               | Description                                        |
| ------------------- | -------------------------------------------------- |
| **Activity Stream** | Real-time chronological feed of all tool usage      |
| **Alert Center**    | Combined view of tool errors and server errors      |
| **Agent Tracker**   | Main agent and subagent activity tracking           |
| **Top Files**       | Most frequently accessed files, ranked              |
| **Token Usage**     | Estimated token consumption per session (tool-based)|
| **Server Monitor**  | Live dev server log output                          |

Click the **↗** button in any panel header to pop it out into a full-screen window.

The dashboard uses SSE (Server-Sent Events) for real-time updates. Claude Code activity is reflected instantly without refreshing.

### 3. Dev Server Monitoring

Start or stop a dev server using slash commands or natural language.

```
> /claude-pulse:server start npm run dev
→ "Dev server started (PID: 12345, localhost:3000)"

> /claude-pulse:server stop
→ "Dev server stopped"
```

Natural language works too:

```
> Start the dev server
Claude Code → pulse_start_server({ command: "npm run dev" })
→ "Next.js server started (localhost:3000)"

> Stop the dev server
Claude Code → pulse_stop_server()
→ "Server stopped"
```

While the server is running, logs are automatically captured and displayed in the Server Monitor panel in real time.

Checking errors:

```
> Any server errors?
→ "1 found — TypeError at src/api/auth.ts:42 (14:35:05)"
→ Claude Code automatically reads the file → suggests a fix

> /claude-pulse:errors
→ Summary of all errors in the session (tool failures + server errors)
```

**Auto-detected error patterns:**

- JavaScript exceptions: `TypeError`, `ReferenceError`, `SyntaxError`
- HTTP errors: 4xx/5xx responses
- Build errors: `Failed to compile`, `Module not found`
- Network errors: `EADDRINUSE`, `ECONNREFUSED`
- Stack traces

---

## How It Works

### Data Collection (Automatic)

Claude Pulse uses the built-in Hook system in Claude Code.

```
User: "Refactor the auth module"

  Claude Code calls the Read tool
  → PreToolUse Hook fires
  → collect-event.mjs runs
  → One line appended to ~/.claude-pulse/sessions/{sessionId}.jsonl

  Claude Code calls the Edit tool
  → Same process repeats

  Tool failure
  → PostToolUseFailure Hook fires
  → Error details recorded
```

Collected events:

| Hook                 | Event           | Description         |
| -------------------- | --------------- | ------------------- |
| `SessionStart`       | `session-start` | Session started     |
| `PreToolUse`         | `tool-start`    | Tool use started    |
| `PostToolUse`        | `tool-end`      | Tool use completed  |
| `PostToolUseFailure` | `tool-error`    | Tool execution failed|
| `SubagentStart`      | `agent-start`   | Subagent started    |
| `SubagentStop`       | `agent-stop`    | Subagent stopped    |
| `SessionEnd`         | `session-end`   | Session ended       |

### Data Storage

All data is stored in local JSONL files. No external server or database required.

```
~/.claude-pulse/
├── sessions/
│   ├── {sessionId-1}.jsonl    # Per-session event logs
│   └── {sessionId-2}.jsonl
├── servers/
│   └── {sessionId}.jsonl      # Dev server logs
├── index.json                 # Session index (for fast lookups)
└── config.json                # Configuration
```

Example JSONL line:

```json
{"id":"a1b2","ts":"2026-03-30T14:32:01Z","type":"tool-start","sessionId":"8ebad784-...","toolName":"Read","toolUseId":"toolu_01Gt...","filePath":"src/auth.ts","projectDir":"/home/user/my-app"}
```

### Data Retention

- Event logs: 30-day retention (default)
- Server logs: 7-day retention
- Max storage: 500 MB (oldest sessions deleted when exceeded)
- Cleanup runs only at session end (zero overhead during work)

---

## MCP Tools

These tools can be invoked via natural language inside Claude Code.

| Tool                   | Description                    | Example                          |
| ---------------------- | ------------------------------ | -------------------------------- |
| `pulse_session_stats`  | Current session statistics     | "Show me the session stats"      |
| `pulse_server_logs`    | Recent dev server logs         | "Show the last 20 server logs"   |
| `pulse_server_errors`  | Dev server errors only         | "Any server errors?"             |
| `pulse_file_heatmap`   | File access frequency ranking  | "Which file was modified most?"  |
| `pulse_agent_status`   | Active agent status            | "What's the agent status?"       |
| `pulse_token_usage`    | Estimated token usage          | "How many tokens have I used?"   |
| `pulse_server_health`  | Server health diagnosis        | "How's the server doing?"        |
| `pulse_start_server`   | Start dev server + log capture | "Start the dev server"           |
| `pulse_stop_server`    | Stop dev server                | "Stop the dev server"            |
| `pulse_timeline`       | Session timeline summary       | "Summarize today's work"         |
| `pulse_open_dashboard` | Open the web dashboard         | "Open the dashboard"             |
| `pulse_reset_session`  | Delete a specific session      | "Reset session data"             |
| `pulse_reset_all`      | Reset all Pulse data           | "Clear all Pulse data"           |

---

## Configuration

Edit `~/.claude-pulse/config.json`:

```json
{
  "retention": {
    "eventsDays": 30,
    "serverLogsDays": 7,
    "maxTotalSizeMb": 500
  },
  "ports": {
    "dashboard": 52101
  }
}
```

You can also override the port via environment variable:

```bash
PULSE_DASHBOARD_PORT=52102
```

---

## About Token Estimation

Token estimates are based on tool input text length (~4 chars/token) and per-tool average output token tables.

Since hooks cannot observe system prompts, conversation history, or reasoning tokens, **only tool-related tokens can be estimated**. The estimates are useful for **relative comparisons** across sessions and projects; absolute numbers are approximate.

---

## Tech Stack

| Component       | Technology                                     |
| --------------- | ---------------------------------------------- |
| Event collection| JSONL (`fs.appendFileSync`, zero dependency)   |
| MCP Server      | `@modelcontextprotocol/sdk`                    |
| Dashboard API   | Hono                                           |
| Real-time       | SSE (Server-Sent Events)                       |
| Frontend        | React 19 + Vite                                |
| Styling         | Tailwind CSS 4                                 |
| Charts          | Recharts                                       |
| State           | Zustand                                        |

No native C++ module dependencies — works on Windows, macOS, and Linux.

---

## Limitations

- Dev servers started directly from a terminal (outside Claude Code) cannot have their logs captured — use `pulse_start_server` instead
- Token estimates are tool-call-based approximations (system prompt and conversation history excluded)
- Hooks only report tool start/end — intermediate progress is not observable

---

## License

MIT
