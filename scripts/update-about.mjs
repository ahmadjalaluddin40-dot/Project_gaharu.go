import { readFile } from "node:fs/promises";
import { createClient } from "@sanity/client";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.VITE_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error("Set SANITY_STUDIO_PROJECT_ID and SANITY_API_WRITE_TOKEN before updating the About page.");
  process.exit(1);
}

const seed = JSON.parse(await readFile(new URL("../src/data/seed.json", import.meta.url), "utf8"));
const client = createClient({ projectId, dataset, token, apiVersion: "2025-02-19", useCdn: false });
const { site } = seed;
const about = site.aboutPage;
const preview = site.aboutPreview;
const office = site.office;
const localizedString = (value) => ({ _type: "localizedString", ...value });
const localizedText = (value) => ({ _type: "localizedText", ...value });
const editorialImage = (value) => ({
  _type: "editorialImage",
  externalUrl: value.url,
  alt: localizedString(value.alt),
  ...(value.credit ? { credit: value.credit } : {}),
  ...(value.creditUrl ? { creditUrl: value.creditUrl } : {}),
});

const updates = {
  "aboutPreview.eyebrow": localizedString(preview.eyebrow),
  "aboutPreview.title": localizedString(preview.title),
  "aboutPreview.body": localizedText(preview.body),
  "aboutPage.eyebrow": localizedString(about.eyebrow),
  "aboutPage.title": localizedString(about.title),
  "aboutPage.body": localizedText(about.body),
  "aboutPage.image": editorialImage(about.image),
  "aboutPage.historyTitle": localizedString(about.historyTitle),
  "aboutPage.history": localizedText(about.history),
  "aboutPage.visionTitle": localizedString(about.visionTitle),
  "aboutPage.vision": localizedText(about.vision),
  "aboutPage.missionTitle": localizedString(about.missionTitle),
  "aboutPage.mission": localizedText(about.mission),
  "aboutPage.missionItems": {
    _type: "localizedMissionList",
    id: about.missionItems.id,
    en: about.missionItems.en,
  },
  "aboutPage.governanceTitle": localizedString(about.governanceTitle),
  "aboutPage.governance": localizedText(about.governance),
  "office.address": localizedString(office.address),
  "office.region": localizedString(office.region),
  "office.contactPerson": office.contactPerson,
  "office.phone": office.phone,
  "office.email": office.email,
  "seo.about.title": localizedString(site.seo.about.title),
  "seo.about.description": localizedText(site.seo.about.description),
};

const existing = await client.getDocument("siteSettings");
if (!existing) {
  console.error("Sanity document siteSettings was not found. Run scripts/seed-sanity.mjs first.");
  process.exit(1);
}

// Patch only About, its home-page summary, SEO, and contact fields; preserve existing photos and other CMS edits.
await client.patch("siteSettings").set(updates).commit();
console.log("Updated GAHARU About content, official contact details, and related SEO in Sanity.");