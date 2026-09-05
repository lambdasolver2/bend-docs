import { getCollection } from "astro:content";

export async function GET() {
  const notes = await getCollection("notes");
  const md = ["# Notes", "", "Canonical: https://bend-docs.example.com/notes/", ""].concat(
    notes.map((n) => `- [${n.data.title}](https://bend-docs.example.com/notes/${n.id.replace(/\.md$/, '')}/)`),
  );
  return new Response(md.join("\n") + "\n", {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
