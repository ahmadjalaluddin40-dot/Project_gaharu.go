export type Language = "id" | "en";

export type Localized = Record<Language, string>;

export type EditorialImage = {
  url: string;
  alt: Localized;
  credit?: string;
  creditUrl?: string;
};

export type EditorialVideo = {
  url: string;
  title: Localized;
  poster?: EditorialImage;
};

export type Metric = {
  value: Localized;
  label: Localized;
  note?: Localized;
};

export type SectionContent = {
  eyebrow: Localized;
  title: Localized;
  body: Localized;
  image?: EditorialImage;
};

export type SeoContent = {
  title: Localized;
  description: Localized;
};

export type TeamMember = {
  name: string;
  role: Localized;
  photo?: EditorialImage;
};

export type LegalDocument = {
  title: Localized;
  description?: Localized;
  year?: string;
  url: string;
};

export type WorkArea = {
  scope: Localized;
  note: Localized;
};

export type SiteSettings = {
  hero: {
    eyebrow: Localized;
    headline: Localized;
    body: Localized;
    image: EditorialImage;
  };
  impact: SectionContent;
  metrics: Metric[];
  aboutPreview: SectionContent & { image: EditorialImage };
  programsPreview: SectionContent;
  publicationsPreview: SectionContent;
  mapPreview: SectionContent;
  workArea: WorkArea;
  partnerCta: SectionContent & { image: EditorialImage };
  aboutPage: SectionContent & {
    image: EditorialImage;
    historyTitle: Localized;
    history: Localized;
    visionTitle: Localized;
    vision: Localized;
    missionTitle: Localized;
    mission: Localized;
    missionItems?: Record<Language, string[]>;
    governanceTitle: Localized;
    governance: Localized;
    team?: TeamMember[];
    documents?: LegalDocument[];
  };
  programPage: SectionContent & { image: EditorialImage };
  publicationsPage: SectionContent;
  mapPage: SectionContent;
  partnershipPage: SectionContent & {
    image: EditorialImage;
    approachTitle: Localized;
    approachBody: Localized;
    partnerTypesTitle: Localized;
    partnerTypesIntro: Localized;
    partnerTypes: Localized[];
  };
  contactPage: SectionContent;
  office: {
    address: Localized;
    region: Localized;
    contactPerson: string;
    phone: string;
    email: string;
  };
  seo: Record<
    "home" | "about" | "programs" | "publications" | "map" | "partnership" | "contact",
    SeoContent
  >;
};

export type Program = {
  slug: string;
  order: number;
  featured: boolean;
  category: Localized;
  title: Localized;
  summary: Localized;
  body: Localized;
  cover: EditorialImage;
  gallery: EditorialImage[];
  galleryVideos?: EditorialVideo[];
  location: Localized;
  period: Localized;
  partner: Localized;
  status: Localized;
  metrics: Metric[];
  growthData?: {
    title: Localized;
    intro: Localized;
    initial: number;
    followupMin: number;
    followupMax: number;
    standard: number;
    source: Localized;
    note: Localized;
  };
  metaTitle?: Localized;
  metaDescription?: Localized;
};

export type ArticleCategory = "edukasi" | "riset" | "kabar" | "opini";

export type Article = {
  slug: string;
  category: ArticleCategory;
  publishedAt?: string;
  readTime?: number;
  title: Localized;
  excerpt: Localized;
  body: Localized;
  cover: EditorialImage;
  authorName?: Localized;
  authorRole?: Localized;
  authorBio?: Localized;
  editorialNote?: Localized;
  metaTitle?: Localized;
  metaDescription?: Localized;
};

export type AppContent = {
  site: SiteSettings;
  programs: Program[];
  articles: Article[];
};