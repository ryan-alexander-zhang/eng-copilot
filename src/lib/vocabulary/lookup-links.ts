import { normalizeVocabularyWord } from "@/lib/vocabulary/normalize-word";

export type VocabularyLookupLink = {
  label: string;
  href: string;
  iconSrc: string;
};

export function buildVocabularyLookupLinks(word: string): VocabularyLookupLink[] {
  const normalizedWord = normalizeVocabularyWord(word);
  const encodedWord = encodeURIComponent(normalizedWord);

  return [
    {
      label: "Vocabulary.com",
      href: `https://www.vocabulary.com/dictionary/${encodedWord}`,
      iconSrc: "/lookup-links/vocabulary.ico",
    },
    {
      label: "Dictionary.com",
      href: `https://www.dictionary.com/browse/${encodedWord}`,
      iconSrc: "/lookup-links/dictionary.png",
    },
    {
      label: "Youdao",
      href: `https://www.youdao.com/result?word=${encodedWord}&lang=en`,
      iconSrc: "/lookup-links/youdao.ico",
    },
    {
      label: "Collins Dictionary",
      href: `https://www.collinsdictionary.com/dictionary/english/${encodedWord}`,
      iconSrc: "/lookup-links/collins.ico",
    },
    {
      label: "Pronounce (US)",
      href: `https://youglish.com/pronounce/${encodedWord}/english/us`,
      iconSrc: "/lookup-links/youglish.ico",
    },
    {
      label: "Pronounce (UK)",
      href: `https://youglish.com/pronounce/${encodedWord}/english/uk`,
      iconSrc: "/lookup-links/youglish.ico",
    },
  ];
}
