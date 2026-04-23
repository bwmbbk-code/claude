# 1인 기업 자동화 허브

Claude Code + MCP 도구를 기반으로 1인 기업 운영(메일·일정·문서·콘텐츠·재무)을 자동화하는 허브 레포입니다.

## 처음 설정 (1회)

1. `config.example.md` → `config.local.md`로 복사한 뒤 개인 정보(이메일, Notion DB ID, 관심 종목 등)를 채웁니다.
   ```bash
   cp config.example.md config.local.md
   ```
2. (선택) 향후 cron 스크립트를 쓸 계획이면 `.env.example` → `.env`로 복사하고 `ANTHROPIC_API_KEY`를 입력합니다.
3. Claude Code를 이 디렉토리에서 실행합니다.

## 사용법

Claude Code 세션에서 다음 슬래시 커맨드를 호출하세요.

| 커맨드 | 도메인 | 설명 |
|---|---|---|
| `/daily-brief` | 통합 | 아침 브리핑 (메일 Top + 오늘 일정 + 뉴스 + 환율/시세) |
| `/inbox-triage` | 메일 | Gmail 미읽음을 중요도별로 분류하고 답장 초안 작성 |
| `/schedule-today` | 일정 | 오늘·이번 주 일정 요약 + 빈 시간 추천 |
| `/capture-note <텍스트>` | 지식 | 메모를 Notion 아이디어 DB에 저장 |
| `/content-research <주제>` | 콘텐츠 | YouTube·뉴스에서 주제 리서치 후 요약 |
| `/draft-post <주제>` | 콘텐츠 | 블로그/SNS 초안 작성 후 Drive에 저장 |
| `/finance-brief` | 재무 | 환율·관심 종목·BTC/ETH 시세 요약 |

## 구조

```
├── CLAUDE.md                 # Claude에게 주는 프로젝트 컨텍스트
├── config.example.md         # 개인 설정 템플릿
├── .claude/
│   ├── settings.json         # 읽기 전용 MCP 도구 allowlist
│   └── commands/             # 슬래시 커맨드 정의
└── scheduled/                # 향후 cron 실행용 Agent SDK 스크립트 (스켈레톤)
```

## 확장

- **예약 실행**이 필요하면 `scheduled/README.md`를 참고해 Claude Agent SDK 스크립트를 추가하세요.
- **새 도메인 자동화**가 필요하면 `.claude/commands/` 아래에 `<이름>.md`를 만들고 본 README 표에 한 줄 추가하세요.
