import { getCollection } from "astro:content";
import { SITE } from "../../lib/site";

export async function GET() {
  const notes = await getCollection("notes");
  const md = ["# Notes", "", `Canonical: ${SITE}/notes/`, ""].concat(
    notes.map((n) => `- [${n.data.title}](${SITE}/notes/${n.id.replace(/\.md$/, '')}/)`),
  );
  return new Response(md.join("\n") + "\n", {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
