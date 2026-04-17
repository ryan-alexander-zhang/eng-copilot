import { readFile } from "node:fs/promises";

export async function loadWordListTerms(filePath: string) {
  const raw = await readFile(filePath, "utf8");

  return raw
    .split(/\r?\n/)
    .map((line) => line.trim().toLowerCase())
    .filter(Boolean);
}
