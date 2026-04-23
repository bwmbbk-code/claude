# GitHub Actions 워크플로

`scheduled/` 의 Node 스크립트를 cron으로 돌리는 워크플로들.

## 필요한 레포 시크릿

Settings → Secrets and variables → Actions에서 다음을 등록하세요.

| 시크릿 | 내용 |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API 키 |
| `MCP_CONFIG_JSON` | `.mcp.json`의 내용 전체 (JSON 문자열) |
| `CONFIG_LOCAL_MD` | `config.local.md`의 내용 전체 |

비밀 정보를 시크릿으로 런타임에 주입하기 때문에 레포에는 개인 설정이 올라가지 않습니다.

## 워크플로

| 파일 | 트리거 | 설명 |
|---|---|---|
| `daily-brief.yml` | 매일 08:00 KST | 아침 브리핑을 아티팩트로 저장 |
| `finance-watch.yml` | 장중 30분마다 | 임계치 이상 움직인 자산 경보 |
| `content-idea-weekly.yml` | 매주 월 09:00 KST | 콘텐츠 아이디어 리서치 |

모두 `workflow_dispatch`로 수동 실행 가능합니다.

## 아티팩트

각 실행의 결과 마크다운은 Actions 런 페이지의 **Artifacts**에서 다운로드할 수 있습니다.
