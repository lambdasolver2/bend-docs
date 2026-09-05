import { getCollection } from "astro:content";

export async function GET() {
  const notes = await getCollection("notes");
  const learn = await getCollection("learn");
  const md = [
    "# Contents",
    "",
    "Canonical: https://bend-docs.example.com/contents/",
    "",
    "## Notes",
    "",
    ...notes.map((n) => `- [${n.data.title}](https://bend-docs.example.com/notes/${n.id.replace(/\.md$/, '')}/): verified ${n.data.verified}, status ${n.data.status}`),
    "",
    "## Learn by example",
    "",
    ...learn.map((l) => `- [${l.data.title}](https://bend-docs.example.com/learn/${l.id.replace(/\.md$/, '')}/): verified ${l.data.verified}, status ${l.data.status}`),
    "",
  ].join("\n");
  return new Response(md, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
