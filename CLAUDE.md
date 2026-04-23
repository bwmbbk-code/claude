# CLAUDE.md

이 레포는 **1인 기업 운영 자동화 허브**입니다. 사용자는 메일·일정·문서·콘텐츠·재무 5개 도메인에 걸친 반복 업무를 Claude Code + MCP 도구로 자동화합니다.

## 도메인과 담당 MCP 서버

| 도메인 | MCP 서버(핵심 도구) |
|---|---|
| 메일 | Gmail (`search_threads`, `get_thread`, `create_draft`, `list_labels`) |
| 일정 | Google Calendar (`list_events`, `create_event`, `suggest_time`, `list_calendars`) |
| 문서/지식 | Notion (`notion-search`, `notion-fetch`, `notion-create-pages`, `notion-update-page`), Google Drive (`search_files`, `read_file_content`, `create_file`) |
| 콘텐츠 | YouTubeData (`search_videos`, `get_transcripts`, `get_trending_videos`), ItNewsSearch (`News_Article`, `Tech_Blog`) |
| 재무 | Crypto.com (`get_ticker`, `get_candlestick`), UsStockInfo (`get_stock_info`, `get_finance_news`), Eodi (`get_exchange_rates`) |

## 개인 설정 참조

사용자의 이메일 주소, Notion DB ID, 관심 종목 등은 **`config.local.md`**(gitignore됨)에 있습니다. 커맨드를 실행할 때 이 파일을 먼저 읽어 필요한 값을 가져오세요. 파일이 없으면 사용자에게 "먼저 `config.example.md`를 `config.local.md`로 복사해 채워 주세요"라고 안내하고 중단합니다.

## MCP 도구 호출 지침

- **Gmail 검색**: 사용자 질의를 `search_threads`의 Gmail 쿼리 문법으로 변환 (`is:unread`, `newer_than:1d`, `from:`, `label:` 등).
- **Notion 쓰기**: 먼저 `notion-search` 또는 `notion-fetch`로 대상 페이지/DB의 구조를 확인한 뒤 `notion-create-pages`나 `notion-update-page`를 호출.
- **쓰기 계열 도구(draft 생성, 페이지 생성, 캘린더 이벤트 생성, 파일 생성)**: 호출 전에 한 줄 요약으로 "무엇을 어디에 만들지" 먼저 사용자에게 고지하세요. 권한 프롬프트에서 사용자가 막을 수 있게 합니다.
- **재무 도구**: `get_ticker`, `get_stock_info` 같은 읽기 도구는 배치로 병렬 호출하세요 (한 번의 응답에 여러 tool_use).
- **날짜 관련**: 모든 커맨드는 사용자 타임존(기본 Asia/Seoul)을 기준으로 해석합니다.

## 스타일

- 최종 출력은 **마크다운**, 섹션 제목은 `##`, 긴 리스트보다 표를 선호.
- 사용자 언어는 기본 **한국어**. 종목명·티커 같은 고유명사는 원어 그대로 둡니다.
- 민감한 내용(비밀번호, 토큰이 포함된 메일 스니펫 등)은 출력하지 말고 "민감 내용 포함" 표시로 마스킹.

## 슬래시 커맨드 카탈로그

`.claude/commands/` 하위의 각 `.md` 파일이 하나의 커맨드입니다. 추가하려면 같은 디렉토리에 새 파일을 만들고 `README.md` 표에 한 줄 추가하세요.

## 확장 경로

- `scheduled/`: 향후 cron + Claude Agent SDK 기반 비대화형 실행 스크립트 위치. 현재는 스켈레톤만 있음.
