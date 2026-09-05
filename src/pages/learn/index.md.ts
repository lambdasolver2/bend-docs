import { getCollection } from "astro:content";

export async function GET() {
  const learn = await getCollection("learn");
  const md = ["# Bend2 curriculum", "", "Canonical: https://bend-docs.example.com/learn/", ""].concat(
    learn.map((l) => `- [${l.data.title}](https://bend-docs.example.com/learn/${l.id.replace(/\.md$/, '')}/)`),
  );
  return new Response(md.join("\n") + "\n", {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
