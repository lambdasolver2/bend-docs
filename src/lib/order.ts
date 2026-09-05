import { CURRICULUM_GROUPS } from "./curriculum";

export interface TocItem {
  no: string;
  title: string;
  href: string;
}

export interface Part {
  no: string;
  title: string;
  blurb: string;
  items: TocItem[];
}

const curriculumItems = (chapter: string, groupName: string): TocItem[] => {
  const group = CURRICULUM_GROUPS.find(({ name }) => name === groupName);
  return (group?.items ?? []).map((item, index) => ({
    no: `${chapter}.${index + 1}`,
    title: item.title,
    href: item.page,
  }));
};

export const PARTS: Part[] = [
  {
    no: "1",
    title: "Introduction",
    blurb: "What Bend2 is, why the project exists, and where the public record currently stands.",
    items: [
      { no: "1.1", title: "What is Bend2?", href: "/notes/what-is-bend2/" },
      { no: "1.2", title: "Release status", href: "/notes/release-status/" },
      { no: "1.3", title: "Towards an optimal computer", href: "/notes/optimal-computer/" },
    ],
  },
  {
    no: "2",
    title: "Foundations",
    blurb: "The local graph-rewriting model that makes parallel execution possible without consensus.",
    items: [
      { no: "2.1", title: "Interaction nets", href: "/notes/interaction-nets/" },
      { no: "2.2", title: "Copying, erasure, and confluence", href: "/notes/interaction-nets/#the-two-theorems-that-carry-everything" },
      { no: "2.3", title: "Why coordination is unnecessary", href: "/notes/interaction-nets/#why-coordination-is-unnecessary" },
    ],
  },
  {
    no: "3",
    title: "First Programs",
    blurb: "The first ten Bend2 language concepts, in the order a new programmer encounters them.",
    items: curriculumItems("3", "First programs"),
  },
  {
    no: "4",
    title: "Data and Matching",
    blurb: "Data definitions, pattern matching, recursion, and higher-order structure.",
    items: curriculumItems("4", "Data and matching"),
  },
  {
    no: "5",
    title: "Parallel Execution",
    blurb: "How ordinary recursive code exposes independent work, and how a device is selected.",
    items: curriculumItems("5", "Parallelism"),
  },
  {
    no: "6",
    title: "Types and Proofs",
    blurb: "Annotations, dependent types, equality, induction, and totality.",
    items: curriculumItems("6", "Types and proofs"),
  },
  {
    no: "7",
    title: "Synthesis",
    blurb: "Holes, specifications, and SupGen's type-directed search.",
    items: curriculumItems("7", "Synthesis"),
  },
  {
    no: "8",
    title: "Effects and Compilation",
    blurb: "IO, files, command-line programs, and compilation targets.",
    items: curriculumItems("8", "Effects and targets"),
  },
  {
    no: "9",
    title: "HVM4 Runtime",
    blurb: "The current runtime, its interaction rules, verified experiments, and search.",
    items: [
      { no: "9.1", title: "HVM4 architecture", href: "/notes/hvm-runtime/" },
      { no: "9.2", title: "The four interactions", href: "/notes/four-interactions/" },
      { no: "9.3", title: "HVM4 hands-on", href: "/learn/hvm-hands-on/" },
      { no: "9.4", title: "Superpositions", href: "/notes/four-interactions/#superpositions" },
      { no: "9.5", title: "Search by superposition", href: "/notes/search-by-superposition/" },
    ],
  },
  {
    no: "10",
    title: "Comparisons",
    blurb: "Bend2 beside Lean and Mojo, plus the proof-oriented programming tradition behind it.",
    items: [
      { no: "10.1", title: "Bend2 and Lean", href: "/notes/vs-lean/" },
      { no: "10.2", title: "Bend2 and Mojo", href: "/notes/vs-mojo/" },
      { no: "10.3", title: "Proof-oriented programming", href: "/notes/proof-lineage/#proof-oriented-programming" },
    ],
  },
];

export const LEARN_ORDER = [
  "/learn/hello/", "/learn/first-programs/", "/learn/data-matching/",
  "/learn/parallelism/", "/learn/sharing/", "/learn/gpu/",
  "/learn/types-proofs/", "/learn/proofs/", "/learn/synthesis/",
  "/learn/effects-targets/",
];

export const ADVANCED_ORDER = [
  "/notes/hvm-runtime/", "/notes/four-interactions/", "/learn/hvm-hands-on/",
  "/learn/sharing/", "/notes/search-by-superposition/",
];

export const ORDER = [
  "/", "/contents/",
  ...new Set(PARTS.flatMap((part) => part.items.map((item) => item.href.split("#")[0]))),
];

export interface NavEntry { href: string; title: string }

export function neighbors(href: string, titles: Map<string, string>, extraChains: string[][] = []) {
  for (const chain of [ORDER, ...extraChains]) {
    const index = chain.indexOf(href);
    if (index < 0) continue;
    const get = (url: string) => ({ href: url, title: titles.get(url) ?? url });
    return {
      ...(index > 0 ? { prev: get(chain[index - 1]) } : {}),
      ...(index < chain.length - 1 ? { next: get(chain[index + 1]) } : {}),
    };
  }
  return {};
}
