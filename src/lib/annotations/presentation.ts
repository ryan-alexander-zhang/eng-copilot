export const DEFAULT_ANNOTATION_COLOR = "yellow" as const;

export const ANNOTATION_COLORS = [
  {
    value: "yellow",
    dot: "#F5B73B",
    background: "#FFF3D8",
    activeBackground: "#FFE8A3",
    foreground: "#6A4300",
    ring: "rgba(234, 170, 8, 0.28)",
    activeRing: "rgba(234, 170, 8, 0.45)",
  },
  {
    value: "rose",
    dot: "#F58CA8",
    background: "#FFEAF0",
    activeBackground: "#FFD9E5",
    foreground: "#B42363",
    ring: "rgba(245, 140, 168, 0.28)",
    activeRing: "rgba(245, 140, 168, 0.45)",
  },
  {
    value: "green",
    dot: "#8FD6A5",
    background: "#EAF8EF",
    activeBackground: "#D8F1E1",
    foreground: "#1E7A46",
    ring: "rgba(103, 197, 135, 0.28)",
    activeRing: "rgba(103, 197, 135, 0.45)",
  },
  {
    value: "purple",
    dot: "#B38AF8",
    background: "#F2EBFF",
    activeBackground: "#E6D9FF",
    foreground: "#6D3FC6",
    ring: "rgba(179, 138, 248, 0.28)",
    activeRing: "rgba(179, 138, 248, 0.45)",
  },
  {
    value: "blue",
    dot: "#78A9FF",
    background: "#EAF3FF",
    activeBackground: "#DCEAFE",
    foreground: "#1D5FD0",
    ring: "rgba(120, 169, 255, 0.28)",
    activeRing: "rgba(120, 169, 255, 0.45)",
  },
  {
    value: "gray",
    dot: "#C8CDD5",
    background: "#F3F4F6",
    activeBackground: "#E5E7EB",
    foreground: "#4B5563",
    ring: "rgba(156, 163, 175, 0.28)",
    activeRing: "rgba(156, 163, 175, 0.45)",
  },
] as const;

export type AnnotationColor = (typeof ANNOTATION_COLORS)[number]["value"];

export function getAnnotationColor(value?: string | null) {
  return (
    ANNOTATION_COLORS.find((color) => color.value === value) ??
    ANNOTATION_COLORS[0]
  );
}

export function normalizeAnnotationColor(value?: string | null): AnnotationColor {
  return getAnnotationColor(value).value;
}
