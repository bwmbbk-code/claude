import "dotenv/config";
import { runAgent } from "./lib/runAgent.ts";
import { saveReport, logLine } from "./lib/notify.ts";

const PROMPT = `
Gmail 미읽음을 분류하되, 답장 초안은 만들지 말고 **리포트만** 출력하세요.
1. \`search_threads\` \`is:unread newer_than:1d\`로 최근 24시간 미읽음 최대 30개.
2. 🔴 긴급(화이트리스트+질문), 🟡 확인 필요, 🟢 참고, ⚪️ 자동 처리 후보 4개 버킷으로 분류.
3. 마크다운 표 한 장(버킷별 건수 + 🔴 버킷 상세).
4. 민감 내용은 마스킹.
`.trim();

const main = async (): Promise<void> => {
  logLine("inbox-digest 시작");
  const md = await runAgent(PROMPT);
  const path = saveReport("inbox-digest", md);
  logLine(`저장됨: ${path}`);
  console.log(md);
};

main().catch((err) => {
  logLine(`실패: ${String(err)}`);
  process.exit(1);
});
