export const SITE_NAV = [
  {
    title: "Table of Contents",
    groups: [
      { title: "1 Introduction", items: [{ title: "Introduction", href: "/notes/what-is-bend2/" }] },
      { title: "2 Foundations", items: [{ title: "Interaction nets", href: "/notes/interaction-nets/" }] },
      { title: "3 First Programs", items: [{ title: "First Programs", href: "/learn/first-programs/" }] },
      { title: "4 Data and Matching", items: [{ title: "Data and Matching", href: "/learn/data-matching/" }] },
      { title: "5 Parallel Execution", items: [{ title: "Parallel Execution", href: "/learn/parallelism/" }] },
      { title: "6 Types and Proofs", items: [{ title: "Types and Proofs", href: "/learn/types-proofs/" }] },
      { title: "7 Synthesis", items: [{ title: "Synthesis", href: "/learn/synthesis/" }] },
      { title: "8 Effects and Compilation", items: [{ title: "Effects and Targets", href: "/learn/effects-targets/" }] },
      {
        title: "9 HVM4 Runtime",
        items: [
          { title: "HVM4 Runtime", href: "/notes/hvm-runtime/" },
          { title: "HVM4 hands-on", href: "/learn/hvm-hands-on/" },
          { title: "Search by superposition", href: "/notes/search-by-superposition/" },
        ],
      },
      {
        title: "10 Comparisons",
        items: [
          { title: "Bend2 and Lean", href: "/notes/vs-lean/" },
          { title: "Bend2 and Mojo", href: "/notes/vs-mojo/" },
          { title: "Proof-oriented programming", href: "/notes/proof-lineage/" },
        ],
      },
    ],
  },
] as const;
