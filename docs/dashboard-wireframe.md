# Dashboard Wireframe

작성일: 2026-03-31  
기준 문서: `docs/dashboard-design-diagnosis.md`  
목적: Claude Pulse 대시보드의 정보 위계와 패널 배치를 재정의하기 위한 로우파이 와이어프레임

## 1. 설계 목표

- 첫 3초 안에 현재 상태를 파악할 수 있어야 한다.
- 상단에서 상태 요약, 중단에서 작업 흐름, 하단에서 상세 진단이 가능해야 한다.
- 카드 이름과 실제 시각화 방식이 일치해야 한다.
- 빈 상태에서도 제품이 무엇을 보여주는지 이해할 수 있어야 한다.

## 2. 핵심 원칙

1. 브랜드보다 상태가 먼저 보여야 한다.
2. 원문 로그보다 요약 정보가 먼저 보여야 한다.
3. 경고는 가장 강하게, 비교는 가장 압축적으로 보여야 한다.
4. 모든 패널은 "무엇을 판단하게 하는가"가 분명해야 한다.

## 3. 제안 정보 구조

### 3.1 상단 구조

- 글로벌 상태 바
- 핵심 KPI 행
- 메인 작업 영역
- 진단 및 비교 영역

### 3.2 우선순위

- P0: 현재 세션 상태, 에러 여부, 활성 에이전트, 서버 상태
- P1: 최근 활동 흐름, 비용 변화, 파일 핫스팟
- P2: 프로젝트 비교, 장기 추세, 보조 로그

## 4. 로우파이 와이어프레임

### 4.1 Desktop

```text
+--------------------------------------------------------------------------------------------------+
| Claude Pulse | LIVE | Session active | Agents 2 | Errors 1 | Server WARN | Updated 14:36:12   |
+--------------------------------------------------------------------------------------------------+
|  elapsed 06m  |  67 tool calls  |  est. $2.80  |  hot files 3  |  current project main  |
+--------------------------------------------------------------------------------------------------+
|                                              |                                                       |
| Activity Feed                                | Alert Center                                          |
| - latest task groups                         | - critical error summary                              |
| - tool events grouped by task/agent          | - tool/server/test alerts                             |
| - filters: tool / agent / errors             | - latest error first                                  |
|                                              |                                                       |
|                                              | Cost Snapshot                                         |
|                                              | - current estimate                                    |
|                                              | - range                                               |
|                                              | - cost by tool                                        |
+--------------------------------------------------------------------------------------------------+
| Session Timeline        | Top Files / Heatmap      | Agent Tracker                                  |
| - milestones            | - top touched files      | - running vs done                               |
| - session phases        | - read/edit/write split  | - current task                                  |
| - key transitions       | - hotspot emphasis       | - elapsed + activity                             |
+--------------------------------------------------------------------------------------------------+
| Server Summary & Logs                              | Project Comparison                                |
| - status / port / req / avg resp                   | - projects ranked by cost/tools/errors           |
| - latest warnings and errors                       | - quick compare signals                           |
| - expandable raw logs                              |                                                   |
+--------------------------------------------------------------------------------------------------+
```

### 4.2 Tablet

```text
+------------------------------------------------------------------------------+
| Claude Pulse | LIVE | Errors 1 | Agents 2 | Updated 14:36:12                |
+------------------------------------------------------------------------------+
| elapsed | calls | est.cost | server status                                   |
+------------------------------------------------------------------------------+
| Activity Feed                                                                |
+------------------------------------------------------------------------------+
| Alert Center                        | Cost Snapshot                           |
+------------------------------------------------------------------------------+
| Session Timeline                    | Agent Tracker                           |
+------------------------------------------------------------------------------+
| Top Files                           | Server Summary                          |
+------------------------------------------------------------------------------+
| Project Comparison                                                         |
+------------------------------------------------------------------------------+
```

### 4.3 Mobile

```text
+--------------------------------------------------+
| Claude Pulse | LIVE | Errors 1                  |
| Session active | Agents 2 | Updated 14:36       |
+--------------------------------------------------+
| KPI chips: elapsed / calls / cost / server      |
+--------------------------------------------------+
| Alert Center                                    |
+--------------------------------------------------+
| Activity Feed                                   |
+--------------------------------------------------+
| Session Timeline                                |
+--------------------------------------------------+
| Agent Tracker                                   |
+--------------------------------------------------+
| Top Files                                       |
+--------------------------------------------------+
| Server Summary                                  |
+--------------------------------------------------+
| Project Comparison                              |
+--------------------------------------------------+
```

## 5. 패널 역할 재정의

### 5.1 Global Status Bar

목적:

- 지금 시스템이 정상인지 즉시 알린다.

포함 요소:

- 연결 상태
- 세션 상태
- 활성 에이전트 수
- 에러 수
- 서버 상태
- 마지막 갱신 시각

판단 질문:

- 지금 안전한가
- 지금 문제가 있는가

