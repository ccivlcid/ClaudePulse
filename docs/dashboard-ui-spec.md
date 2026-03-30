# Dashboard UI Specification

작성일: 2026-03-31  
연결 문서: `docs/dashboard-design-diagnosis.md`, `docs/dashboard-wireframe.md`  
목적: Claude Pulse 대시보드 구현 전, 화면 카피와 컴포넌트 명세를 확정하기 위한 상세 UI 문서

## 1. 문서 범위

이 문서는 다음 내용을 정의한다.

- 화면 레벨 정보 위계
- 패널별 역할과 포함 데이터
- 상태별 화면 카피
- 핵심 인터랙션
- 구현 우선순위

이 문서는 다음 내용을 다루지 않는다.

- 최종 시각 스타일 수치
- 상세 CSS 토큰 값
- API 응답 타입 전체 정의

## 2. 페이지 레벨 명세

### 2.1 페이지 목적

Claude Pulse Dashboard는 Claude Code 세션의 현재 상태를 빠르게 판단하고, 문제가 발생했을 때 원인을 추적하며, 세션 종료 후 작업 흐름을 회고할 수 있어야 한다.

### 2.2 첫 화면에서 답해야 하는 질문

1. 지금 세션은 정상인가
2. 현재 가장 중요한 이슈는 무엇인가
3. 누가 어떤 작업을 하고 있는가
4. 어디에 작업이 집중되고 있는가
5. 이 세션의 비용과 규모는 어느 정도인가

### 2.3 페이지 구조

- Global Status Bar
- KPI Row
- Primary Column: Activity Feed
- Secondary Column: Alert Center + Cost Snapshot
- Insight Row: Session Timeline / Top Files / Agent Tracker
- Diagnostics Row: Server Summary & Logs / Project Comparison

## 3. 공통 UI 규칙

### 3.1 카드 공통 규칙

모든 카드는 다음 구조를 가진다.

- 헤더: 제목, 보조 지표, 상태 배지
- 본문: 핵심 데이터 또는 empty state
- 선택 요소: 필터, 액션, 상세 확장

### 3.2 제목 규칙

- 제목은 사용자가 즉시 이해할 수 있는 명사형 사용
- 실제 표현과 이름이 일치해야 함
- 모호한 경우 기능형 이름보다 결과형 이름을 우선

권장 예시:

- `Errors` 대신 `Alert Center`
- `Files` 대신 `Top Files`
- `Server` 대신 `Server Summary`

### 3.3 상태 배지 규칙

사용 가능한 상태:

- `LIVE`
- `OFFLINE`
- `OK`
- `WARN`
- `ERROR`
- `RUNNING`
- `DONE`

표시 원칙:

- 상태 텍스트와 색을 함께 사용
- 색만으로 의미를 전달하지 않음

### 3.4 숫자 표기 규칙

- 시간: `6m`, `42s`, `1h 12m`
- 비용: `$2.80`
- 범위: `$1.40-$5.60`
- 수량: `67 calls`, `3 agents`
- 날짜/시각: `14:36:12`

## 4. 화면 카피 가이드

### 4.1 톤

- 짧고 명확해야 함
- 운영 화면처럼 사실 중심으로 표현
- 마케팅성 문구 금지

### 4.2 카피 규칙

좋은 예:

- `No live events yet`
- `2 agents running`
- `Server warnings detected`
- `Updated 14:36:12`

피해야 할 예:

- `Everything looks great!`
- `Awesome, no errors found`
- `Your dashboard is empty for now`

## 5. 컴포넌트 명세

### 5.1 Global Status Bar

목적:

- 가장 상단에서 현재 운영 상태를 요약한다.

필수 데이터:

- connectionStatus
- sessionStatus
- activeAgentCount
- alertCount
- serverStatus
- updatedAt

UI 구성:

- 좌측: 제품명 `Claude Pulse`
- 중앙: 상태 배지들
- 우측: 마지막 갱신 시각, 테마 토글

권장 카피:

- 연결 정상: `LIVE`
- 연결 끊김: `OFFLINE`
- 세션 진행 중: `Session active`
- 세션 없음: `No active session`
- 서버 경고: `Server WARN`
- 서버 오류: `Server ERROR`
- 최신 갱신: `Updated 14:36:12`

인터랙션:

- 상태 배지 hover 시 상세 설명 툴팁
- 세션 상태 클릭 시 세션 메타 정보 표시 가능

빈 상태:

- `OFFLINE`
- `No active session`
- `Updated --:--:--`

### 5.2 KPI Row

목적:

- 현재 세션의 규모를 압축해 전달한다.

필수 KPI:

- elapsedTime
- totalToolCalls
- estimatedCost
- hotFileCount
- currentProject

