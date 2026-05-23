import { describe, expect, it } from "vitest";
import { buildBlockRuns } from "@/lib/markdown/build-block-runs";

describe("buildBlockRuns", () => {
  it("returns one run for plain text with no active states", () => {
    expect(
      buildBlockRuns({
        textLength: 10,
        highlightMatches: [],
        searchMatches: [],
        annotationSegments: [],
      }),
    ).toEqual([
      {
        startOffset: 0,
        endOffset: 10,
        highlightTerms: [],
        searchMatchIds: [],
        annotationIds: [],
        annotationColor: undefined,
      },
    ]);
  });

  it("splits runs at highlight, search, and annotation boundaries", () => {
    expect(
      buildBlockRuns({
        textLength: 11,
        highlightMatches: [
          {
            startOffset: 0,
            endOffset: 5,
            term: "alpha",
          },
        ],
        searchMatches: [
          {
            id: "search:0-10",
            startOffset: 0,
            endOffset: 10,
          },
        ],
        annotationSegments: [
          {
            annotationId: "ann_1",
            startOffset: 6,
            endOffset: 10,
            color: "yellow",
          },
        ],
      }),
    ).toEqual([
      {
        startOffset: 0,
        endOffset: 5,
        highlightTerms: ["alpha"],
        searchMatchIds: ["search:0-10"],
        annotationIds: [],
        annotationColor: undefined,
      },
      {
        startOffset: 5,
        endOffset: 6,
        highlightTerms: [],
        searchMatchIds: ["search:0-10"],
        annotationIds: [],
        annotationColor: undefined,
      },
      {
        startOffset: 6,
        endOffset: 10,
        highlightTerms: [],
        searchMatchIds: ["search:0-10"],
        annotationIds: ["ann_1"],
        annotationColor: "yellow",
      },
      {
        startOffset: 10,
        endOffset: 11,
        highlightTerms: [],
        searchMatchIds: [],
        annotationIds: [],
        annotationColor: undefined,
      },
    ]);
  });

  it("ignores invalid ranges and keeps overlapping annotations ordered by range", () => {
    expect(
      buildBlockRuns({
        textLength: 12,
        highlightMatches: [
          {
            startOffset: -1,
            endOffset: 2,
            term: "bad",
          },
        ],
        searchMatches: [
          {
            id: "bad-search",
            startOffset: 4,
            endOffset: 4,
          },
        ],
        annotationSegments: [
          {
            annotationId: "ann_2",
            startOffset: 3,
            endOffset: 8,
            color: "rose",
          },
          {
            annotationId: "ann_1",
            startOffset: 2,
            endOffset: 10,
            color: "blue",
          },
        ],
      }),
    ).toEqual([
      {
        startOffset: 0,
        endOffset: 2,
        highlightTerms: [],
        searchMatchIds: [],
        annotationIds: [],
        annotationColor: undefined,
      },
      {
        startOffset: 2,
        endOffset: 3,
        highlightTerms: [],
        searchMatchIds: [],
        annotationIds: ["ann_1"],
        annotationColor: "blue",
      },
      {
        startOffset: 3,
        endOffset: 8,
        highlightTerms: [],
        searchMatchIds: [],
        annotationIds: ["ann_1", "ann_2"],
        annotationColor: "blue",
      },
      {
        startOffset: 8,
        endOffset: 10,
        highlightTerms: [],
        searchMatchIds: [],
        annotationIds: ["ann_1"],
        annotationColor: "blue",
      },
      {
        startOffset: 10,
        endOffset: 12,
        highlightTerms: [],
        searchMatchIds: [],
        annotationIds: [],
        annotationColor: undefined,
      },
    ]);
  });
});
