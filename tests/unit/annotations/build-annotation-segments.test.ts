import { describe, expect, it } from "vitest";
import { buildAnnotationSegments } from "@/components/documents/document-reader";

describe("buildAnnotationSegments", () => {
  it("projects one annotation across multiple blocks", () => {
    const segments = buildAnnotationSegments({
      blocks: [
        { blockKey: "paragraph:0", text: "alpha beta" },
        { blockKey: "paragraph:1", text: "gamma delta" },
      ],
      annotations: [
        {
          id: "ann_1",
          startBlockKey: "paragraph:0",
          startOffset: 6,
          endBlockKey: "paragraph:1",
          endOffset: 5,
        },
      ],
    });

    expect(segments).toEqual({
      "paragraph:0": [{ annotationId: "ann_1", startOffset: 6, endOffset: 10 }],
      "paragraph:1": [{ annotationId: "ann_1", startOffset: 0, endOffset: 5 }],
    });
  });
});
