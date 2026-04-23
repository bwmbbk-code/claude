import "dotenv/config";
import { runAgent } from "./lib/runAgent.ts";
import { saveReport, logLine } from "./lib/notify.ts";

const PROMPT = `
\`config.local.md\`의 **블로그 주제 키워드**를 가져와, 각 키워드에 대해:
1. YouTube \`search_videos\` 최근 1개월 상위 3개
2. ItNewsSearch \`News_Article\` 최근 기사 3건
3. 위 자료를 종합해 **이번 주 콘텐츠 아이디어 5개**를 도출

\`config.local.md\`의 **콘텐츠 아이디어 DB ID**가 있으면 Notion \`notion-create-pages\`로 아이디어 5건을 각각 페이지로 저장. 없으면 저장은 생략하고 마크다운으로 출력만.

최종 출력은 마크다운 리포트 1장:
- 주제별 핵심 트렌드 요약
- 제안 아이디어 5개(각각 1줄 요지 + 예상 훅)
- 저장된 Notion 페이지 URL (있으면)
`.trim();

const main = async (): Promise<void> => {
  logLine("content-idea-weekly 시작");
  const md = await runAgent(PROMPT);
  const path = saveReport("content-idea-weekly", md);
  logLine(`저장됨: ${path}`);
  console.log(md);
};

main().catch((err) => {
  logLine(`실패: ${String(err)}`);
  process.exit(1);
});
