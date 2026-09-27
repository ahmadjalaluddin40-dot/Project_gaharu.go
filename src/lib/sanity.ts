import { createClient } from "@sanity/client";
import seed from "../data/seed.json";
import opinionSeed from "../data/opinion-articles.json";
import type { AppContent, Article } from "../data/types";

const seedContent = seed as AppContent;
const opinionArticles = opinionSeed as Article[];
export const fallbackContent: AppContent = {
  ...seedContent,
  articles: [...seedContent.articles, ...opinionArticles],
};

const projectId = import.meta.env.VITE_SANITY_PROJECT_ID as string | undefined;
const dataset = (import.meta.env.VITE_SANITY_DATASET as string | undefined) || "production";

const imageProjection = `{
  "url": coalesce(image.asset->url, externalUrl),
  alt,
  credit,
  creditUrl
}`;

const query = `{
  "site": *[_type == "siteSettings" && _id == "siteSettings"][0]{
    hero{eyebrow, headline, body, "image": image${imageProjection}},
    impact,
    metrics[]{value, label, note},
    aboutPreview{eyebrow, title, body, "image": image${imageProjection}},
    programsPreview,
    publicationsPreview,
    mapPreview,
    workArea{scope, note},
    partnerCta{eyebrow, title, body, "image": image${imageProjection}},
    aboutPage{
      eyebrow, title, body, historyTitle, history, visionTitle, vision,
      missionTitle, mission, missionItems, governanceTitle, governance,
      "image": image${imageProjection},
      team[]{name, role, "photo": photo${imageProjection}},
      documents[]{title, description, year, "url": file.asset->url}
    },
    programPage{eyebrow, title, body, "image": image${imageProjection}},
    publicationsPage,
    mapPage,
    partnershipPage{
      eyebrow, title, body, approachTitle, approachBody,
      partnerTypesTitle, partnerTypesIntro, partnerTypes[]{id, en},
      "image": image${imageProjection}
    },
    contactPage,
    office,
    seo
  },
  "programs": *[_type == "program"] | order(order asc){
    "slug": slug.current, order, featured, category, title, summary, body,
    "cover": cover${imageProjection},
    "gallery": gallery[]${imageProjection},
    "galleryVideos": galleryVideos[]{
      "url": coalesce(file.asset->url, externalUrl),
      title,
      "poster": poster${imageProjection}
    },
    location, period, partner, status, metrics[]{value, label, note},
    growthData,
    metaTitle, metaDescription
  },
  "articles": *[_type == "article"] | order(publishedAt desc){
    "slug": slug.current, category, publishedAt, readTime, title, excerpt, body,
    "cover": cover${imageProjection}, authorName, authorRole, authorBio, editorialNote,
    metaTitle, metaDescription
  }
}`;

type CmsResult = Partial<AppContent>;

function mergeWithFallback<T>(base: T, updated: Partial<T> | undefined | null): T {
  if (updated == null) return base;
  if (Array.isArray(updated)) return updated as T;
  if (typeof updated !== "object" || typeof base !== "object" || base == null) {
    return updated as T;
  }

  const output = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(updated)) {
    if (value == null) continue;
    output[key] = mergeWithFallback(output[key], value);
  }
  return output as T;
}

export async function fetchSiteContent(): Promise<AppContent | null> {
  if (!projectId) return null;

  const client = createClient({
    projectId,
    dataset,
    apiVersion: "2025-02-19",
    useCdn: true,
    perspective: "published",
  });

  const result = await client.fetch<CmsResult>(query);
  return {
    site: mergeWithFallback(fallbackContent.site, result.site),
    programs: result.programs?.length ? result.programs : fallbackContent.programs,
    articles: result.articles?.length
      ? [...result.articles, ...opinionArticles.filter((item) => !result.articles?.some((remote) => remote.slug === item.slug))]
      : fallbackContent.articles,
  };
}