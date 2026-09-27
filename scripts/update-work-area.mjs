import { readFile } from "node:fs/promises";
import { createClient } from "@sanity/client";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.VITE_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error("Set SANITY_STUDIO_PROJECT_ID and SANITY_API_WRITE_TOKEN before updating work-area content.");
  process.exit(1);
}

const seed = JSON.parse(await readFile(new URL("../src/data/seed.json", import.meta.url), "utf8"));
const client = createClient({ projectId, dataset, token, apiVersion: "2025-02-19", useCdn: false });
const localizedString = (value) => ({ _type: "localizedString", ...value });
const localizedText = (value) => ({ _type: "localizedText", ...value });
const settings = await client.getDocument("siteSettings");

if (!settings) {
  console.error("Sanity document siteSettings was not found. Run scripts/seed-sanity.mjs first.");
  process.exit(1);
}

await client.patch("siteSettings").set({
  workArea: {
    scope: localizedString(seed.site.workArea.scope),
    note: localizedText(seed.site.workArea.note),
  },
  "mapPage.eyebrow": localizedString(seed.site.mapPage.eyebrow),
  "mapPage.title": localizedString(seed.site.mapPage.title),
  "mapPage.body": localizedText(seed.site.mapPage.body),
  "mapPreview.eyebrow": localizedString(seed.site.mapPreview.eyebrow),
  "mapPreview.title": localizedString(seed.site.mapPreview.title),
  "mapPreview.body": localizedText(seed.site.mapPreview.body),
  "seo.map.title": localizedString(seed.site.seo.map.title),
  "seo.map.description": localizedText(seed.site.seo.map.description),
}).commit();

console.log("Updated nationwide scope, Muna Barat map context, home preview, and map SEO in Sanity.");