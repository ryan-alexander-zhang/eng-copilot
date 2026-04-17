import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { loadWordListTerms } from "@/lib/word-lists/load-word-list-terms";

const tempDirectories: string[] = [];

describe("loadWordListTerms", () => {
  afterEach(async () => {
    for (const directory of tempDirectories.splice(0)) {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("loads the built-in placeholder CET4 file", async () => {
    await expect(
      loadWordListTerms(join(process.cwd(), "vendor/word-lists/cet4.txt")),
    ).resolves.toEqual(["ability", "benefit", "culture", "describe", "improve"]);
  });

  it("normalizes case and removes blank lines", async () => {
    const directory = await mkdtemp(join(tmpdir(), "word-list-terms-"));
    tempDirectories.push(directory);

    const filePath = join(directory, "sample.txt");
    await writeFile(filePath, "  Alpha  \n\nBETA\r\n gamma \n", "utf8");

    await expect(loadWordListTerms(filePath)).resolves.toEqual([
      "alpha",
      "beta",
      "gamma",
    ]);
  });
});
