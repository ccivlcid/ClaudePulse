---
name: server
description: Start or stop a dev server with log monitoring via Claude Pulse
user-invocable: true
---

<Use_When>
- User says "dev server", "서버 시작", "서버 띄워", "start server", "stop server", "서버 내려"
- User wants to run a dev server with automatic log capture
</Use_When>

<Instructions>
## To start:

1. Detect the project type by checking files in the current directory:

| 파일 | 프레임워크 | 기본 명령어 |
|---|---|---|
| `package.json` (has "dev" script) | Node.js | `npm run dev` |
| `package.json` (has "start" script) | Node.js | `npm start` |
| `pom.xml` | Spring Boot (Maven) | `mvn spring-boot:run` |
| `build.gradle` / `build.gradle.kts` | Spring Boot (Gradle) | `./gradlew bootRun` |
| `manage.py` | Django | `python manage.py runserver` |
| `app.py` / `main.py` (Flask) | Flask | `python app.py` |
| `requirements.txt` + `uvicorn` | FastAPI | `uvicorn main:app --reload` |
| `Gemfile` + `bin/rails` | Rails | `bin/rails server` |
| `go.mod` | Go | `go run .` |
| `Cargo.toml` | Rust | `cargo run` |

2. If multiple matches or ambiguous, ask the user which command to use.
3. If the user explicitly provided a command, use that instead of auto-detection.
4. Call `pulse_start_server` MCP tool with the detected/provided command.
5. Report the server status (PID, port if detected).

## To stop:

1. Call `pulse_stop_server` MCP tool.
2. Confirm the server has been stopped.
</Instructions>