권장 라벨:

- `Elapsed`
- `Tool Calls`
- `Est. Cost`
- `Hot Files`
- `Project`

권장 값 예시:

- `06m`
- `67`
- `$2.80`
- `3`
- `claude-pulse`

인터랙션:

- 각 KPI hover 시 계산 기준 설명
- `Project` 클릭 시 `Project Comparison`와 연계 가능

### 5.3 Activity Feed

목적:

- 최근 작업 흐름을 가장 풍부하게 보여주는 메인 패널

필수 데이터:

- ts
- eventType
- toolName
- filePath
- command
- agentType
- status
- message

표현 구조:

- 그룹 헤더: 태스크 또는 에이전트 기준
- 그룹 본문: 개별 이벤트 목록
- 아이템 요소:
  - 시각
  - 타입 배지
  - 라벨
  - 파일/명령
  - 상태

권장 그룹 예시:

- `executor working on auth.ts`
- `test-engineer validating auth flow`
- `session started`

권장 이벤트 카피 예시:

- `Read src/auth.ts`
- `Edit src/auth.ts`
- `Run npm test`
- `Bash failed`
- `Agent completed`

필터:

- All
- Errors
- Tools
- Agents
- Server

빈 상태:

- 제목: `Activity Feed`
- 본문: `No live events yet. Tool activity will appear here.`

오류 상태:

- 패널 상단 필터 자동 강조 가능
- 오류 이벤트는 badge와 row tone 모두 구분

### 5.4 Alert Center

목적:

- 가장 먼저 처리해야 하는 문제를 모은다.

필수 데이터:

- severity
- source
- title
- message
- filePath
- firstSeen
- latestSeen

소스 범위:

- Tool failure
- Server error
- Test warning
- Bash non-zero exit

정렬:

- severity 높은 순
- latestSeen 최신 순

권장 헤더 카피:

- `Alert Center`
- 보조 수치: `3 active alerts`

권장 아이템 카피:

- `[ERROR] Bash failed`
- `[WARN] Test failed`
- `[ERROR] POST /api/auth returned 500`

빈 상태:

- `No alerts`
- `Tool failures, server errors, and test warnings will appear here.`

인터랙션:

- 카드 클릭 시 관련 Activity 항목으로 점프
- 파일 경로 클릭 시 관련 파일 정보 노출 가능

### 5.5 Cost Snapshot

목적:

- 현재 세션 비용을 빠르게 이해하게 한다.

필수 데이터:

- estimatedCost
- rangeLow
- rangeHigh
- toolCostBreakdown
- totalToolCalls

헤더 카피:

- `Cost Snapshot`
- 보조 라벨: `$1.40-$5.60 range`

본문 카피:

- 메인 수치: `$2.80`
- 서브 라벨: `estimated`

보조 설명:

- `Estimate based on tool I/O only`

빈 상태:

- `$0.00`
- `No tool activity yet`

인터랙션:

- 막대 hover 시 툴별 비율과 호출 수 표시

### 5.6 Session Timeline

목적:

- 세션 흐름을 회고 가능한 milestone 중심으로 요약한다.

필수 데이터:

- ts
- milestoneType
- title
- summary
- relatedFile

표현 원칙:

- 모든 이벤트를 다 보여주지 않음
- 의미 있는 전환점만 선택

milestone 예시:

- Session started
- Exploration phase
- Agent delegated
- Tests executed
- Error detected
- Fix applied
- Session ended

권장 empty state:

- `No milestones yet`
- `Session milestones will appear as work progresses.`

인터랙션:

- milestone 클릭 시 해당 Activity 그룹 하이라이트

### 5.7 Top Files

목적:

- 작업 집중 파일을 보여준다.

권장 명칭:

- 현재 표현 유지 시 `Top Files`
- treemap 구현 시 `File Heatmap`

필수 데이터:

- filePath
- readCount
- editCount
- writeCount
- totalCount

표현 규칙:

- 현재 단계에서는 list + bar 구조 허용
- 단, read/edit/write를 분리 표기해야 함

권장 행 카피:

- `src/auth.ts`
- `R 12 / E 5 / W 0`

빈 상태:

- `No file activity yet`
- `Read, Edit, and Write events will appear here.`

인터랙션:

- row hover 시 전체 경로 표시
- 클릭 시 Activity Feed 필터 연동 가능

### 5.8 Agent Tracker

목적:

- 에이전트 상태와 활동량을 보여준다.

필수 데이터:

- agentId
- agentType
- status
- currentTask
- elapsedTime
- toolUsageSummary

권장 아이템 구조:

