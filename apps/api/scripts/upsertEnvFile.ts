import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

export function upsertEnvFile(
  filePath: string,
  updates: Record<string, string>,
): void {
  const absolutePath = resolve(filePath);
  const lines = existsSync(absolutePath)
    ? readFileSync(absolutePath, "utf8").split("\n")
    : [];

  const updatedKeys = new Set<string>();
  const nextLines = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (!match) {
      return line;
    }

    const key = match[1];
    if (!(key in updates)) {
      return line;
    }

    updatedKeys.add(key);
    return `${key}=${updates[key]}`;
  });

  for (const [key, value] of Object.entries(updates)) {
    if (!updatedKeys.has(key)) {
      nextLines.push(`${key}=${value}`);
    }
  }

  const content = nextLines.join("\n").replace(/\n+$/, "\n");
  writeFileSync(absolutePath, content, "utf8");
}
