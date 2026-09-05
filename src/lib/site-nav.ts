import { PARTS } from "./order";

// Chapters rendered with their full item lists in the rail.
const FULL = new Set(["1", "2", "9", "10"]);
// Chapters collapsed to a single representative link (curriculum detail
// lives on the contents page and the /learn/ index).
const REPRESENTATIVE: Record<string, string> = {
  "3": "/learn/first-programs/",
  "4": "/learn/data-matching/",
  "5": "/learn/parallelism/",
  "6": "/learn/types-proofs/",
  "7": "/learn/synthesis/",
  "8": "/learn/effects-targets/",
};

export const SITE_NAV = [
  {
    title: "Table of Contents",
    groups: PARTS.map((part) => ({
      title: `${part.no} ${part.title}`,
      items: FULL.has(part.no)
        ? part.items.map((item) => ({ title: item.title, href: item.href }))
        : [{ title: part.title, href: REPRESENTATIVE[part.no] }],
    })),
  },
] as const;
