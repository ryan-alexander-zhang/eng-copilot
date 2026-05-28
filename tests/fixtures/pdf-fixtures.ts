export function createTextPdf(pages: string[]): Uint8Array {
  return createPdfDocument(
    pages.map((pageText) => ({
      textLines: pageText.length > 0 ? [pageText] : [],
    })),
  );
}

export function createBlankPdf(pageCount: number): Uint8Array {
  return createPdfDocument(
    Array.from({ length: pageCount }, () => ({
      textLines: [],
    })),
  );
}

function createPdfDocument(
  pages: Array<{
    textLines: string[];
  }>,
) {
  const objects = new Map<number, string>();
  const fontObjectNumber = 3;
  const pageObjectNumbers: number[] = [];
  const contentObjectNumbers: number[] = [];
  let nextObjectNumber = 4;

  for (const page of pages) {
    const pageObjectNumber = nextObjectNumber;
    const contentObjectNumber = nextObjectNumber + 1;
    const contentStream = buildContentStream(page.textLines);

    pageObjectNumbers.push(pageObjectNumber);
    contentObjectNumbers.push(contentObjectNumber);
    objects.set(
      pageObjectNumber,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
    );
    objects.set(
      contentObjectNumber,
      `<< /Length ${Buffer.byteLength(contentStream, "utf8")} >>\nstream\n${contentStream}\nendstream`,
    );
    nextObjectNumber += 2;
  }

  objects.set(1, "<< /Type /Catalog /Pages 2 0 R >>");
  objects.set(
    2,
    `<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectNumbers
      .map((objectNumber) => `${objectNumber} 0 R`)
      .join(" ")}] >>`,
  );
  objects.set(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>");

  const maxObjectNumber = nextObjectNumber - 1;
  const offsets: number[] = new Array(maxObjectNumber + 1).fill(0);
  let pdf = "%PDF-1.4\n";

  for (let objectNumber = 1; objectNumber <= maxObjectNumber; objectNumber += 1) {
    offsets[objectNumber] = Buffer.byteLength(pdf, "utf8");
    pdf += `${objectNumber} 0 obj\n${objects.get(objectNumber)}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${maxObjectNumber + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let objectNumber = 1; objectNumber <= maxObjectNumber; objectNumber += 1) {
    pdf += `${offsets[objectNumber]!.toString().padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${maxObjectNumber + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Uint8Array(Buffer.from(pdf, "utf8"));
}

function buildContentStream(lines: string[]) {
  if (lines.length === 0) {
    return "";
  }

  const commands = [
    "BT",
    "/F1 18 Tf",
    "24 TL",
    "1 0 0 1 72 720 Tm",
  ];

  lines.forEach((line, index) => {
    if (index > 0) {
      commands.push("T*");
    }

    commands.push(`(${escapePdfText(line)}) Tj`);
  });

  commands.push("ET");

  return commands.join("\n");
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
