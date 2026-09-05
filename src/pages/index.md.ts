export function GET() {
  const md = `# Bend Documentation\n\nUnofficial Bend docs. Not affiliated with Higher Order Company. Canonical: https://bend-docs.example.com/\n\nConcept-first documentation for HVM4 and Bend2: interaction nets, the runtime, search, proofs, and worked examples.\n\n- [Contents](https://bend-docs.example.com/contents/)\n- [Notes](https://bend-docs.example.com/notes/)\n- [Learn by example](https://bend-docs.example.com/learn/)\n`;
  return new Response(md, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
