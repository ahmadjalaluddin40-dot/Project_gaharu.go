import { readFile } from "node:fs/promises";
import { createClient } from "@sanity/client";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.VITE_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error("Set SANITY_STUDIO_PROJECT_ID and SANITY_API_WRITE_TOKEN before updating program content.");
  process.exit(1);
}

const seed = JSON.parse(await readFile(new URL("../src/data/seed.json", import.meta.url), "utf8"));
const client = createClient({ projectId, dataset, token, apiVersion: "2025-02-19", useCdn: false });
const localizedString = (value) => ({ _type: "localizedString", ...value });
const localizedText = (value) => ({ _type: "localizedText", ...value });
const programId = (slug) => `program-${slug}`;

function image(value, key) {
  return {
    _type: "editorialImage",
    ...(key ? { _key: key } : {}),
    externalUrl: value.url,
    alt: localizedString(value.alt),
    credit: value.credit,
    creditUrl: value.creditUrl,
  };
}

function metric(value, index) {
  return {
    _type: "metric",
    _key: `metric-${index}`,
    value: localizedString(value.value),
    label: localizedString(value.label),
    ...(value.note ? { note: localizedString(value.note) } : {}),
  };
}

function programDocument(program) {
  return {
    _id: programId(program.slug),
    _type: "program",
    slug: { _type: "slug", current: program.slug },
    order: program.order,
    featured: program.featured,
    category: localizedString(program.category),
    title: localizedString(program.title),
    summary: localizedText(program.summary),
    body: localizedText(program.body),
    cover: image(program.cover),
    gallery: program.gallery.map((item, index) => image(item, `gallery-${index}`)),
    galleryVideos: (program.galleryVideos || []).map((video, index) => ({
      _type: "editorialVideo",
      _key: `video-${index}`,
      externalUrl: video.url,
      title: localizedString(video.title),
      ...(video.poster ? { poster: image(video.poster) } : {}),
    })),
    location: localizedString(program.location),
    period: localizedString(program.period),
    partner: localizedString(program.partner),
    status: localizedString(program.status),
    metrics: program.metrics.map(metric),
    ...(program.growthData ? { growthData: {
      title: localizedString(program.growthData.title),
      intro: localizedText(program.growthData.intro),
      initial: program.growthData.initial,
      followupMin: program.growthData.followupMin,
      followupMax: program.growthData.followupMax,
      standard: program.growthData.standard,
      source: localizedText(program.growthData.source),
      note: localizedText(program.growthData.note),
    } } : {}),
  };
}

const existingProgramSlugs = new Set([
  "rehabilitasi-mangrove-muna-barat",
  "energi-biogas",
  "kemitraan-riset",
  "advokasi-pesisir",
]);

const settings = await client.getDocument("siteSettings");
if (!settings) {
  console.error("Sanity document siteSettings was not found. Run scripts/seed-sanity.mjs first.");
  process.exit(1);
}

for (const item of seed.programs) {
  const document = programDocument(item);
  await client.createIfNotExists(document);

  if (item.slug === "energi-biogas") {
    // Refresh only the biogas program description; retain photos and editor-managed galleries.
    await client.patch(document._id).set({
      order: item.order,
      featured: item.featured,
      category: document.category,
      title: document.title,
      summary: document.summary,
      body: document.body,
      location: document.location,
      period: document.period,
      partner: document.partner,
      status: document.status,
    }).commit();
  } else if (item.slug === "pelatihan-dan-penyadaran-lingkungan") {
    // Replace only the temporary seedling-photo illustration; keep editor-managed copy and gallery.
    await client.patch(document._id).set({ cover: document.cover }).commit();
  } else if (existingProgramSlugs.has(item.slug)) {
    await client.patch(document._id).set({ order: item.order, featured: item.featured }).commit();
  }

  console.log(`Ready: ${document._id}`);
}

await client.patch("siteSettings").set({
  "programsPreview.title": localizedString(seed.site.programsPreview.title),
  "programsPreview.body": localizedText(seed.site.programsPreview.body),
  "programPage.eyebrow": localizedString(seed.site.programPage.eyebrow),
  "programPage.title": localizedString(seed.site.programPage.title),
  "programPage.body": localizedText(seed.site.programPage.body),
  "seo.programs.description": localizedText(seed.site.seo.programs.description),
}).commit();

console.log(`Program update complete: ${seed.programs.length} program documents checked.`);