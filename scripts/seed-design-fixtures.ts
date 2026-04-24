import { PrismaClient } from "@prisma/client";
import { parseMarkdownToBlocks } from "@/lib/markdown/parse-markdown-to-blocks";

const prisma = new PrismaClient();

const MAIN_MARKDOWN = `# The Value of Lifelong Learning

> “Learning is not attained by chance,
> it must be sought for with ardor and attended with diligence.”
> — Abigail Adams

## 1. Introduction

In a world that is constantly changing, the ability to learn is more valuable than ever. Lifelong learning is no longer a choice but a necessity for personal growth, career development, and meaningful living.

## 2. Why Lifelong Learning Matters

Technology evolves, industries transform, and new challenges emerge. People who embrace learning can adapt, innovate, and thrive in uncertainty.

- It enhances adaptability and resilience.
- It improves critical thinking and problem-solving.
- It opens doors to new opportunities.

> “The beautiful thing about learning is that no one can take it away from you.”
> — B.B. King

## 3. How to Cultivate a Learning Mindset

1. Stay curious. Ask questions and seek to understand.
2. Read widely and consistently.
3. Learn by doing and reflect on your experience.
4. Surround yourself with people who inspire you.

## 4. Conclusion

Lifelong learning is a journey, not a destination. By committing to it, we enrich our minds, empower our lives, and contribute to a better future.`;

type HighlightSpec = {
  block: number;
  text: string;
  repeat: number;
};