- 상태 배지
- agentType
- currentTask
- `Read 3 / Edit 1 / Bash 0`
- `2m 30s`

권장 카피:

- `executor running`
- `test-engineer running`
- `explorer done`

빈 상태:

- `No active agents`
- `Subagent activity will appear here.`

### 5.9 Server Summary & Logs

목적:

- 서버 상태를 먼저 요약하고, 필요 시 로그를 읽게 한다.

필수 데이터:

- serverName
- port
- status
- requestCount
- avgResponseTime
- latestError
- logLines

상단 요약 영역:

- `Next.js`
- `localhost:3000`
- `WARN`
- `24 requests`
- `avg 22ms`

하단 로그 영역:

- 최신 20-50줄
- error/warn 강조

빈 상태:

- `No server running`
- `Start a dev server to monitor logs and errors.`

인터랙션:

- raw logs expand/collapse
- error line 클릭 시 상세 열기 가능

### 5.10 Project Comparison

목적:

- 프로젝트별 작업 규모와 위험도를 비교한다.

필수 데이터:

- projectName
- sessionCount
- toolCount
- agentCount
- errorCount
- estimatedCost

컬럼 권장안:

- Project
- Sessions
- Tools
- Agents
- Errors
- Est. Cost

정렬 기본값:

- toolCount desc 또는 estimatedCost desc

빈 상태:

- `No project history yet`
- `Project summaries will appear after sessions are indexed.`

인터랙션:

- 컬럼 정렬
- 프로젝트 클릭 시 세션 drill-in 가능

## 6. Empty State Copy Spec

### 6.1 페이지 전체 empty state

조건:

- active session 없음
- events 없음
- logs 없음

권장 카피:

- 헤더 상태: `OFFLINE`
- 서브 카피: `Start a Claude session or run /claude-pulse:dashboard`

### 6.2 카드별 empty state 요약

- Activity Feed: `No live events yet. Tool activity will appear here.`
- Alert Center: `No alerts. Tool failures, server errors, and test warnings will appear here.`
- Cost Snapshot: `No tool activity yet`
- Session Timeline: `Session milestones will appear as work progresses.`
- Top Files: `Read, Edit, and Write events will appear here.`
- Agent Tracker: `Subagent activity will appear here.`
- Server Summary: `Start a dev server to monitor logs and errors.`
- Project Comparison: `Project summaries will appear after sessions are indexed.`

## 7. Interaction Specification

### 7.1 기본 상호작용

- hover: 보조 정보 노출
- click: 관련 상세 또는 연관 패널 강조
- scroll: 메인 로그는 독립 스크롤 허용

### 7.2 패널 간 연결

- Alert Center -> Activity Feed로 점프
- Top Files -> Activity Feed 파일 필터
- Agent Tracker -> Activity Feed 에이전트 필터
- Session Timeline -> Activity milestone 연결
- Project Comparison -> 해당 프로젝트 세션 컨텍스트 전환

### 7.3 우선 금지 사항

- 모달 남용 금지
- 지나치게 깊은 drill-down 금지
- 색만 다른 중복 상태 표현 금지

## 8. 반응형 규칙

### 8.1 Desktop

- Activity Feed와 Alert Center를 최상단에 유지
- Cost Snapshot은 Alert Center 하단 고정

### 8.2 Tablet

- Alert Center는 Activity Feed 바로 아래로 유지
- 비교/로그 패널은 하단으로 이동 가능

### 8.3 Mobile

- Alert Center를 Activity보다 위로 승격
- KPI는 카드 대신 chip 또는 2열 축약 형태 허용

## 9. 개발 우선순위

### Phase 1

- Global Status Bar
- KPI Row
- Alert Center
- Activity Feed 구조 개편

### Phase 2

- Session Timeline
- Agent Tracker
- Top Files 명세 반영

### Phase 3

- Server Summary & Logs
- Project Comparison 고도화
- Empty state polish

## 10. 구현 체크리스트

- 제목과 실제 표현 방식이 일치하는가
- 가장 심각한 정보가 가장 먼저 보이는가
- 모든 패널에 empty state copy가 있는가
- 각 패널이 최소 하나의 판단 질문에 답하는가
- 상단 상태 바만 봐도 현재 세션 상태를 이해할 수 있는가

## 11. 최종 결정 사항

- `Errors`는 `Alert Center`로 승격한다.
- 현재 파일 패널 표현을 유지하면 이름은 `Top Files`가 더 정확하다.
- `Server` 패널은 로그 뷰어가 아니라 `Server Summary & Logs`로 정의한다.
- 상단 헤더는 브랜드 바가 아니라 운영 상태 바로 재정의한다.
- empty state는 설명형 문구를 기본값으로 사용한다.
