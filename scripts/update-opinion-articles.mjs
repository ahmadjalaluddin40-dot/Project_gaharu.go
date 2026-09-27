import { readFile } from "node:fs/promises";
import { createClient } from "@sanity/client";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.VITE_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error("Set SANITY_STUDIO_PROJECT_ID and SANITY_API_WRITE_TOKEN before updating opinion articles.");
  process.exit(1);
}

const articles = JSON.parse(await readFile(new URL("../src/data/opinion-articles.json", import.meta.url), "utf8"));
const client = createClient({ projectId, dataset, token, apiVersion: "2025-02-19", useCdn: false });
const localizedString = (value) => ({ _type: "localizedString", ...value });
const localizedText = (value) => ({ _type: "localizedText", ...value });

function editorialImage(value) {
  return {
    _type: "editorialImage",
    externalUrl: value.url,
    alt: localizedString(value.alt),
    ...(value.credit ? { credit: value.credit } : {}),
    ...(value.creditUrl ? { creditUrl: value.creditUrl } : {}),
  };
}

for (const article of articles) {
  await client.createIfNotExists({
    _id: `article-${article.slug}`,
    _type: "article",
    slug: { _type: "slug", current: article.slug },
    category: article.category,
    ...(article.publishedAt ? { publishedAt: article.publishedAt } : {}),
    ...(article.readTime ? { readTime: article.readTime } : {}),
    title: localizedString(article.title),
    excerpt: localizedText(article.excerpt),
    body: localizedText(article.body),
    cover: editorialImage(article.cover),
    ...(article.authorName ? { authorName: localizedString(article.authorName) } : {}),
    ...(article.authorRole ? { authorRole: localizedString(article.authorRole) } : {}),
    ...(article.authorBio ? { authorBio: localizedText(article.authorBio) } : {}),
    ...(article.editorialNote ? { editorialNote: localizedText(article.editorialNote) } : {}),
  });

  console.log(`Ready: article-${article.slug}`);
}

console.log(`Opinion update complete: ${articles.length} article documents available in Sanity.`);