type AnnotationSpec = {
  block: number;
  text: string;
  note: string;
  color: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

type FixtureDocument = {
  title: string;
  markdown: string;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
  activeListSlugs: string[];
  shareToken?: string;
  highlightSpecs: HighlightSpec[];
  annotations: AnnotationSpec[];
};

async function main() {
  const currentSession = await prisma.session.findFirst({
    orderBy: {
      expires: "desc",
    },
  });

  if (!currentSession) {
    throw new Error("No active session found");
  }

  const currentUser = await prisma.user.findUnique({
    where: {
      id: currentSession.userId,
    },
  });

  if (!currentUser) {
    throw new Error("Current session user not found");
  }

  const alex = await prisma.user.upsert({
    where: {
      email: "alex.chen@example.com",
    },
    update: {
      name: "Alex Chen",
    },
    create: {
      email: "alex.chen@example.com",
      name: "Alex Chen",
    },
    select: {
      id: true,
    },
  });

  const wordLists = await prisma.wordList.findMany({
    where: {
      slug: {
        in: ["cet4", "cet6", "ielts", "toefl", "gre"],
      },
    },
    select: {
      id: true,
      slug: true,
    },
  });
  const wordListIdBySlug = new Map(wordLists.map((wordList) => [wordList.slug, wordList.id]));

  for (const slug of ["cet4", "cet6", "ielts", "toefl", "gre"]) {
    if (!wordListIdBySlug.has(slug)) {
      throw new Error(`Missing seeded word list: ${slug}`);
    }
  }

  await prisma.user.update({
    where: {
      id: currentUser.id,
    },
    data: {
      name: "User",
    },
  });

  await prisma.document.deleteMany({
    where: {
      ownerId: {
        in: [currentUser.id, alex.id],
      },
    },
  });

  await prisma.userWordListPreference.deleteMany({
    where: {
      userId: {
        in: [currentUser.id, alex.id],
      },
    },
  });

  await prisma.userWordListPreference.createMany({
    data: ["cet4", "cet6"].map((slug) => ({
      userId: currentUser.id,
      wordListId: getWordListId(wordListIdBySlug, slug),
    })),
  });

  for (const fixture of buildOwnerFixtures()) {
    await createFixtureDocument({
      fixture,
      ownerId: currentUser.id,
      wordListIdBySlug,
    });
  }

  for (const fixture of buildSharedFixtures()) {
    await createFixtureDocument({
      fixture,
      ownerId: alex.id,
      wordListIdBySlug,
    });
  }

  const [ownerDocuments, ownerActiveShares, sharedWithMe, ownerAnnotations] =
    await Promise.all([
      prisma.document.count({
        where: {
          ownerId: currentUser.id,
        },
      }),
      prisma.documentShare.count({
        where: {
          isActive: true,
          document: {
            ownerId: currentUser.id,
          },
        },
      }),
      prisma.documentShare.count({
        where: {
          isActive: true,
          document: {
            ownerId: {
              not: currentUser.id,
            },
          },
        },
      }),
      prisma.annotation.count({
        where: {
          ownerId: currentUser.id,
        },
      }),
    ]);

  console.log(
    JSON.stringify(
      {
        ownerDocuments,
        ownerActiveShares,
        sharedWithMe,
        ownerAnnotations,
        sessionToken: currentSession.sessionToken,
      },
      null,
      2,
    ),
  );
}

async function createFixtureDocument(input: {
  fixture: FixtureDocument;
  ownerId: string;
  wordListIdBySlug: Map<string, string>;
}) {
  const rawMarkdown = padMarkdownToWordCount(
    input.fixture.markdown,
    input.fixture.wordCount,
  );
  const blocks = parseMarkdownToBlocks(rawMarkdown);
  const highlights = buildHighlights({
    blocks,
    specs: input.fixture.highlightSpecs,
  });
  const annotations = buildAnnotations({
    blocks,
    specs: input.fixture.annotations,
  });
  const document = await prisma.document.create({
    data: {
      ownerId: input.ownerId,
      title: input.fixture.title,
      originalName: `${input.fixture.title}.md`,
      rawMarkdown,
    },
    select: {
      id: true,
    },
  });

  if (blocks.length > 0) {
    await prisma.documentBlock.createMany({
      data: blocks.map((block) => ({
        documentId: document.id,
        blockKey: block.blockKey,
        sortOrder: block.sortOrder,
        kind: block.kind,
        text: block.text,
      })),
    });
  }

  const activeWordListIds = input.fixture.activeListSlugs.map((slug) =>
    getWordListId(input.wordListIdBySlug, slug),
  );

  if (activeWordListIds.length > 0) {
    await prisma.documentWordList.createMany({
      data: activeWordListIds.map((wordListId) => ({
        documentId: document.id,
        wordListId,
      })),
    });
  }

  if (highlights.length > 0) {
    await prisma.highlightMatch.createMany({
      data: highlights.map((highlight) => ({
        documentId: document.id,
        blockKey: highlight.blockKey,
        startOffset: highlight.startOffset,
        endOffset: highlight.endOffset,
        term: highlight.term,
      })),
    });
  }

  if (annotations.length > 0) {
    await prisma.annotation.createMany({
      data: annotations.map((annotation) => ({
        documentId: document.id,
        ownerId: input.ownerId,
        startBlockKey: annotation.startBlockKey,
        startOffset: annotation.startOffset,
        endBlockKey: annotation.endBlockKey,
        endOffset: annotation.endOffset,
        quote: annotation.quote,
        note: annotation.note,
        tags: annotation.tags,
        color: annotation.color,
        createdAt: annotation.createdAt,
        updatedAt: annotation.updatedAt,
      })),
    });
  }

  if (input.fixture.shareToken) {
    const share = await prisma.documentShare.create({
      data: {
        documentId: document.id,
        token: input.fixture.shareToken,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    await setTimestamps({
      table: "DocumentShare",
      id: share.id,
      createdAt: input.fixture.createdAt,
      updatedAt: input.fixture.updatedAt,
    });
  }

  await setTimestamps({
    table: "Document",
    id: document.id,
    createdAt: input.fixture.createdAt,
    updatedAt: input.fixture.updatedAt,
  });
}

function buildOwnerFixtures(): FixtureDocument[] {
  return [
    {
      title: "The Value of Lifelong Learning",
      markdown: MAIN_MARKDOWN,
      wordCount: 1024,
      createdAt: localDate("2026-04-24T09:12:00+08:00"),
      updatedAt: localDate("2026-04-24T10:24:00+08:00"),
      activeListSlugs: ["cet4", "cet6", "ielts"],
      shareToken: "owner-doc-share-token-1",
      highlightSpecs: [
        { block: 3, text: "valuable", repeat: 3 },
        { block: 3, text: "necessity", repeat: 2 },
        { block: 5, text: "embrace", repeat: 2 },
        { block: 6, text: "adaptability", repeat: 1 },
        { block: 7, text: "critical", repeat: 2 },
        { block: 8, text: "opportunities", repeat: 1 },
        { block: 9, text: "beautiful", repeat: 1 },
        { block: 11, text: "curious", repeat: 1 },
        { block: 12, text: "consistently", repeat: 1 },
        { block: 13, text: "reflect", repeat: 1 },
        { block: 14, text: "inspire", repeat: 1 },
        { block: 16, text: "committing", repeat: 1 },
      ],
      annotations: [
        {
          block: 9,
          text: "The beautiful thing about learning is that no one can take it away from you.",
          note: "This quote emphasizes that learning is a personal asset that cannot be taken away. It's a powerful reminder of the lasting value of knowledge.",
          color: "yellow",
          tags: ["mindset", "motivation"],
          createdAt: localDate("2026-04-24T10:24:00+08:00"),
          updatedAt: localDate("2026-04-24T10:24:00+08:00"),
        },
        {
          block: 5,
          text: "People who embrace learning can adapt, innovate, and thrive in uncertainty.",
          note: "Good point! This connects to the concept of growth mindset.",
          color: "blue",
          tags: [],
          createdAt: localDate("2026-04-24T10:18:00+08:00"),
          updatedAt: localDate("2026-04-24T10:18:00+08:00"),
        },
        {
          block: 3,
          text: "Lifelong learning is no longer a choice but a necessity for personal growth",
          note: "Remember to apply this to real-life situations.",
          color: "blue",
          tags: [],
          createdAt: localDate("2026-04-23T16:32:00+08:00"),
          updatedAt: localDate("2026-04-23T16:32:00+08:00"),
        },
        {
          block: 8,
          text: "It opens doors to new opportunities.",
          note: "",
          color: "yellow",
          tags: [],
          createdAt: localDate("2026-04-18T11:07:00+08:00"),
          updatedAt: localDate("2026-04-18T11:07:00+08:00"),
        },
        {
          block: 11,
          text: "Stay curious. Ask questions and seek to understand.",
          note: "",
          color: "blue",
          tags: [],
          createdAt: localDate("2026-04-18T10:02:00+08:00"),
          updatedAt: localDate("2026-04-18T10:02:00+08:00"),
        },
      ],
    },
    createSimpleFixture({
      title: "How to Build Good Habits",
      summary: "Practical steps to build habits that stick and improve your daily life.",
      wordCount: 860,
      createdAt: localDate("2026-04-23T15:45:00+08:00"),
      updatedAt: localDate("2026-04-23T16:31:00+08:00"),
      activeListSlugs: ["cet4", "ielts"],
      body: "Start with one tiny action, repeat it consistently, and let momentum improve your routine over time.",
      highlightTerms: ["improve", "sustainable"],
      annotationCount: 2,
    }),
    createSimpleFixture({
      title: "The Power of Small Changes",
      summary: "Small changes, big impact. Start small and see the difference.",
      wordCount: 615,
      createdAt: localDate("2026-04-20T15:00:00+08:00"),
      updatedAt: localDate("2026-04-20T17:18:00+08:00"),
      activeListSlugs: ["cet4"],
      body: "Small improvements compound when you embrace repetition and stay consistent with the basics.",
      highlightTerms: ["embrace"],
      annotationCount: 1,
    }),
    createSimpleFixture({
      title: "Effective Communication",
      summary: "Key principles to communicate clearly, confidently, and with impact.",
      wordCount: 1238,
      createdAt: localDate("2026-04-18T10:00:00+08:00"),
      updatedAt: localDate("2026-04-18T14:07:00+08:00"),
      activeListSlugs: ["cet4", "toefl"],
      shareToken: "owner-doc-share-token-4",
      body: "Analyze your audience, choose reliable examples, and use clear structure to make each point land.",
      highlightTerms: ["analyze", "reliable"],
      annotationCount: 1,
    }),
    createSimpleFixture({
      title: "Mindset and Success",
      summary: "How mindset shapes your path to success and fulfillment.",
      wordCount: 942,
      createdAt: localDate("2026-04-16T08:20:00+08:00"),
      updatedAt: localDate("2026-04-16T09:11:00+08:00"),
      activeListSlugs: ["cet6"],
      body: "A coherent mindset helps you reflect on setbacks and turn them into evidence for future growth.",
      highlightTerms: ["coherent", "reflect"],
      annotationCount: 1,
    }),
    createSimpleFixture({
      title: "The Art of Focus",
      summary: "Eliminate distractions and focus on what truly matters.",
      wordCount: 756,
      createdAt: localDate("2026-04-15T09:30:00+08:00"),
      updatedAt: localDate("2026-04-15T11:02:00+08:00"),
      activeListSlugs: ["cet4", "ielts"],
      shareToken: "owner-doc-share-token-6",
      body: "Reduce noise, protect deep work, and create a sustainable rhythm for demanding tasks.",
      highlightTerms: ["sustainable"],
      annotationCount: 4,
    }),
    createSimpleFixture({
      title: "Digital Minimalism",
      summary: "Reduce digital clutter and reclaim your attention and time.",
      wordCount: 1105,
      createdAt: localDate("2026-04-12T14:00:00+08:00"),
      updatedAt: localDate("2026-04-12T15:44:00+08:00"),
      activeListSlugs: ["cet6"],
      body: "Define intentional limits, remove noisy apps, and build a calmer digital environment.",
      highlightTerms: ["necessity"],
      annotationCount: 0,
    }),
    createSimpleFixture({
      title: "Atomic Habits – Notes",
      summary: "My notes on Atomic Habits by James Clear.",
      wordCount: 1320,
      createdAt: localDate("2026-04-10T07:30:00+08:00"),
      updatedAt: localDate("2026-04-10T08:21:00+08:00"),
      activeListSlugs: ["cet4", "cet6", "gre"],
      body: "Stay curious, stack tiny wins, and build an identity that supports consistent action.",
      highlightTerms: ["curious", "consistently"],
      annotationCount: 2,
    }),
    createSimpleFixture({
      title: "Weekly Reflection Notes",
      summary: "A short weekly reflection on progress, setbacks, and next steps.",
      wordCount: 540,
      createdAt: localDate("2026-04-08T08:00:00+08:00"),
      updatedAt: localDate("2026-04-08T09:10:00+08:00"),
      activeListSlugs: [],
      shareToken: "owner-doc-share-token-9",
      body: "Reflect on progress, describe what changed, and derive next steps with clarity.",
      highlightTerms: [],
      annotationCount: 3,
    }),
    createSimpleFixture({
      title: "Reading Sprint Summary",
      summary: "Highlights from this week's reading sprint.",
      wordCount: 588,
      createdAt: localDate("2026-04-06T10:00:00+08:00"),
      updatedAt: localDate("2026-04-06T12:40:00+08:00"),
      activeListSlugs: [],
      shareToken: "owner-doc-share-token-10",
      body: "Summarize the critical passages, connect ideas, and capture questions worth revisiting.",
      highlightTerms: [],
      annotationCount: 3,
    }),
    createSimpleFixture({
      title: "Presentation Draft",
      summary: "A rough draft for the learning mindset presentation.",
      wordCount: 604,
      createdAt: localDate("2026-04-04T11:00:00+08:00"),
      updatedAt: localDate("2026-04-04T13:20:00+08:00"),
      activeListSlugs: [],
      shareToken: "owner-doc-share-token-11",
      body: "Use valuable examples, clear sequencing, and strong openings to inspire the audience.",
      highlightTerms: [],
      annotationCount: 3,
    }),
    createSimpleFixture({
      title: "Research Reading Summary",
      summary: "Notes from several papers on lifelong learning and knowledge transfer.",
      wordCount: 642,
      createdAt: localDate("2026-04-02T09:00:00+08:00"),
      updatedAt: localDate("2026-04-02T10:45:00+08:00"),
      activeListSlugs: [],
      body: "Collect the strongest evidence, compare methods, and keep the final summary concise.",
      highlightTerms: [],
      annotationCount: 2,
    }),
  ];
}

function buildSharedFixtures(): FixtureDocument[] {
  return [
    {
      title: "The Value of Lifelong Learning",
      markdown: MAIN_MARKDOWN,
      wordCount: 1024,
      createdAt: localDate("2024-05-18T09:00:00+08:00"),
      updatedAt: localDate("2024-05-20T14:00:00+08:00"),
      activeListSlugs: ["cet4", "cet6"],
      shareToken: "c6537835f999714c4a3ee7d3f6a20b79d061ccbf91690c50",
      highlightSpecs: [
        { block: 3, text: "valuable", repeat: 1 },
        { block: 3, text: "necessity", repeat: 1 },
        { block: 5, text: "embrace", repeat: 1 },
        { block: 6, text: "adaptability", repeat: 1 },
        { block: 7, text: "critical", repeat: 1 },
        { block: 8, text: "opportunities", repeat: 1 },
        { block: 9, text: "beautiful", repeat: 1 },
        { block: 11, text: "curious", repeat: 1 },
        { block: 12, text: "consistently", repeat: 1 },
        { block: 13, text: "reflect", repeat: 1 },
        { block: 14, text: "inspire", repeat: 1 },
        { block: 16, text: "committing", repeat: 1 },
      ],
      annotations: [
        {
          block: 6,
          text: "adaptability",
          note: "Adaptability is essential in fast-changing environments.",
          color: "blue",
          tags: [],
          createdAt: localDate("2026-04-24T09:42:00+08:00"),
          updatedAt: localDate("2026-04-24T09:42:00+08:00"),
        },
        {
          block: 5,
          text: "People who embrace learning can adapt, innovate, and thrive in uncertainty.",
          note: "Good point! This connects to the concept of growth mindset.",
          color: "green",
          tags: [],
          createdAt: localDate("2026-04-24T09:18:00+08:00"),
          updatedAt: localDate("2026-04-24T09:18:00+08:00"),
        },
        {
          block: 3,
          text: "Lifelong learning is no longer a choice but a necessity for personal growth",
          note: "Remember to apply this to real-life situations.",
          color: "yellow",
          tags: [],
          createdAt: localDate("2026-04-23T15:00:00+08:00"),
          updatedAt: localDate("2026-04-23T15:00:00+08:00"),
        },
      ],
    },
    createSimpleFixture({
      title: "How to Build Good Habits",
      summary: "Shared reading copy from Alex Chen.",
      wordCount: 780,
      createdAt: localDate("2026-04-20T10:00:00+08:00"),
      updatedAt: localDate("2026-04-22T10:00:00+08:00"),
      activeListSlugs: ["cet4", "ielts"],
      shareToken: "alex-shared-2",
      body: "Shareable notes about building routines that last and improve confidence over time.",
      highlightTerms: ["improve"],
      annotationCount: 1,
    }),
    createSimpleFixture({
      title: "The Art of Focus",
      summary: "Shared reading copy from Alex Chen.",
      wordCount: 710,
      createdAt: localDate("2026-04-17T10:00:00+08:00"),
      updatedAt: localDate("2026-04-21T10:00:00+08:00"),
      activeListSlugs: ["cet4"],
      shareToken: "alex-shared-3",
      body: "Focus is easier when you reduce noise and create reliable habits for deep work.",
      highlightTerms: ["reliable"],
      annotationCount: 1,
    }),
    createSimpleFixture({
      title: "Digital Minimalism",
      summary: "Shared reading copy from Alex Chen.",
      wordCount: 690,
      createdAt: localDate("2026-04-16T10:00:00+08:00"),
      updatedAt: localDate("2026-04-20T10:00:00+08:00"),
      activeListSlugs: ["cet6"],
      shareToken: "alex-shared-4",
      body: "A minimalist digital routine creates more room to reflect and think with intention.",
      highlightTerms: ["reflect"],
      annotationCount: 1,
    }),
  ];
}

function createSimpleFixture(input: {
  title: string;
  summary: string;
  wordCount: number;
  createdAt: Date;
  updatedAt: Date;
  activeListSlugs: string[];
  shareToken?: string;
  body: string;
  highlightTerms: string[];
  annotationCount: number;
}): FixtureDocument {
  return {
    title: input.title,
    markdown: `# ${input.title}\n\n${input.summary}\n\n## Notes\n\n${input.body}`,
    wordCount: input.wordCount,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    activeListSlugs: input.activeListSlugs,
    shareToken: input.shareToken,
    highlightSpecs: input.highlightTerms.map((term) => ({
      block: 3,
      text: term,
      repeat: 1,
    })),
    annotations: Array.from({ length: input.annotationCount }).map((_, index) => ({
      block: 3,
      text: input.body.split(" ").slice(0, 4 + index).join(" "),
      note: input.summary,
      color: ["yellow", "blue", "green"][index % 3] ?? "yellow",
      tags: [],
      createdAt: new Date(input.updatedAt.getTime() - (index + 1) * 3600000),
      updatedAt: new Date(input.updatedAt.getTime() - (index + 1) * 3600000),
    })),
  };
}

function buildHighlights(input: {
  blocks: ReturnType<typeof parseMarkdownToBlocks>;
  specs: HighlightSpec[];
}) {
  const highlights: Array<{
    blockKey: string;
    startOffset: number;
    endOffset: number;
    term: string;
  }> = [];

  for (const spec of input.specs) {
    const block = input.blocks[spec.block];

    if (!block) {
      continue;
    }

    const startOffset = block.text.toLowerCase().indexOf(spec.text.toLowerCase());

    if (startOffset === -1) {
      continue;
    }

    const endOffset = startOffset + spec.text.length;

    for (let index = 0; index < spec.repeat; index += 1) {
      highlights.push({
        blockKey: block.blockKey,
        startOffset,
        endOffset,
        term: spec.text.toLowerCase(),
      });
    }
  }

  return highlights;
}

function buildAnnotations(input: {
  blocks: ReturnType<typeof parseMarkdownToBlocks>;
  specs: AnnotationSpec[];
}) {
  return input.specs.flatMap((spec) => {
    const block = input.blocks[spec.block];

    if (!block) {
      return [];
    }

    const startOffset = block.text.indexOf(spec.text);

    if (startOffset === -1) {
      return [];
    }

    return [
      {
        startBlockKey: block.blockKey,
        startOffset,
        endBlockKey: block.blockKey,
        endOffset: startOffset + spec.text.length,
        quote: spec.text,
        note: spec.note,
        color: spec.color,
        tags: spec.tags,
        createdAt: spec.createdAt,
        updatedAt: spec.updatedAt,
      },
    ];
  });
}

function padMarkdownToWordCount(markdown: string, targetWordCount: number) {
  const currentWordCount = countWords(markdown);

  if (currentWordCount >= targetWordCount) {
    return markdown;
  }

  const fillerWords: string[] = [];

  while (countWords(`${markdown}\n\n<!-- ${fillerWords.join(" ")} -->`) < targetWordCount) {
    fillerWords.push("learning");
  }

  return `${markdown}\n\n<!-- ${fillerWords.join(" ")} -->`;
}

function countWords(text: string) {
  return text.match(/\S+/g)?.length ?? 0;
}

function localDate(value: string) {
  return new Date(value);
}

function getWordListId(wordListIdBySlug: Map<string, string>, slug: string) {
  const id = wordListIdBySlug.get(slug);

  if (!id) {
    throw new Error(`Missing word list: ${slug}`);
  }

  return id;
}

async function setTimestamps(input: {
  table: "Document" | "DocumentShare";
  id: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  await prisma.$executeRawUnsafe(
    `UPDATE "${input.table}" SET "createdAt" = $1, "updatedAt" = $2 WHERE id = $3`,
    input.createdAt,
    input.updatedAt,
    input.id,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
