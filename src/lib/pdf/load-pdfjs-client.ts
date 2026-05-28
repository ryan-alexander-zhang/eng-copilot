type PdfJsClientModule = typeof import("pdfjs-dist/legacy/build/pdf.mjs");

let pdfJsClientPromise: Promise<PdfJsClientModule> | null = null;

export function loadPdfJsClient() {
  pdfJsClientPromise ??= import("pdfjs-dist/legacy/build/pdf.mjs").then((module) => {
    if (!module.GlobalWorkerOptions.workerSrc) {
      module.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.mjs",
        import.meta.url,
      ).toString();
    }

    return module;
  });

  return pdfJsClientPromise;
}
