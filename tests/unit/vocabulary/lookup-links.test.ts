import { describe, expect, it } from "vitest";
import { buildVocabularyLookupLinks } from "@/lib/vocabulary/lookup-links";
import { normalizeVocabularyWord } from "@/lib/vocabulary/normalize-word";

describe("normalizeVocabularyWord", () => {
  it("trims and lowercases saved words", () => {
    expect(normalizeVocabularyWord("  Observability  ")).toBe("observability");
  });
});

describe("buildVocabularyLookupLinks", () => {
  it("builds the configured dictionary and pronunciation links", () => {
    expect(buildVocabularyLookupLinks("observability")).toEqual([
      {
        label: "Vocabulary.com",
        href: "https://www.vocabulary.com/dictionary/observability",
      },
      {
        label: "Dictionary.com",
        href: "https://www.dictionary.com/browse/observability",
      },
      {
        label: "Youdao",
        href: "https://www.youdao.com/result?word=observability&lang=en",
      },
      {
        label: "Collins Dictionary",
        href: "https://www.collinsdictionary.com/dictionary/english/observability",
      },
      {
        label: "Pronounce (US)",
        href: "https://youglish.com/pronounce/observability/english/us",
      },
      {
        label: "Pronounce (UK)",
        href: "https://youglish.com/pronounce/observability/english/uk",
      },
    ]);
  });
});

