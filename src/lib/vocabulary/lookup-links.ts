import { normalizeVocabularyWord } from "@/lib/vocabulary/normalize-word";

export type VocabularyLookupLink = {
  label: string;
  href: string;
};

export function buildVocabularyLookupLinks(word: string): VocabularyLookupLink[] {
  const normalizedWord = normalizeVocabularyWord(word);
  const encodedWord = encodeURIComponent(normalizedWord);

  return [
    {
      label: "Vocabulary.com",
      href: `https://www.vocabulary.com/dictionary/${encodedWord}`,
    },
    {
      label: "Dictionary.com",
      href: `https://www.dictionary.com/browse/${encodedWord}`,
    },
    {
      label: "Youdao",
      href: `https://www.youdao.com/result?word=${encodedWord}&lang=en`,
    },
    {
      label: "Collins Dictionary",
      href: `https://www.collinsdictionary.com/dictionary/english/${encodedWord}`,
    },
    {
      label: "Pronounce (US)",
      href: `https://youglish.com/pronounce/${encodedWord}/english/us`,
    },
    {
      label: "Pronounce (UK)",
      href: `https://youglish.com/pronounce/${encodedWord}/english/uk`,
    },
  ];
}

