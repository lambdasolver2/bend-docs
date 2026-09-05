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

// Page titles for paths that only appear as anchor targets in PARTS
// (they have no bare-page item to take a title from).
const PAGE_TITLES: Record<string, string> = {
  "/notes/proof-lineage/": "Where the proofs come from",
};

// The rail lists pages, never subsection anchors: anchor items collapse
// into their parent page (subsections live in the right "On this page"
// rail). Keeps insertion order, prefers the bare-page item's title.
function railItems(part: (typeof PARTS)[number]) {
  const seen = new Map<string, string>();
  for (const item of part.items) {
    const path = item.href.split("#")[0];
    if (!seen.has(path)) {
      seen.set(path, item.href.includes("#") ? (PAGE_TITLES[path] ?? item.title) : item.title);
    }
  }
  return [...seen].map(([href, title]) => ({ title, href }));
}

export const SITE_NAV = [
  {
    title: "Table of Contents",
    groups: PARTS.map((part) => ({
      title: `${part.no} ${part.title}`,
      items: FULL.has(part.no)
        ? railItems(part)
        : [{ title: part.title, href: REPRESENTATIVE[part.no] }],
    })),
  },
] as const;
