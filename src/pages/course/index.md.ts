import { getCollection } from "astro:content";
import { SITE } from "../../lib/site";

export async function GET() {
  const course = await getCollection("course");
  const md = ["# Bend2 course", "", `Canonical: ${SITE}/course/`, ""].concat(
    course.map((l) => `- [${l.data.title}](${SITE}/course/${l.id.replace(/\.md$/, '')}/)`),
  );
  return new Response(md.join("\n") + "\n", {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
