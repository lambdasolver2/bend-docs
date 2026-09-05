import { readFile } from "node:fs/promises";
import { getCollection, type CollectionEntry } from "astro:content";

export async function getStaticPaths() {
  const notes = await getCollection("notes");
  return notes.map((n) => ({
    params: { slug: n.id.replace(/\.md$/, "") },
    props: { entry: n },
  }));
}

export async function GET({ props }: { props: { entry: CollectionEntry<"notes"> } }) {
  const { entry } = props;
  const canonical = `https://bend-docs.example.com${entry.data.canonical}`;
  const raw = await readFile(entry.filePath!, "utf8");
  const body = (raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/)?.[1] ?? raw).trim();
  const md = `# ${entry.data.title}\n\nSource updated ${entry.data.updated}. Verified ${entry.data.verified}. Canonical: ${canonical}\n\nStatus: ${entry.data.status}\n\n${body}\n`;
  return new Response(md, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
