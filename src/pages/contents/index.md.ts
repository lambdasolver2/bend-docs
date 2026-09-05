import { getCollection } from "astro:content";
import { SITE } from "../../lib/site";

export async function GET() {
  const notes = await getCollection("notes");
  const learn = await getCollection("learn");
  const md = [
    "# Contents",
    "",
    `Canonical: ${SITE}/contents/`,
    "",
    "## Notes",
    "",
    ...notes.map((n) => `- [${n.data.title}](${SITE}/notes/${n.id.replace(/\.md$/, '')}/): verified ${n.data.verified}, status ${n.data.status}`),
    "",
    "## Bend2 curriculum",
    "",
    ...learn.map((l) => `- [${l.data.title}](${SITE}/learn/${l.id.replace(/\.md$/, '')}/): verified ${l.data.verified}, status ${l.data.status}`),
    "",
  ].join("\n");
  return new Response(md, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
