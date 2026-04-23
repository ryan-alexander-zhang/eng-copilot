export const BUILT_IN_LISTS = [
  {
    slug: "cet4",
    name: "CET4",
    fileName: "cet4.txt",
    description: "College English Test Band 4 vocabulary list. Suitable for undergraduate learners.",
    displayWordCount: 4071,
    syncedLabel: "Today, 10:24 AM",
  },
  {
    slug: "cet6",
    name: "CET6",
    fileName: "cet6.txt",
    description: "College English Test Band 6 vocabulary list. Advanced level for higher proficiency.",
    displayWordCount: 2913,
    syncedLabel: "Today, 10:24 AM",
  },
  {
    slug: "ielts",
    name: "IELTS",
    fileName: "ielts.txt",
    description: "High-frequency vocabulary for IELTS exam preparation.",
    displayWordCount: 3248,
    syncedLabel: "Yesterday, 9:15 PM",
  },
  {
    slug: "toefl",
    name: "TOEFL",
    fileName: "toefl.txt",
    description: "Essential vocabulary for TOEFL iBT exam success.",
    displayWordCount: 3781,
    syncedLabel: "May 18, 2025, 8:40 AM",
  },
  {
    slug: "gre",
    name: "GRE",
    fileName: "gre.txt",
    description: "Academic vocabulary for GRE Verbal preparation.",
    displayWordCount: 3596,
    syncedLabel: "May 17, 2025, 6:22 PM",
  },
] as const;

export const BUILT_IN_EXCLUSION = {
  slug: "builtin-exclusion",
  name: "Built-in Exclusions",
  fileName: "exclusion.txt",
} as const;

export const BUILT_IN_EXCLUSION_SLUG = BUILT_IN_EXCLUSION.slug;
