import { getCollection } from "astro:content";

const SITE = "https://bend-docs.example.com";

export async function GET() {
  const notes = await getCollection("notes");
  const learn = await getCollection("learn");
  const urls = [
    { loc: "/", lastmod: "2026-09-05" },
    { loc: "/contents/", lastmod: "2026-09-05" },
    { loc: "/notes/", lastmod: "2026-09-05" },
    { loc: "/learn/", lastmod: "2026-09-05" },
    ...notes.map((n) => ({ loc: n.data.canonical, lastmod: n.data.verified })),
    ...learn.map((l) => ({ loc: l.data.canonical, lastmod: l.data.verified })),
  ];
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `<url><loc>${SITE}${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join("\n") +
    `\n</urlset>\n`;
  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  });
}
