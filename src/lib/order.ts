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
    no: "01", title: "Introduction",
    blurb: "What Bend2 is, why the project exists, and where the public record currently stands.",
    slugs: ["/notes/what-is-bend2/", "/notes/release-status/", "/notes/optimal-computer/"],
  },
  {
    no: "02", title: "Foundations",
    blurb: "The local graph-rewriting model that makes parallel execution possible without consensus.",
    slugs: ["/notes/interaction-nets/"],
  },
  {
    no: "03", title: "Parallel execution",
    blurb: "How ordinary recursive code exposes independent work, and how a device is selected.",
    slugs: ["/learn/parallelism/", "/learn/gpu/"],
  },
  {
    no: "04", title: "Types and proofs",
    blurb: "The proof lineage behind Bend2, and how its proof surface compares with Lean.",
    slugs: ["/notes/proof-lineage/", "/notes/vs-lean/", "/notes/vs-mojo/"],
  },
  {
    no: "05", title: "The languages",
    blurb: "The complete Bend2 language curriculum, followed by the advanced runtime and search material.",
    slugs: ["/learn/"],
  },
];

// Curriculum order for the learn detail pages (kept chained for prev/next
// even though chapters only list the /learn/ index).
export const LEARN_ORDER: string[] = [
  "/learn/hello/",
  "/learn/first-programs/",
  "/learn/data-matching/",
  "/learn/parallelism/",
  "/learn/sharing/",
  "/learn/gpu/",
  "/learn/types-proofs/",
  "/learn/proofs/",
  "/learn/synthesis/",
  "/learn/effects-targets/",
];

export const ADVANCED_ORDER: string[] = [
  "/notes/hvm-runtime/",
  "/notes/four-interactions/",
  "/learn/hvm-hands-on/",
  "/learn/sharing/",
  "/notes/search-by-superposition/",
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
  extraChains: string[][] = [],
): { prev?: NavEntry; next?: NavEntry } {
  const chains = [ORDER, ...extraChains];
  for (const chain of chains) {
    const i = chain.indexOf(href);
    if (i < 0) continue;
    const get = (h: string): NavEntry => ({ href: h, title: titles.get(h) ?? h });
    return {
      ...(i > 0 ? { prev: get(chain[i - 1]) } : {}),
      ...(i < chain.length - 1 ? { next: get(chain[i + 1]) } : {}),
    };
  }
  return {};
}
