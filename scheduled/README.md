# scheduled/ — 예약 실행 스크립트

cron, GitHub Actions 등 **비대화형**으로 돌리는 자동화 스크립트. 각각 [Claude Agent SDK](https://docs.claude.com/en/docs/claude-code/sdk)를 써서 슬래시 커맨드와 동일한 작업을 사용자 입력 없이 수행합니다.

## 파일

| 스크립트 | 목적 | 권장 주기 |
|---|---|---|
| `daily-brief.ts` | `/daily-brief`의 스케줄 버전 | 매일 오전 8시 KST |
| `inbox-digest.ts` | 미읽음 메일 분류 리포트 (초안 생성 없음) | 평일 오전/오후 2회 |
| `finance-watch.ts` | 관심 통화쌍 환율 임계치(±N%) 경보 | 평일 업무시간 30분마다 |
| `content-idea-weekly.ts` | 주제 리서치 + 아이디어 5개 Notion에 적재 | 매주 월요일 오전 9시 |

## 사전 준비 (1회)

```bash
cd scheduled
npm install
cp ../.env.example ../.env         # ANTHROPIC_API_KEY 입력
cp ../.mcp.example.json ../.mcp.json  # 사용할 MCP 서버 URL·토큰 입력
# 루트에 config.local.md가 이미 있어야 함
```

## 실행

```bash
cd scheduled
npm run daily-brief
npm run inbox-digest
npm run finance-watch
npm run content-idea-weekly
npm run typecheck        # 타입 오류 확인
```

실행 결과물은 `scheduled/out/YYYY-MM-DD/<작업명>.md`에 저장됩니다.

## 환경 변수

| 변수 | 의미 | 기본값 |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API 키 (필수) | — |
| `FINANCE_WATCH_THRESHOLD` | finance-watch 환율 경보 임계치(%) | `1.5` |
| `NOTIFY_EMAIL` | (선택) 리포트를 메일로 받고 싶을 때 | — |

## GitHub Actions로 돌리기

루트의 `.github/workflows/` 디렉토리를 참고. cron 트리거와 `ANTHROPIC_API_KEY` 시크릿만 설정하면 됩니다.

## 확장

- 새 작업이 필요하면 `scheduled/<이름>.ts`를 추가하고 `package.json`의 `scripts`에 엔트리를 등록하세요.
- `lib/runAgent.ts`를 재사용하면 시스템 프롬프트·MCP 서버 로딩이 자동으로 붙습니다.
