import "dotenv/config";
import { runAgent } from "./lib/runAgent.ts";
import { saveReport, logLine } from "./lib/notify.ts";

const THRESHOLD = Number(process.env.FINANCE_WATCH_THRESHOLD ?? "1.5");

const PROMPT = `
\`config.local.md\`의 관심 통화쌍 환율을 Eodi \`get_exchange_rates\`로 조회하세요.
임계치 ±${THRESHOLD}% 이상 움직인 통화쌍만 **경보 섹션**으로 뽑아내세요. 임계치 미만이면 "평온" 한 줄.
출력 포맷:
\`\`\`
## 🚨 경보 (±${THRESHOLD}% 이상)
| 통화쌍 | 현재가 | 변동 |

## 현황 (전체)
| 통화쌍 | 현재가 | 변동 |
\`\`\`
주식·코인은 조회하지 마세요. 이 워크스페이스는 환율만 다룹니다.
`.trim();

const main = async (): Promise<void> => {
  logLine(`finance-watch 시작 (임계치 ±${THRESHOLD}%)`);
  const md = await runAgent(PROMPT);
  const path = saveReport("finance-watch", md);
  logLine(`저장됨: ${path}`);
  console.log(md);
};

main().catch((err) => {
  logLine(`실패: ${String(err)}`);
  process.exit(1);
});
