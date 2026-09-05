import { getCollection } from "astro:content";
import { SITE } from "../../lib/site";

export async function GET() {
  const learn = await getCollection("learn");
  const md = ["# Bend2 curriculum", "", `Canonical: ${SITE}/learn/`, ""].concat(
    learn.map((l) => `- [${l.data.title}](${SITE}/learn/${l.id.replace(/\.md$/, '')}/)`),
  );
  return new Response(md.join("\n") + "\n", {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
