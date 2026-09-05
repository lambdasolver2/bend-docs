import { CURRICULUM_GROUPS } from "./curriculum";

export const SITE_NAV = [
  {
    title: "Documentation",
    groups: [
      {
        title: "The vision",
        items: [{ title: "Towards an optimal computer", href: "/notes/optimal-computer/" }],
      },
      {
        title: "Foundations",
        items: [
          { title: "Interaction nets, explained", href: "/notes/interaction-nets/" },
          { title: "The four interactions", href: "/notes/four-interactions/" },
        ],
      },
      {
        title: "The machine",
        items: [
          { title: "The HVM4 runtime", href: "/notes/hvm-runtime/" },
          { title: "HVM4 hands-on", href: "/learn/hvm-hands-on/" },
        ],
      },
      {
        title: "Search and synthesis",
        items: [{ title: "Search by superposition", href: "/notes/search-by-superposition/" }],
      },
      {
        title: "The languages",
        items: [
          { title: "Where the proofs come from", href: "/notes/proof-lineage/" },
          { title: "Bend2 vs Mojo", href: "/notes/vs-mojo/" },
          { title: "Bend2 vs Lean", href: "/notes/vs-lean/" },
        ],
      },
      {
        title: "Bend2 today",
        items: [
          { title: "What is Bend2?", href: "/notes/what-is-bend2/" },
          { title: "Release status", href: "/notes/release-status/" },
        ],
      },
    ],
  },
  {
    title: "Learn by example",
    groups: CURRICULUM_GROUPS.map((group) => ({
      title: group.name,
      items: group.items.map(({ title, page }) => ({ title, href: page })),
    })),
  },
] as const;
