export type Language = 'en' | 'ko';

export const translations = {
  en: {
    // Header
    ENVIRONMENT: 'Environment',
    SESSION_ID: 'Session_ID',
    AGENTS: 'Agents',
    ALERTS: 'Alerts',
    PROTOCOL: 'Protocol',
    STABLE: 'STABLE',
    INTERRUPTED: 'INTERRUPTED',
    INITIALIZING: 'INITIALIZING...',
    
    // KPI Row
    ELAPSED: 'ELAPSED',
    TOOL_CALLS: 'TOOL_CALLS',
    TOKENS: 'TOKENS',
    HOT_FILES: 'HOT_FILES',
    ACTIVE_AGENTS: 'ACTIVE_AGENTS',
    
    // Activity Stream
    ACTIVITY_STREAM: 'activity_stream.log',
    WAITING_FOR_STREAM: 'Waiting_For_Signal_Stream...',
    FILTER_ALL: 'ALL',
    FILTER_ERRORS: 'ERRORS',
    FILTER_TOOLS: 'TOOLS',
    FILTER_AGENTS: 'AGENTS',
    
    // Server Monitor
    SERVER_MONITOR: 'was_runtime.stream',
    SERVER_STABLE: '● STABLE',
    PORT: 'PORT',
    PING: 'PING',
    INITIALIZING_STREAM: 'Initializing_Stream...',
    
    // Token Usage
    TOKEN_USAGE: 'token_usage.dat',
    TOTAL_TOKENS: 'Total_Tokens_Processed',
    EST_COST: 'Est. Cost',
    INPUT: 'Input',
    OUTPUT: 'Output',
    DISTRIBUTION: 'Distribution',
    USAGE: 'Usage',
    NO_DATA: 'No_Buffer_Data',
    BASED_ON_SONNET: 'Based on Sonnet 3.5 Avg',
    
    // Alert Center
    ALERT_CENTER: 'anomaly_scan.err',
    CRITICAL: 'CRITICAL',
    ZERO_ANOMALIES: 'Zero_Anomalies',
    
    // Agent Tracker
    AGENT_TRACKER: 'process_hive.top',
    ACTIVE: 'Active',
    IDLE_NODES: 'Idle_Nodes',
    RUN_TIME: 'RUN_TIME',
    
    // Top Files
    TOP_FILES: 'context_load.stat',
    NODES: 'Nodes',
    TOTAL: 'TOTAL',
    PATH_RESOURCE: 'PATH_RESOURCE',
    VOID_CONTEXT: 'Void_Context',
    
    // Data Management
    RESET_SESSION: 'Reset Session',
    RESET_ALL: 'Reset All',
    CONFIRM_RESET_SESSION: 'Delete this session data?',
    CONFIRM_RESET_ALL: 'Delete ALL Pulse data?',

    // Footer
    KERNEL_SIGNAL: 'Kernel_Signal',
    UPTIME: 'Uptime',
    LAST_PACKET: 'Last_Packet',
  },
  ko: {
    // Header
    ENVIRONMENT: '실행 환경',
    SESSION_ID: '세션 ID',
    AGENTS: '에이전트',
    ALERTS: '알림',
    PROTOCOL: '프로토콜',
    STABLE: '안정됨',
    INTERRUPTED: '연결 끊김',
    INITIALIZING: '초기화 중...',
    
    // KPI Row
    ELAPSED: '경과 시간',
    TOOL_CALLS: '도구 호출',
    TOKENS: '토큰 사용',
    HOT_FILES: '주요 파일',
    ACTIVE_AGENTS: '활성 에이전트',
    
    // Activity Stream
    ACTIVITY_STREAM: '활동 스트림',
    WAITING_FOR_STREAM: '신호 대기 중...',
    FILTER_ALL: '전체',
    FILTER_ERRORS: '에러',
    FILTER_TOOLS: '도구',
    FILTER_AGENTS: '에이전트',
    
    // Server Monitor
    SERVER_MONITOR: '서버 모니터',
    SERVER_STABLE: '● 정상',
    PORT: '포트',
    PING: '지연시간',
    INITIALIZING_STREAM: '스트림 초기화 중...',
    
    // Token Usage
    TOKEN_USAGE: '토큰 사용량',
    TOTAL_TOKENS: '총 처리 토큰',
    EST_COST: '예상 비용',
    INPUT: '입력',
    OUTPUT: '출력',
    DISTRIBUTION: '사용 분포',
    USAGE: '사용량',
    NO_DATA: '데이터 없음',
    BASED_ON_SONNET: 'Sonnet 3.5 평균 기준',
    
    // Alert Center
    ALERT_CENTER: '알림 센터',
    CRITICAL: '치명적',
    ZERO_ANOMALIES: '감지된 에러 없음',
    
    // Agent Tracker
    AGENT_TRACKER: '에이전트 추적',
    ACTIVE: '활성',
    IDLE_NODES: '대기 중',
    RUN_TIME: '가동 시간',
    
    // Top Files
    TOP_FILES: '주요 파일 통계',
    NODES: '개의 노드',
    TOTAL: '합계',
    PATH_RESOURCE: '파일 경로',
    VOID_CONTEXT: '데이터 없음',
    
    // Data Management
    RESET_SESSION: '세션 초기화',
    RESET_ALL: '전체 초기화',
    CONFIRM_RESET_SESSION: '이 세션 데이터를 삭제할까요?',
    CONFIRM_RESET_ALL: '모든 Pulse 데이터를 삭제할까요?',

    // Footer
    KERNEL_SIGNAL: '커널 신호',
    UPTIME: '업타임',
    LAST_PACKET: '마지막 패킷',
  }
};
