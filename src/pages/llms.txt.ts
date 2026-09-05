import { getCollection } from "astro:content";

const SITE = "https://bend-docs.example.com";

export async function GET() {
  const notes = await getCollection("notes");
  const learn = await getCollection("learn");
  const lines = [
    "# bend-docs",
    "",
    "> Unofficial Bend documentation: HVM4, interaction nets, search, proofs, and Bend2 examples. Not affiliated with Higher Order Company.",
    "",
    "Every Bend2 code sample is documentation-only until a public compiler ships.",
    "",
    "## Notes",
    "",
    ...notes.map(
      (n) => `- [${n.data.title}](${SITE}/notes/${n.id.replace(/\.md$/, '')}/index.md): ${n.data.description} (status: ${n.data.status})`,
    ),
    "",
    "## Bend2 curriculum",
    "",
    ...learn.map(
      (l) => `- [${l.data.title}](${SITE}/learn/${l.id.replace(/\.md$/, '')}/index.md): ${l.data.description} (status: ${l.data.status})`,
    ),
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
