import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");

export type SpecialistName =
  | "mail-analyst"
  | "calendar-planner"
  | "finance-researcher"
  | "content-scout"
  | "notion-keeper";

/**
 * `.claude/agents/<name>.md` 파일을 읽어 YAML frontmatter를 제거한 본문만 반환.
 * SDK에서 systemPrompt에 그대로 주입해 메인 Claude Code 세션의 서브에이전트와
 * 동일한 페르소나로 실행하기 위함.
 */
export function loadSpecialistPrompt(name: SpecialistName): string {
  const path = resolve(ROOT, ".claude", "agents", `${name}.md`);
  if (!existsSync(path)) {
    throw new Error(`스페셜리스트 정의 없음: ${path}`);
  }
  const raw = readFileSync(path, "utf-8");
  return raw.replace(/^---[\s\S]*?---\s*/m, "").trim();
}
