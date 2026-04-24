import { query, type Options } from "@anthropic-ai/claude-agent-sdk";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  loadSpecialistPrompt,
  type SpecialistName,
} from "./specialists.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");

export function loadMcpServers(): Options["mcpServers"] {
  const path = resolve(ROOT, ".mcp.json");
  if (!existsSync(path)) return {};
  const raw = JSON.parse(readFileSync(path, "utf-8")) as {
    mcpServers?: Options["mcpServers"];
  };
  return raw.mcpServers ?? {};
}

export function loadConfig(): string {
  const path = resolve(ROOT, "config.local.md");
  if (!existsSync(path)) {
    throw new Error(
      "config.local.md이 없습니다. config.example.md를 복사해 채워 주세요."
    );
  }
  return readFileSync(path, "utf-8");
}

type RunAgentOptions = {
  allowedTools?: string[];
  systemExtra?: string;
  model?: string;
};

export async function runAgent(
  prompt: string,
  opts: RunAgentOptions = {}
): Promise<string> {
  const config = loadConfig();
  const system = [
    "You are a scheduled automation worker for a 1-person business.",
    "Respond concisely in Korean unless otherwise noted. Output plain markdown.",
    "Personal config (read-only reference):",
    "```markdown",
    config,
    "```",
    opts.systemExtra ?? "",
  ].join("\n\n");

  const messages: string[] = [];
  const response = query({
    prompt,
    options: {
      model: opts.model ?? "claude-sonnet-4-6",
      systemPrompt: system,
      mcpServers: loadMcpServers(),
      allowedTools: opts.allowedTools,
      permissionMode: "bypassPermissions",
    },
  });

  for await (const msg of response) {
    if (msg.type === "assistant") {
      for (const block of msg.message.content) {
        if (block.type === "text") messages.push(block.text);
      }
    }
  }
  return messages.join("\n");
}

/**
 * 특정 스페셜리스트 페르소나로 한 번 쿼리.
 * `.claude/agents/<name>.md`의 본문을 systemExtra에 주입하므로 대화형 Claude Code의
 * 서브에이전트와 동일한 규칙·출력 포맷을 따른다.
 */
export async function runSpecialist(
  name: SpecialistName,
  prompt: string,
  opts: Omit<RunAgentOptions, "systemExtra"> = {}
): Promise<string> {
  const persona = loadSpecialistPrompt(name);
  return runAgent(prompt, {
    ...opts,
    systemExtra: [
      `You are the "${name}" specialist. Follow the rules below strictly:`,
      "",
      persona,
    ].join("\n"),
  });
}