### 5.2 KPI Row

목적:

- 현재 세션의 규모와 밀도를 빠르게 전달한다.

포함 요소:

- 경과 시간
- 총 툴 호출 수
- 비용 추정
- 핫파일 수
- 현재 프로젝트

판단 질문:

- 지금 작업 규모가 어느 정도인가

### 5.3 Activity Feed

목적:

- 가장 최근에 무슨 일이 일어났는지 보여준다.

변경 방향:

- 단순 로그 행 나열에서 작업 묶음 중심으로 전환
- 에이전트 또는 태스크 단위 그룹핑
- 에러와 성공 흐름을 시각적으로 구분

표현 요소:

- 시간
- 액션 타입
- 대상 파일 또는 명령
- 실행 주체
- 상태 배지

### 5.4 Alert Center

목적:

- 사용자가 가장 먼저 봐야 하는 문제를 모은다.

변경 방향:

- `Errors` 카드가 아니라 통합 알림 카드로 승격
- tool error, server error, test warn을 함께 수용

표현 요소:

- severity
- source
- message
- related file
- first seen / latest seen

### 5.5 Cost Snapshot

목적:

- 비용 그 자체보다 비용의 흐름과 비중을 보여준다.

변경 방향:

- 수치 하나만 크게 보여주는 방식에서 도구 기여도 해석을 강화
- `Alert Center`보다 시각 우선순위는 낮게 유지

### 5.6 Session Timeline

목적:

- 세션을 회고 가능한 사건 흐름으로 정리한다.

변경 방향:

- 단순 이벤트 나열이 아니라 milestone 중심으로 축약
- session start, delegation, test, failure, recovery, end 같은 사건 구조화

### 5.7 Top Files / Heatmap

목적:

- 어디에 작업이 몰렸는지 보여준다.

선택지:

- 진짜 heatmap/treemap로 발전
- 현재 방식 유지 시 이름을 `Top Files`로 변경

표현 요소:

- 파일명
- 접근량
- read/edit/write 분리
- hotspot 강조

### 5.8 Agent Tracker

목적:

- 누가 무엇을 하고 있고, 얼마나 오래 걸리는지 보여준다.

변경 방향:

- 단순 상태 리스트에서 활동 요약 카드로 발전
- 에이전트별 현재 태스크와 최근 툴 사용량 표시

### 5.9 Server Summary & Logs

목적:

- 서버 상태를 한 줄 요약 후, 필요 시 원문 로그로 내려간다.

변경 방향:

- 로그 뷰어 중심에서 요약 + 상세 구조로 전환

표현 요소:

- 서버명 / 포트
- 상태
- request 수
- avg response time
- latest error
- raw log

### 5.10 Project Comparison

목적:

- 여러 프로젝트를 위험도와 규모 기준으로 빠르게 비교한다.

변경 방향:

- 단순 표에서 비교용 신호를 강화
- cost/tools/errors를 동시에 읽기 쉽게 압축

## 6. 빈 상태 Wireframe

```text
+--------------------------------------------------------------------------------+
| Claude Pulse | OFFLINE                                                         |
+--------------------------------------------------------------------------------+
| Start a Claude session or run /claude-pulse:dashboard                          |
+--------------------------------------------------------------------------------+
| Activity Feed                                                                   |
| No live events yet. When Claude uses tools, agent activity will appear here.   |
+--------------------------------------------------------------------------------+
| Alert Center                                                                    |
| No alerts. Tool failures, server errors, and test warnings will appear here.   |
+--------------------------------------------------------------------------------+
| Top Files                                                                       |
| File hotspots will appear after Read/Edit/Write activity.                      |
+--------------------------------------------------------------------------------+
```

원칙:

- 빈 상태는 단순히 비어 있음을 말하지 않는다.
- 각 패널이 어떤 데이터를 받는지 설명한다.
- 초기 사용자가 화면 기능을 학습할 수 있어야 한다.

## 7. 구현 전 체크리스트

- 헤더가 브랜드 바가 아니라 상태 바 역할을 하는가
- 가장 위험한 정보가 첫 시선에 들어오는가
- 패널 이름과 시각화 방식이 일치하는가
- 각 패널이 하나의 판단 질문에 답하는가
- 빈 상태에서도 제품 이해가 가능한가

## 8. 권장 구현 순서

1. Global Status Bar와 KPI Row 재설계
2. Alert Center 우선순위 강화
3. Activity Feed 그룹핑 구조 설계
4. Session Timeline과 Agent Tracker 의미 재정의
5. Top Files 표현 방식 확정
6. Server Summary와 Project Comparison 압축 정리

## 9. 최종 메모

다음 구현 단계에서 중요한 것은 시각 장식이 아니라, 상단 요약과 경고 우선순위를 확실히 만드는 것이다.  
이 와이어프레임은 "현재 무엇이 중요한가"를 먼저 보게 만드는 구조를 목표로 한다.
