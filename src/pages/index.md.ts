import { SITE } from "../lib/site";

export function GET() {
  const md = `# Bend Documentation\n\nUnofficial Bend docs. Not affiliated with Higher Order Company. Canonical: ${SITE}/\n\nConcept-first documentation for HVM4 and Bend2: interaction nets, the runtime, search, proofs, and worked examples.\n\n- [Contents](${SITE}/contents/)\n- [Notes](${SITE}/notes/)\n- [Bend2 curriculum](${SITE}/learn/)\n`;
  return new Response(md, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
