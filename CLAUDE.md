# CLAUDE.md

이 레포는 **1인 기업 운영 자동화 허브**입니다. 사용자는 메일·일정·문서·콘텐츠·재무 5개 도메인에 걸친 반복 업무를 Claude Code + MCP 도구로 자동화합니다.

## 도메인과 담당 MCP 서버

| 도메인 | MCP 서버(핵심 도구) |
|---|---|
| 메일 | Gmail (`search_threads`, `get_thread`, `create_draft`, `list_labels`) |
| 일정 | Google Calendar (`list_events`, `create_event`, `suggest_time`, `list_calendars`) |
| 문서/지식 | Notion (`notion-search`, `notion-fetch`, `notion-create-pages`, `notion-update-page`), Google Drive (`search_files`, `read_file_content`, `create_file`) |
| 콘텐츠 | YouTubeData (`search_videos`, `get_transcripts`, `get_trending_videos`), ItNewsSearch (`News_Article`, `Tech_Blog`) |
| 환율 (재무) | Eodi (`get_exchange_rates`, `convert_currency`) — 해외 결제·청구 참고용. 주식·코인 시세는 다루지 않음. |

## 개인 설정 참조

사용자의 이메일 주소, Notion DB ID, 관심 통화쌍 등은 **`config.local.md`**(gitignore됨)에 있습니다. 커맨드를 실행할 때 이 파일을 먼저 읽어 필요한 값을 가져오세요. 파일이 없으면 사용자에게 "먼저 `config.example.md`를 `config.local.md`로 복사해 채워 주세요"라고 안내하고 중단합니다.

## MCP 도구 호출 지침

- **Gmail 검색**: 사용자 질의를 `search_threads`의 Gmail 쿼리 문법으로 변환 (`is:unread`, `newer_than:1d`, `from:`, `label:` 등).
- **Notion 쓰기**: 먼저 `notion-search` 또는 `notion-fetch`로 대상 페이지/DB의 구조를 확인한 뒤 `notion-create-pages`나 `notion-update-page`를 호출.
- **쓰기 계열 도구(draft 생성, 페이지 생성, 캘린더 이벤트 생성, 파일 생성)**: 호출 전에 한 줄 요약으로 "무엇을 어디에 만들지" 먼저 사용자에게 고지하세요. 권한 프롬프트에서 사용자가 막을 수 있게 합니다.
- **환율 도구**: `get_exchange_rates` 같은 읽기 도구는 여러 통화쌍을 한 응답에 병렬 호출하세요 (한 번의 응답에 여러 tool_use). 주식·코인 관련 MCP 도구는 호출하지 않습니다.
- **날짜 관련**: 모든 커맨드는 사용자 타임존(기본 Asia/Seoul)을 기준으로 해석합니다.

## 스타일

- 최종 출력은 **마크다운**, 섹션 제목은 `##`, 긴 리스트보다 표를 선호.
- 사용자 언어는 기본 **한국어**. 고유명사·제품명·회사명은 원어 그대로 둡니다.
- 민감한 내용(비밀번호, 토큰이 포함된 메일 스니펫 등)은 출력하지 말고 "민감 내용 포함" 표시로 마스킹.

## 슬래시 커맨드 카탈로그

`.claude/commands/` 하위의 각 `.md` 파일이 하나의 커맨드입니다. 추가하려면 같은 디렉토리에 새 파일을 만들고 `README.md` 표에 한 줄 추가하세요.

## 서브에이전트 (멀티 에이전트)

도메인별 서브에이전트는 `.claude/agents/` 아래에 정의돼 있습니다 (`mail-analyst`, `calendar-planner`, `finance-researcher`, `content-scout`, `notion-keeper`). 각 에이전트는 자기 도메인의 도구만 사용하고, 지정된 출력 포맷만 리턴하도록 시스템 프롬프트에 규칙이 잠겨 있습니다.

**실행 경로별로 활용 방식이 다릅니다.**

| 경로 | 멀티 에이전트 활용 | 이유 |
|---|---|---|
| 대화형 슬래시 커맨드 (`/daily-brief` 등) | **메인 세션이 직접 도구를 병렬 호출**. 서브에이전트는 호출하지 않음. | 일부 환경에서 `Agent` 도구로 스폰된 서브에이전트가 메인 세션과 분리된 권한 컨텍스트를 가져 MCP 서버에 접근하지 못하는 경우가 있음. 단순 fetch-and-return 패턴은 메인 세션 병렬 tool_use가 동일 속도이고 항상 작동. |
| SDK 비대화형 (`scheduled/*.ts`) | **`runSpecialist()`가 별도 프로세스로 페르소나 파일을 주입**. 진짜 팬아웃/팬인. | 별도 프로세스라 격리가 보장되고, cron에서 안정적으로 작동. 페르소나 규칙이 시스템 프롬프트로 강제됨. |

`.claude/agents/<이름>.md` 본문은 두 경로 모두에서 단일 진실 원천(single source of truth)으로 쓰입니다. 사용자가 명시적으로 "X 에이전트로 처리해줘"라고 요청한 경우에만 대화형에서도 `Agent` 도구를 시도하세요.

## 확장 경로

- `scheduled/`: cron + Claude Agent SDK 기반 비대화형 실행 스크립트. 네 개의 작업이 구현돼 있음 (daily-brief, inbox-digest, finance-watch, content-idea-weekly).
- `.github/workflows/`: 위 스크립트를 GitHub Actions cron으로 돌리는 워크플로 3개.
- `.claude/hooks/session-start.sh`: 세션 시작 시 `config.local.md` 존재 확인, 없으면 사용자에게 설정 안내를 주입.
