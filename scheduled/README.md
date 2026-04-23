# scheduled/ — 예약 실행 스크립트 (스켈레톤)

이 디렉토리는 **비대화형**으로 실행되는 자동화 스크립트를 담습니다. 예: "매일 아침 8시에 아침 브리핑을 만들어 나에게 메일로 보내기".

## 왜 이 디렉토리가 필요한가?

`.claude/commands/`의 슬래시 커맨드는 사용자가 Claude Code 세션에서 **대화 중** 호출합니다. 반대로 cron이 돌리는 작업은 사용자 입력 없이 실행되어야 하므로, [Claude Agent SDK](https://docs.claude.com/en/docs/claude-code/sdk)로 자체 프로세스를 띄워야 합니다.

## 권장 구성 (향후)

- **언어**: TypeScript + Node (Agent SDK 공식 지원, MCP 툴 연동이 가장 매끈)
- **의존성**: `@anthropic-ai/claude-agent-sdk`
- **환경변수**: `.env`의 `ANTHROPIC_API_KEY`, `NOTIFY_EMAIL`

## 예시 cron (향후 작성 기준)

```
# 매일 오전 8시 아침 브리핑을 메일로 발송
0 8 * * * cd /path/to/claude && npm run daily-brief 2>&1 | logger -t daily-brief
```

## 현재 상태

아직 스크립트는 작성되어 있지 않습니다. 필요해지는 시점에:
1. `package.json`의 스크립트 항목에 엔트리를 추가
2. 이 디렉토리에 `<작업명>.ts` 파일 작성
3. cron(또는 GitHub Actions)에 등록

## 후보 작업 리스트

- `daily-brief.ts`: `/daily-brief` 슬래시 커맨드와 동일한 산출물을 메일로 자동 발송
- `inbox-digest.ts`: 하루 한 번 미읽음 메일을 분류해 요약만 메일로 발송 (초안 생성 없이)
- `finance-watch.ts`: 관심 종목이 임계치 ±X% 움직이면 알림 메일
- `content-idea-weekly.ts`: 매주 월요일 `/content-research` 결과를 Notion에 적재
