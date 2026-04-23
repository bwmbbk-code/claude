#!/usr/bin/env bash
# SessionStart 훅: config.local.md 존재 여부를 확인하고 없으면 Claude 세션에 주입
set -euo pipefail

# 훅은 프로젝트 루트에서 실행되지 않을 수 있으므로 스크립트 위치 기준으로 이동
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [[ ! -f "$ROOT/config.local.md" ]]; then
  cat <<'EOF'
## ⚠️ 초기 설정 필요

`config.local.md`가 없습니다. 다음 명령으로 만든 뒤 개인 정보를 채워 주세요:

```bash
cp config.example.md config.local.md
```

슬래시 커맨드 대부분이 이 파일을 참조합니다.
EOF
  exit 0
fi

# 설정이 있으면 간단히 오늘 날짜만 알림
echo "## ✅ 자동화 허브 로드됨 ($(date +%Y-%m-%d\ %A))"
echo
echo "사용 가능한 슬래시 커맨드는 \`/\` 입력 후 자동완성으로 확인하세요."
