import "dotenv/config";
import { runAgent } from "./lib/runAgent.ts";
import { saveReport, logLine } from "./lib/notify.ts";

const PROMPT = `
오늘의 아침 브리핑을 만들어 주세요. 슬래시 커맨드 \`/daily-brief\`와 동일한 구조·동일한 섹션 5개(📧 중요 메일, 📅 일정, 📰 뉴스, 💱 환율, 📈 시장)로 마크다운 한 장 생성.
- 메일은 Gmail MCP (\`search_threads\` with \`is:unread newer_than:1d\`)로 조회
- 일정은 Google Calendar \`list_events\` (오늘)
- 뉴스 3건은 ItNewsSearch \`News_Article\`
- 환율은 Eodi \`get_exchange_rates\`, 시장은 Crypto.com \`get_ticker\` + UsStockInfo \`get_stock_info\`
각 도구 호출 결과를 토대로 최종 마크다운만 출력하세요. 다른 해설 없음.
`.trim();

const main = async (): Promise<void> => {
  logLine("daily-brief 시작");
  const md = await runAgent(PROMPT);
  const path = saveReport("daily-brief", md);
  logLine(`저장됨: ${path}`);
  console.log(md);
};

main().catch((err) => {
  logLine(`실패: ${String(err)}`);
  process.exit(1);
});
