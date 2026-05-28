export type MinimalPdfTextItem = {
  str: string;
  hasEOL?: boolean;
  width?: number;
  height?: number;
  transform?: number[];
};

export type PdfPageTextRun = {
  runIndex: number;
  itemIndex: number;
  text: string;
  startOffset: number;
  endOffset: number;
  hasEOL: boolean;
};

export type PdfPageTextItem = {
  itemIndex: number;
  runIndex: number | null;
  text: string;
  startOffset: number;
  endOffset: number;
  hasEOL: boolean;
};

export type BuiltPdfPageText = {
  text: string;
  items: PdfPageTextItem[];
  runs: PdfPageTextRun[];
  textItemCount: number;
  nonWhitespaceChars: number;
};

export function buildPdfPageText(items: MinimalPdfTextItem[]): BuiltPdfPageText {
  const runs: PdfPageTextRun[] = [];
  const renderedItems: PdfPageTextItem[] = [];
  const parts: string[] = [];
  let text = "";

  for (const [itemIndex, item] of items.entries()) {
    const normalizedText = normalizeItemText(item.str);
    let runText = normalizedText;

    if (runText.length > 0 && (text.length === 0 || text.endsWith("\n"))) {
      runText = runText.replace(/^ +/g, "");
    }

    if (runText.length > 0 && text.endsWith(" ") && runText.startsWith(" ")) {
      runText = runText.replace(/^ +/g, "");
    }

    if (item.hasEOL) {
      runText = runText.replace(/ +$/g, "");
    }

    if (runText.length > 0) {
      const startOffset = text.length;
      text += runText;
      parts.push(runText);
      const nextRun: PdfPageTextRun = {
        runIndex: runs.length,
        itemIndex,
        text: runText,
        startOffset,
        endOffset: text.length,
        hasEOL: item.hasEOL === true,
      };

      runs.push(nextRun);
      renderedItems.push({
        itemIndex,
        runIndex: nextRun.runIndex,
        text: runText,
        startOffset,
        endOffset: text.length,
        hasEOL: item.hasEOL === true,
      });
    } else {
      renderedItems.push({
        itemIndex,
        runIndex: null,
        text: "",
        startOffset: text.length,
        endOffset: text.length,
        hasEOL: item.hasEOL === true,
      });
    }

    if (item.hasEOL && !text.endsWith("\n")) {
      text = text.replace(/ +$/g, "");
      parts.push("\n");
      text += "\n";
    }
  }

  return {
    text,
    items: renderedItems,
    runs,
    textItemCount: items.length,
    nonWhitespaceChars: countNonWhitespaceCharacters(parts.join("")),
  };
}

function normalizeItemText(value: string) {
  return value.replace(/\s+/g, " ");
}

function countNonWhitespaceCharacters(value: string) {
  return value.replace(/\s+/g, "").length;
}
