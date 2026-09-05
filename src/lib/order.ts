// Single source of truth for reading order (mirrors contents page parts).
// ORDER drives prev/next footers; PARTS drives the contents page.
export interface Part {
  no: string;
  title: string;
  blurb: string;
  slugs: string[];
}

export const PARTS: Part[] = [
  {
    no: "0", title: "The vision",
    blurb: "Why any of this exists: computability is settled, computation is not.",
    slugs: ["/notes/optimal-computer/"],
  },
  {
    no: "I", title: "Foundations",
    blurb: "The model of computation underneath everything. Read these first and the rest is vocabulary.",
    slugs: ["/notes/interaction-nets/", "/notes/four-interactions/"],
  },
  {
    no: "II", title: "The machine",
    blurb: "The current runtime plus the calculus it implements — including code you can run tonight.",
    slugs: ["/notes/hvm-runtime/", "/learn/hvm-hands-on/"],
  },
  {
    no: "III", title: "Search and synthesis",
    blurb: "Superposition as a search engine: SAT without loops, programs from templates, SupGen's ancestry.",
    slugs: ["/notes/search-by-superposition/"],
  },
  {
    no: "IV", title: "The languages",
    blurb: "The proof lineage behind Bend2's types, and the two rivals that define it by contrast.",
    slugs: ["/notes/proof-lineage/", "/notes/vs-mojo/", "/notes/vs-lean/"],
  },
  {
    no: "V", title: "Bend2 today",
    blurb: "What the unreleased successor is, and the dated trail of when it might arrive.",
    slugs: ["/notes/what-is-bend2/", "/notes/release-status/"],
  },
  {
    no: "VI", title: "By example",
    blurb: "The 45-item curriculum in new Bend2 syntax, plus the HVM page that runs today.",
    slugs: ["/learn/hello/", "/learn/first-programs/", "/learn/data-matching/", "/learn/parallelism/", "/learn/sharing/", "/learn/gpu/", "/learn/types-proofs/", "/learn/proofs/", "/learn/synthesis/", "/learn/effects-targets/"],
  },
];

export interface NavEntry {
  href: string;
  title: string;
}

// Full chapter chain: home → contents → every part page in order.
export const ORDER: string[] = [
  "/",
  "/contents/",
  ...PARTS.flatMap((p) => p.slugs),
];

export function neighbors(
  href: string,
  titles: Map<string, string>,
): { prev?: NavEntry; next?: NavEntry } {
  const i = ORDER.indexOf(href);
  if (i < 0) return {};
  const get = (h: string): NavEntry => ({ href: h, title: titles.get(h) ?? h });
  return {
    ...(i > 0 ? { prev: get(ORDER[i - 1]) } : {}),
    ...(i < ORDER.length - 1 ? { next: get(ORDER[i + 1]) } : {}),
  };
}
