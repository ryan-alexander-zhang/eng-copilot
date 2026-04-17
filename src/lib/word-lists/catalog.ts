export const BUILT_IN_LISTS = [
  { slug: "cet4", name: "CET4", fileName: "cet4.txt" },
  { slug: "cet6", name: "CET6", fileName: "cet6.txt" },
] as const;

export const BUILT_IN_EXCLUSION = {
  slug: "builtin-exclusion",
  name: "Built-in Exclusions",
  fileName: "exclusion.txt",
} as const;

export const BUILT_IN_EXCLUSION_SLUG = BUILT_IN_EXCLUSION.slug;
