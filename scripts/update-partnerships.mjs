import { readFile } from "node:fs/promises";
import { createClient } from "@sanity/client";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.VITE_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error("Set SANITY_STUDIO_PROJECT_ID and SANITY_API_WRITE_TOKEN before updating partnership content.");
  process.exit(1);
}

const seed = JSON.parse(await readFile(new URL("../src/data/seed.json", import.meta.url), "utf8"));
const client = createClient({ projectId, dataset, token, apiVersion: "2025-02-19", useCdn: false });
const localizedString = (value) => ({ _type: "localizedString", ...value });
const localizedText = (value) => ({ _type: "localizedText", ...value });
const page = seed.site.partnershipPage;

const existing = await client.getDocument("siteSettings");
if (!existing) {
  console.error("Sanity document siteSettings was not found. Run scripts/seed-sanity.mjs first.");
  process.exit(1);
}

await client.patch("siteSettings").set({
  "partnershipPage.partnerTypesTitle": localizedString(page.partnerTypesTitle),
  "partnershipPage.partnerTypesIntro": localizedText(page.partnerTypesIntro),
  "partnershipPage.partnerTypes": page.partnerTypes.map((item, index) => ({
    ...localizedString(item),
    _key: `partner-type-${index}`,
  })),
}).commit();

console.log(`Updated ${page.partnerTypes.length} bilingual categories for potential collaboration in Sanity.`);