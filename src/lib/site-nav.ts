import { CURRICULUM_GROUPS } from "./curriculum";

export const SITE_NAV = [
  {
    title: "Documentation",
    groups: [
      {
        title: "Introduction",
        items: [
          { title: "What is Bend2?", href: "/notes/what-is-bend2/" },
          { title: "Release status", href: "/notes/release-status/" },
          { title: "Towards an optimal computer", href: "/notes/optimal-computer/" },
        ],
      },
      {
        title: "Foundations",
        items: [{ title: "Interaction nets, explained", href: "/notes/interaction-nets/" }],
      },
      {
        title: "Parallel execution",
        items: [
          { title: "Automatic parallelism", href: "/learn/parallelism/" },
          { title: "Running on GPUs", href: "/learn/gpu/" },
        ],
      },
      {
        title: "Types and proofs",
        items: [
          { title: "Where the proofs come from", href: "/notes/proof-lineage/" },
          { title: "Bend2 vs Mojo", href: "/notes/vs-mojo/" },
          { title: "Bend2 vs Lean", href: "/notes/vs-lean/" },
        ],
      },
    ],
  },
  {
    title: "The languages",
    groups: [
      {
        title: "Bend2 curriculum",
        items: [
          { title: "Bend2 language curriculum", href: "/learn/" },
          ...CURRICULUM_GROUPS.flatMap((group) =>
            group.items.map(({ title, page }) => ({ title, href: page })),
          ),
        ],
      },
      {
        title: "Advanced runtime and search",
        items: [
          { title: "The HVM4 runtime", href: "/notes/hvm-runtime/" },
          { title: "The four interactions", href: "/notes/four-interactions/" },
          { title: "HVM4 hands-on", href: "/learn/hvm-hands-on/" },
          { title: "Sharing and duplication", href: "/learn/sharing/" },
          { title: "Search by superposition", href: "/notes/search-by-superposition/" },
        ],
      },
    ],
  },
] as const;
