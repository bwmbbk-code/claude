import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");

export function saveReport(name: string, body: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const outDir = resolve(ROOT, "scheduled", "out", date);
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, `${name}.md`);
  writeFileSync(outPath, body, "utf-8");
  return outPath;
}

export function logLine(msg: string): void {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}
