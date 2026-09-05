import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const ymd = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v ?? "")),
  z.string(),
);

const schema = z.object({
  title: z.string(),
  description: z.string(),
  updated: ymd,
  verified: ymd,
  status: z.enum(["stable", "prerelease", "docs-only", "runnable"]),
  canonical: z.string(),
  sources: z.array(z.string()).default([]),
});

const notes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/notes" }),
  schema,
});

const learn = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/learn" }),
  schema,
});

export const collections = { notes, learn };
