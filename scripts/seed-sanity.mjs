import { readFile } from "node:fs/promises";
import { createClient } from "@sanity/client";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.VITE_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error("Set SANITY_STUDIO_PROJECT_ID and SANITY_API_WRITE_TOKEN before seeding Sanity.");
  process.exit(1);
}

const seed = JSON.parse(await readFile(new URL("../src/data/seed.json", import.meta.url), "utf8"));
const opinionArticles = JSON.parse(await readFile(new URL("../src/data/opinion-articles.json", import.meta.url), "utf8"));

const localizedString = (value) => ({ _type: "localizedString", ...value });
const localizedText = (value) => ({ _type: "localizedText", ...value });

function editorialImage(value, key) {
  return {
    _type: "editorialImage",
    ...(key ? { _key: key } : {}),
    externalUrl: value.url,
    alt: localizedString(value.alt),
    ...(value.credit ? { credit: value.credit } : {}),
    ...(value.creditUrl ? { creditUrl: value.creditUrl } : {}),
  };
}

function metrics(items) {
  return items.map((item, index) => ({
    _type: "metric",
    _key: `metric-${index}`,
    value: localizedString(item.value),
    label: localizedString(item.label),
    ...(item.note ? { note: localizedString(item.note) } : {}),
  }));
}

function sectionFields(value) {
  return {
    eyebrow: localizedString(value.eyebrow),
    title: localizedString(value.title),
    body: localizedText(value.body),
    ...(value.image ? { image: editorialImage(value.image) } : {}),
  };
}

function section(value) {
  return { _type: "contentSection", ...sectionFields(value) };
}

const site = seed.site;
const siteDocument = {
  _id: "siteSettings",
  _type: "siteSettings",
  hero: {
    eyebrow: localizedString(site.hero.eyebrow),
    headline: localizedString(site.hero.headline),
    body: localizedText(site.hero.body),
    image: editorialImage(site.hero.image),
  },
  impact: section(site.impact),
  metrics: metrics(site.metrics),
  aboutPreview: section(site.aboutPreview),
  programsPreview: section(site.programsPreview),
  publicationsPreview: section(site.publicationsPreview),
  mapPreview: section(site.mapPreview),
  workArea: {
    scope: localizedString(site.workArea.scope),
    note: localizedText(site.workArea.note),
  },
  partnerCta: section(site.partnerCta),
  aboutPage: {
    ...sectionFields(site.aboutPage),
    historyTitle: localizedString(site.aboutPage.historyTitle),
    history: localizedText(site.aboutPage.history),
    visionTitle: localizedString(site.aboutPage.visionTitle),
    vision: localizedText(site.aboutPage.vision),
    missionTitle: localizedString(site.aboutPage.missionTitle),
    mission: localizedText(site.aboutPage.mission),
    missionItems: {
      _type: "localizedMissionList",
      id: site.aboutPage.missionItems.id,
      en: site.aboutPage.missionItems.en,
    },
    governanceTitle: localizedString(site.aboutPage.governanceTitle),
    governance: localizedText(site.aboutPage.governance),
    team: (site.aboutPage.team || []).map((member, index) => ({
      _type: "teamMember",
      _key: `member-${index}`,
      name: member.name,
      role: localizedString(member.role),
      ...(member.photo ? { photo: editorialImage(member.photo) } : {}),
    })),
    documents: [],
  },
  programPage: section(site.programPage),
  publicationsPage: section(site.publicationsPage),
  mapPage: section(site.mapPage),
  partnershipPage: {
    ...sectionFields(site.partnershipPage),
    approachTitle: localizedString(site.partnershipPage.approachTitle),
    approachBody: localizedText(site.partnershipPage.approachBody),
    partnerTypesTitle: localizedString(site.partnershipPage.partnerTypesTitle),
    partnerTypesIntro: localizedText(site.partnershipPage.partnerTypesIntro),
    partnerTypes: site.partnershipPage.partnerTypes.map((item, index) => ({
      ...localizedString(item),
      _key: `partner-type-${index}`,
    })),
  },
  contactPage: section(site.contactPage),
  office: {
    address: localizedString(site.office.address),
    region: localizedString(site.office.region),
    contactPerson: site.office.contactPerson,
    phone: site.office.phone,
    email: site.office.email,
  },
  seo: Object.fromEntries(
    Object.entries(site.seo).map(([key, value]) => [key, {
      _type: "seoEntry",
      title: localizedString(value.title),
      description: localizedText(value.description),
    }]),
  ),
};

const programs = seed.programs.map((item) => ({
  _id: `program-${item.slug}`,
  _type: "program",
  slug: { _type: "slug", current: item.slug },
  order: item.order,
  featured: item.featured,
  category: localizedString(item.category),
  title: localizedString(item.title),
  summary: localizedText(item.summary),
  body: localizedText(item.body),
  cover: editorialImage(item.cover),
  gallery: item.gallery.map((image, index) => editorialImage(image, `gallery-${index}`)),
  galleryVideos: (item.galleryVideos || []).map((video, index) => ({
    _type: "editorialVideo",
    _key: `video-${index}`,
    externalUrl: video.url,
    title: localizedString(video.title),
    ...(video.poster ? { poster: editorialImage(video.poster) } : {}),
  })),
  location: localizedString(item.location),
  period: localizedString(item.period),
  partner: localizedString(item.partner),
  status: localizedString(item.status),
  metrics: metrics(item.metrics),
  ...(item.growthData ? { growthData: {
    title: localizedString(item.growthData.title),
    intro: localizedText(item.growthData.intro),
    initial: item.growthData.initial,
    followupMin: item.growthData.followupMin,
    followupMax: item.growthData.followupMax,
    standard: item.growthData.standard,
    source: localizedText(item.growthData.source),
    note: localizedText(item.growthData.note),
  } } : {}),
}));

const articles = [...seed.articles, ...opinionArticles].map((item) => ({
  _id: `article-${item.slug}`,
  _type: "article",
  slug: { _type: "slug", current: item.slug },
  category: item.category,
  ...(item.publishedAt ? { publishedAt: item.publishedAt } : {}),
  ...(item.readTime ? { readTime: item.readTime } : {}),
  title: localizedString(item.title),
  excerpt: localizedText(item.excerpt),
  body: localizedText(item.body),
  cover: editorialImage(item.cover),
  ...(item.authorName ? { authorName: localizedString(item.authorName) } : {}),
  ...(item.authorRole ? { authorRole: localizedString(item.authorRole) } : {}),
  ...(item.authorBio ? { authorBio: localizedText(item.authorBio) } : {}),
  ...(item.editorialNote ? { editorialNote: localizedText(item.editorialNote) } : {}),
}));

const client = createClient({ projectId, dataset, token, apiVersion: "2025-02-19", useCdn: false });
const documents = [siteDocument, ...programs, ...articles];

// Existing Studio edits are never overwritten by the starter content.
for (const document of documents) {
  await client.createIfNotExists(document);
  console.log(`Ready: ${document._id}`);
}

console.log(`Seed complete: ${documents.length} documents available in Sanity.`);