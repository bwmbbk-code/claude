# 1인 기업 자동화 허브

Claude Code + MCP 도구를 기반으로 1인 기업 운영(메일·일정·문서·콘텐츠·환율)을 자동화하는 허브 레포입니다. 주식·코인 같은 투자 도메인은 범위에서 제외됩니다.

## 처음 설정 (1회)

1. `config.example.md` → `config.local.md`로 복사한 뒤 개인 정보(이메일, Notion DB ID, 관심 통화쌍 등)를 채웁니다.
   ```bash
   cp config.example.md config.local.md
   ```
2. (선택) 향후 cron 스크립트를 쓸 계획이면 `.env.example` → `.env`로 복사하고 `ANTHROPIC_API_KEY`를 입력합니다.
3. Claude Code를 이 디렉토리에서 실행합니다.

## 사용법

Claude Code 세션에서 다음 슬래시 커맨드를 호출하세요.

| 커맨드 | 도메인 | 설명 |
|---|---|---|
| `/daily-brief` | 통합 | 아침 브리핑 (메일 Top + 오늘 일정 + 뉴스 + 환율) |
| `/weekly-review` | 통합 | 지난 주 회고 + 다음 주 우선순위 |
| `/inbox-triage` | 메일 | Gmail 미읽음을 중요도별로 분류하고 답장 초안 작성 |
| `/schedule-today` | 일정 | 오늘·이번 주 일정 요약 + 빈 시간 추천 |
| `/meeting-prep [키워드\|next]` | 일정 | 다음 회의 예습 (참석자·이력·안건) |
| `/capture-note <텍스트>` | 지식 | 메모를 Notion 아이디어 DB에 저장 |
| `/content-research <주제>` | 콘텐츠 | YouTube·뉴스에서 주제 리서치 후 요약 |
| `/draft-post <주제>` | 콘텐츠 | 블로그/SNS 초안 작성 후 Drive에 저장 |
| `/finance-brief` | 환율 | 관심 통화쌍 환율 요약 (해외 결제/청구 참고) |
| `/expense-log <자연어>` | 재무 | 경비를 Notion 가계부 DB에 기록 |
| `/invoice-draft <고객> <금액> [내용]` | 재무 | 청구서 마크다운 초안을 Drive에 생성 |

## 구조

```
├── CLAUDE.md                 # Claude에게 주는 프로젝트 컨텍스트
├── config.example.md         # 개인 설정 템플릿
├── .claude/
│   ├── settings.json         # 읽기 전용 MCP 도구 allowlist + SessionStart 훅
│   ├── commands/             # 슬래시 커맨드 (11개)
│   ├── agents/               # 도메인별 서브에이전트 (5개)
│   └── hooks/session-start.sh  # 세션 시작 시 config.local.md 존재 확인
├── apps/
│   └── hsa-receipts/         # HSA 의료비 영수증 관리 웹앱 (브라우저에서 index.html 열기)
├── scheduled/                # cron 실행용 Claude Agent SDK 스크립트 (TypeScript)
└── .github/workflows/        # GitHub Actions cron 정의
```

## 예약 실행

`scheduled/` 안에 4개 Agent SDK 스크립트가 준비돼 있고, `.github/workflows/`의 cron으로 돌릴 수 있습니다.

| 스크립트 | 주기 | 워크플로 |
|---|---|---|
| `daily-brief.ts` | 매일 08:00 KST | `daily-brief.yml` |
| `inbox-digest.ts` | 수동/확장 | — |
| `finance-watch.ts` | 평일 30분마다 | `finance-watch.yml` — 관심 통화쌍 환율 급변동 경보 |
| `content-idea-weekly.ts` | 매주 월 09:00 KST | `content-idea-weekly.yml` |

GitHub Actions에서 돌리려면 `ANTHROPIC_API_KEY`, `MCP_CONFIG_JSON`, `CONFIG_LOCAL_MD` 시크릿을 등록하세요 (자세한 내용은 `.github/workflows/README.md`).

## 멀티 에이전트 구조

`.claude/agents/` 아래 5개 도메인 서브에이전트가 있고, 슬래시 커맨드와 scheduled 스크립트가 이들을 병렬로 호출합니다.

| 에이전트 | 도메인 | 주 도구 |
|---|---|---|
| `mail-analyst` | Gmail | `search_threads`, `get_thread`, `create_draft` |
| `calendar-planner` | Calendar | `list_events`, `suggest_time`, `create_event` |
| `finance-researcher` | 환율 | `get_exchange_rates`, `convert_currency` (주식·코인 제외) |
| `content-scout` | 리서치 | `search_videos`, `News_Article`, `Tech_Blog` |
| `notion-keeper` | Notion 쓰기 | `notion-search`, `notion-create-pages`, `notion-update-page` |

**대화형(슬래시 커맨드)**: `/daily-brief` 등은 **메인 세션이 직접 도구를 한 응답에 병렬 호출**합니다. 일부 환경에서 `Agent` 도구로 스폰된 서브에이전트가 MCP 서버에 접근하지 못하는 경우가 있어 안정성을 우선했습니다. 페르소나 파일의 분류 규칙·출력 포맷은 메인 세션이 그대로 적용.
**비대화형(SDK)**: `scheduled/daily-brief.ts`가 `runSpecialist()`를 `Promise.all`로 병렬 호출 — 별도 프로세스라 격리·안정성 모두 확보. 페르소나는 `.claude/agents/<이름>.md` 본문을 그대로 주입해 양쪽 실행 경로에서 동일 규칙을 따르게 함 (`scheduled/lib/specialists.ts`).

## 확장

- **새 도메인 자동화**가 필요하면 `.claude/commands/` 아래에 `<이름>.md`를 만들고 본 README 표에 한 줄 추가하세요.
- **새 서브에이전트**가 필요하면 `.claude/agents/<이름>.md`를 만들고 `scheduled/lib/specialists.ts`의 `SpecialistName`에 추가하세요.
- **새 스케줄 작업**이 필요하면 `scheduled/<이름>.ts`를 만들고 `package.json` 스크립트에 엔트리를 등록하세요.
