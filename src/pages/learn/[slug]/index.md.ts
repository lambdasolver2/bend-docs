import { readFile } from "node:fs/promises";
import { getCollection, type CollectionEntry } from "astro:content";
import { SITE } from "../../../lib/site";

export async function getStaticPaths() {
  const learn = await getCollection("learn");
  return learn.map((l) => ({
    params: { slug: l.id.replace(/\.md$/, "") },
    props: { entry: l },
  }));
}

export async function GET({ props }: { props: { entry: CollectionEntry<"learn"> } }) {
  const { entry } = props;
  const canonical = `${SITE}${entry.data.canonical}`;
  const raw = await readFile(entry.filePath!, "utf8");
  const body = (raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/)?.[1] ?? raw).trim();
  const md = `# ${entry.data.title}\n\nSource updated ${entry.data.updated}. Verified ${entry.data.verified}. Canonical: ${canonical}\n\nStatus: ${entry.data.status}\n\n${body}\n`;
  return new Response(md, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
