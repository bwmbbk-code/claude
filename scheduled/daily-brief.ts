import "dotenv/config";
import { runAgent, runSpecialist } from "./lib/runAgent.ts";
import { saveReport, logLine } from "./lib/notify.ts";

/**
 * 팬아웃/팬인 패턴:
 *   1) mail-analyst · calendar-planner · finance-researcher 세 명을 Promise.all로 병렬 실행
 *   2) 뉴스 3건은 별도로 짧은 메인 쿼리로 수집
 *   3) 네 결과를 정해진 포맷에 끼워 넣어 최종 마크다운 생성 (LLM 호출 없이 템플릿 조립)
 */

const today = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const safe = async (
  label: string,
  fn: () => Promise<string>
): Promise<string> => {
  try {
    return await fn();
  } catch (err) {
    return `❌ ${label} 실패: ${String(err)}`;
  }
};

const main = async (): Promise<void> => {
  logLine("daily-brief 시작 (fan-out)");

  const [mail, calendar, finance, news] = await Promise.all([
    safe("mail-analyst", () =>
      runSpecialist(
        "mail-analyst",
        "최근 24시간 미읽음 스레드를 조회해 중요도 Top 5를 표로만 리턴하세요. 다른 해설 금지."
      )
    ),
    safe("calendar-planner", () =>
      runSpecialist(
        "calendar-planner",
        "오늘 일정 목록과 업무 시간 내 집중 시간(빈 블록) 추천을 기본 포맷 그대로 리턴하세요."
      )
    ),
    safe("finance-researcher", () =>
      runSpecialist(
        "finance-researcher",
        "config.local.md의 관심 통화쌍·관심 종목·관심 코인을 병렬 조회해 환율/시장 두 표로 리턴하세요."
      )
    ),
    safe("news", () =>
      runAgent(
        "ItNewsSearch의 News_Article로 최신 IT 뉴스 3건을 조회하고, 각 건을 '1. [제목](링크) — 한 줄 요약' 형식으로만 리턴. 서문·맺음말 금지.",
        { allowedTools: ["mcp__*__News_Article"] }
      )
    ),
  ]);

  const md = [
    `# 아침 브리핑 (${today()})`,
    "",
    "## 📧 중요 메일",
    mail.trim(),
    "",
    "## 📅 오늘 일정 + 집중 시간",
    calendar.trim(),
    "",
    "## 📰 뉴스 3건",
    news.trim(),
    "",
    "## 💱 환율 · 📈 시장",
    finance.trim(),
    "",
  ].join("\n");

  const path = saveReport("daily-brief", md);
  logLine(`저장됨: ${path}`);
  console.log(md);
};

main().catch((err) => {
  logLine(`실패: ${String(err)}`);
  process.exit(1);
});
