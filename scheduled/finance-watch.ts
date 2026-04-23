import "dotenv/config";
import { runAgent } from "./lib/runAgent.ts";
import { saveReport, logLine } from "./lib/notify.ts";

const THRESHOLD = Number(process.env.FINANCE_WATCH_THRESHOLD ?? "3");

const PROMPT = `
\`config.local.md\`의 관심 종목·관심 코인·관심 통화쌍을 기준으로 시세를 조회하세요.
- UsStockInfo \`get_stock_info\` (병렬)
- Crypto.com \`get_ticker\` (병렬)
- Eodi \`get_exchange_rates\`

임계치 ±${THRESHOLD}% 이상 움직인 자산만 **경보 섹션**으로 뽑아내세요. 임계치 미만이면 "평온" 한 줄.
출력 포맷:
\`\`\`
## 🚨 경보 (±${THRESHOLD}% 이상)
| 자산 | 현재가 | 변동 | 비고 |

## 현황 (전체)
| 자산 | 현재가 | 변동 |
\`\`\`
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
