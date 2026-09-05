export interface CurriculumItem {
  n: number;
  title: string;
  page: string;
  anchor?: string;
  updated?: string;
}

export interface CurriculumGroup {
  name: string;
  items: CurriculumItem[];
}

const page = (slug: string, anchor?: string) =>
  `/learn/${slug}/${anchor ? `#${anchor}` : ""}`;

export const CURRICULUM_GROUPS: CurriculumGroup[] = [
  {
    name: "First programs",
    items: [
      { n: 1, title: "Hello world", page: "/learn/hello/", updated: "2026-08-13" },
      { n: 2, title: "Functions", page: page("first-programs", "functions") },
      { n: 3, title: "Let bindings", page: page("first-programs", "let-bindings") },
      { n: 4, title: "Conditionals", page: page("first-programs", "conditionals") },
      { n: 5, title: "Booleans", page: page("first-programs", "booleans") },
      { n: 6, title: "Numbers", page: page("first-programs", "numbers") },
      { n: 7, title: "Strings and characters", page: page("first-programs", "strings-and-characters") },
      { n: 8, title: "Tuples", page: page("first-programs", "tuples") },
      { n: 9, title: "Lists", page: page("first-programs", "lists") },
      { n: 10, title: "Imports", page: page("first-programs", "imports") },
    ],
  },
  {
    name: "Data and matching",
    items: [
      { n: 11, title: "Algebraic data types", page: page("data-matching", "algebraic-data-types") },
      { n: 12, title: "Records", page: page("data-matching", "records") },
      { n: 13, title: "Maps", page: page("data-matching", "maps") },
      { n: 14, title: "Pattern matching", page: page("data-matching", "pattern-matching") },
      { n: 15, title: "Lambda match", page: page("data-matching", "lambda-match") },
      { n: 16, title: "Recursion", page: page("data-matching", "recursion") },
      { n: 17, title: "Mutual recursion", page: page("data-matching", "mutual-recursion") },
      { n: 18, title: "Higher-order functions", page: page("data-matching", "higher-order-functions") },
      { n: 19, title: "Closures", page: page("data-matching", "closures") },
      { n: 20, title: "Folds", page: page("data-matching", "folds") },
      { n: 21, title: "The bend construct", page: page("data-matching", "the-bend-construct") },
    ],
  },
  {
    name: "Parallelism",
    items: [
      { n: 22, title: "Automatic parallelism", page: "/learn/parallelism/", updated: "2026-08-13" },
      { n: 23, title: "Sharing and duplication", page: page("sharing", "sharing-and-duplication") },
      { n: 24, title: "Unscoped lambdas", page: page("sharing", "unscoped-lambdas") },
      { n: 25, title: "Superpositions", page: page("sharing", "superpositions") },
      { n: 26, title: "Evaluation order", page: page("sharing", "evaluation-order") },
      { n: 27, title: "Running on GPUs", page: "/learn/gpu/", updated: "2026-08-13" },
      { n: 28, title: "Measuring speedup", page: page("sharing", "measuring-speedup") },
    ],
  },
  {
    name: "Types and proofs",
    items: [
      { n: 29, title: "Type annotations", page: page("types-proofs", "type-annotations") },
      { n: 30, title: "Polymorphism", page: page("types-proofs", "polymorphism") },
      { n: 31, title: "Dependent types", page: page("types-proofs", "dependent-types") },
      { n: 32, title: "Sized lists", page: page("types-proofs", "sized-lists") },
      { n: 33, title: "Equality", page: page("types-proofs", "equality") },
      { n: 34, title: "Proofs", page: "/learn/proofs/", updated: "2026-08-21" },
      { n: 35, title: "Induction", page: page("types-proofs", "induction") },
      { n: 36, title: "Totality", page: page("types-proofs", "totality") },
    ],
  },
  {
    name: "Synthesis",
    items: [
      { n: 37, title: "Holes", page: page("synthesis", "holes") },
      { n: 38, title: "Types as specifications", page: page("synthesis", "types-as-specifications") },
      { n: 39, title: "SupGen", page: page("synthesis", "supgen") },
    ],
  },
  {
    name: "Effects and targets",
    items: [
      { n: 40, title: "IO", page: page("effects-targets", "io") },
      { n: 41, title: "Files", page: page("effects-targets", "files") },
      { n: 42, title: "Command-line arguments", page: page("effects-targets", "command-line-arguments") },
      { n: 43, title: "Compiling to C", page: page("effects-targets", "compiling-to-c") },
      { n: 44, title: "Compiling to JavaScript", page: page("effects-targets", "compiling-to-javascript") },
      { n: 45, title: "Compiling to Python", page: page("effects-targets", "compiling-to-python") },
    ],
  },
];
