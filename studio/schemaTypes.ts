import { defineField, defineType } from "sanity";

const localizedString = defineType({
  name: "localizedString",
  title: "Teks dua bahasa",
  type: "object",
  fields: [
    defineField({ name: "id", title: "Bahasa Indonesia", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "en", title: "English", type: "string", validation: (Rule) => Rule.required() }),
  ],
});

const localizedText = defineType({
  name: "localizedText",
  title: "Paragraf dua bahasa",
  type: "object",
  fields: [
    defineField({ name: "id", title: "Bahasa Indonesia", type: "text", rows: 5, validation: (Rule) => Rule.required() }),
    defineField({ name: "en", title: "English", type: "text", rows: 5, validation: (Rule) => Rule.required() }),
  ],
});

const localizedMissionList = defineType({
  name: "localizedMissionList",
  title: "Daftar misi ID / EN",
  type: "object",
  fields: [
    defineField({
      name: "id",
      title: "Misi - Bahasa Indonesia",
      type: "array",
      of: [{ type: "string" }],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "en",
      title: "Misi - English",
      type: "array",
      of: [{ type: "string" }],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
});

const editorialImage = defineType({
  name: "editorialImage",
  title: "Foto / visual",
  type: "object",
  fields: [
    defineField({ name: "image", title: "Unggah foto asli (diprioritaskan)", type: "image", options: { hotspot: true } }),
    defineField({ name: "externalUrl", title: "URL foto sementara", type: "url", description: "Digunakan bila belum ada foto yang diunggah." }),
    defineField({ name: "alt", title: "Deskripsi gambar untuk aksesibilitas", type: "localizedString", validation: (Rule) => Rule.required() }),
    defineField({ name: "credit", title: "Kredit / keterangan foto", type: "string" }),
    defineField({ name: "creditUrl", title: "Tautan sumber foto", type: "url" }),
  ],
  preview: {
    select: { title: "alt.id", media: "image" },
    prepare: ({ title, media }) => ({ title: title || "Foto", media }),
  },
});

const editorialVideo = defineType({
  name: "editorialVideo",
  title: "Video program",
  type: "object",
  fields: [
    defineField({ name: "title", title: "Judul video ID / EN", type: "localizedString" }),
    defineField({ name: "file", title: "Unggah video MP4 / WebM", type: "file", options: { accept: "video/mp4,video/webm" } }),
    defineField({ name: "externalUrl", title: "URL video langsung (MP4 / WebM)", type: "url" }),
    defineField({ name: "poster", title: "Gambar sampul video", type: "editorialImage" }),
  ],
  preview: { select: { title: "title.id", media: "poster.image" } },
});

const metric = defineType({
  name: "metric",
  title: "Angka dampak",
  type: "object",
  fields: [
    defineField({ name: "value", title: "Angka ID / EN (contoh: 45 ha)", type: "localizedString", validation: (Rule) => Rule.required() }),
    defineField({ name: "label", title: "Keterangan", type: "localizedString" }),
    defineField({ name: "note", title: "Catatan kecil", type: "localizedString" }),
  ],
  preview: { select: { title: "value.id", subtitle: "label.id" } },
});

const contentSection = defineType({
  name: "contentSection",
  title: "Bagian halaman",
  type: "object",
  fields: [
    defineField({ name: "eyebrow", title: "Label kecil", type: "localizedString" }),
    defineField({ name: "title", title: "Judul", type: "localizedString" }),
    defineField({ name: "body", title: "Deskripsi", type: "localizedText" }),
    defineField({ name: "image", title: "Gambar (jika digunakan)", type: "editorialImage" }),
  ],
});

const seoEntry = defineType({
  name: "seoEntry",
  title: "SEO halaman",
  type: "object",
  fields: [
    defineField({ name: "title", title: "Meta title", type: "localizedString" }),
    defineField({ name: "description", title: "Meta description", type: "localizedText" }),
  ],
});

const teamMember = defineType({
  name: "teamMember",
  title: "Anggota tim",
  type: "object",
  fields: [
    defineField({ name: "name", title: "Nama", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "role", title: "Peran ID / EN", type: "localizedString" }),
    defineField({ name: "photo", title: "Foto (opsional)", type: "editorialImage" }),
  ],
  preview: { select: { title: "name", subtitle: "role.id", media: "photo.image" } },
});

const legalDocument = defineType({
  name: "legalDocument",
  title: "Dokumen organisasi",
  type: "object",
  fields: [
    defineField({ name: "title", title: "Judul ID / EN", type: "localizedString" }),
    defineField({ name: "description", title: "Keterangan ID / EN", type: "localizedText" }),
    defineField({ name: "year", title: "Tahun", type: "string" }),
    defineField({ name: "file", title: "Berkas PDF", type: "file", options: { accept: "application/pdf" } }),
  ],
  preview: { select: { title: "title.id", subtitle: "year" } },
});

const siteSettings = defineType({
  name: "siteSettings",
  title: "Pengaturan & halaman utama",
  type: "document",
  groups: [
    { name: "home", title: "Beranda", default: true },
    { name: "pages", title: "Halaman lain" },
    { name: "organization", title: "Organisasi" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "hero",
      title: "Hero beranda",
      type: "object",
      group: "home",
      fields: [
        defineField({ name: "eyebrow", title: "Identitas", type: "localizedString" }),
        defineField({ name: "headline", title: "Headline", type: "localizedString" }),
        defineField({ name: "body", title: "Deskripsi", type: "localizedText" }),
        defineField({ name: "image", title: "Foto hero", type: "editorialImage" }),
      ],
    }),
    defineField({ name: "impact", title: "Pengantar dampak", type: "contentSection", group: "home" }),
    defineField({ name: "metrics", title: "Statistik dampak", type: "array", of: [{ type: "metric" }], group: "home" }),
    defineField({ name: "aboutPreview", title: "Tentang GAHARU di beranda", type: "contentSection", group: "home" }),
    defineField({ name: "programsPreview", title: "Pengantar program di beranda", type: "contentSection", group: "home" }),
    defineField({ name: "publicationsPreview", title: "Pengantar publikasi di beranda", type: "contentSection", group: "home" }),
    defineField({ name: "mapPreview", title: "Pengantar wilayah kerja di beranda", type: "contentSection", group: "home" }),
    defineField({ name: "partnerCta", title: "Ajakan kemitraan di beranda", type: "contentSection", group: "home" }),
    defineField({
      name: "workArea",
      title: "Cakupan wilayah kerja",
      type: "object",
      group: "organization",
      fields: [
        defineField({ name: "scope", title: "Cakupan resmi ID / EN", type: "localizedString", validation: (Rule) => Rule.required() }),
        defineField({ name: "note", title: "Keterangan cakupan ID / EN", type: "localizedText", validation: (Rule) => Rule.required() }),
      ],
    }),
    defineField({
      name: "aboutPage",
      title: "Halaman Tentang Kami",
      type: "object",
      group: "pages",
      fields: [
        defineField({ name: "eyebrow", title: "Label kecil", type: "localizedString" }),
        defineField({ name: "title", title: "Judul", type: "localizedString" }),
        defineField({ name: "body", title: "Pengantar", type: "localizedText" }),
        defineField({ name: "image", title: "Foto", type: "editorialImage" }),
        defineField({ name: "historyTitle", title: "Judul sejarah", type: "localizedString" }),
        defineField({ name: "history", title: "Sejarah", type: "localizedText" }),
        defineField({ name: "visionTitle", title: "Judul visi", type: "localizedString" }),
        defineField({ name: "vision", title: "Visi", type: "localizedText" }),
        defineField({ name: "missionTitle", title: "Judul misi", type: "localizedString" }),
        defineField({ name: "mission", title: "Pengantar misi", type: "localizedText" }),
        defineField({ name: "missionItems", title: "Butir misi ID / EN", type: "localizedMissionList" }),
        defineField({ name: "governanceTitle", title: "Judul tata kelola", type: "localizedString" }),
        defineField({ name: "governance", title: "Tata kelola / legalitas", type: "localizedText" }),
        defineField({ name: "team", title: "Tim / struktur ringkas", type: "array", of: [{ type: "teamMember" }] }),
        defineField({ name: "documents", title: "Dokumen PDF untuk publik", type: "array", of: [{ type: "legalDocument" }] }),
      ],
    }),
    defineField({ name: "programPage", title: "Halaman daftar program", type: "contentSection", group: "pages" }),
    defineField({ name: "publicationsPage", title: "Halaman publikasi", type: "contentSection", group: "pages" }),
    defineField({ name: "mapPage", title: "Halaman wilayah kerja", type: "contentSection", group: "pages" }),
    defineField({
      name: "partnershipPage",
      title: "Halaman kemitraan",
      type: "object",
      group: "pages",
      fields: [
        defineField({ name: "eyebrow", title: "Label kecil", type: "localizedString" }),
        defineField({ name: "title", title: "Judul", type: "localizedString" }),
        defineField({ name: "body", title: "Deskripsi", type: "localizedText" }),
        defineField({ name: "image", title: "Foto", type: "editorialImage" }),
        defineField({ name: "approachTitle", title: "Judul pendekatan", type: "localizedString" }),
        defineField({ name: "approachBody", title: "Isi pendekatan", type: "localizedText" }),
        defineField({ name: "partnerTypesTitle", title: "Judul kategori kemitraan", type: "localizedString" }),
        defineField({ name: "partnerTypesIntro", title: "Pengantar kategori kemitraan", type: "localizedText" }),
        defineField({ name: "partnerTypes", title: "Kategori calon mitra (ID / EN)", type: "array", of: [{ type: "localizedString" }] }),
      ],
    }),
    defineField({ name: "contactPage", title: "Halaman kontak", type: "contentSection", group: "pages" }),
    defineField({
      name: "office",
      title: "Alamat organisasi",
      type: "object",
      group: "organization",
      fields: [
        defineField({ name: "address", title: "Alamat publik", type: "localizedString" }),
        defineField({ name: "region", title: "Wilayah", type: "localizedString" }),
        defineField({ name: "contactPerson", title: "Kontak person", type: "string" }),
        defineField({ name: "phone", title: "Nomor telepon", type: "string" }),
        defineField({ name: "email", title: "Alamat email", type: "string" }),
      ],
    }),
    defineField({
      name: "seo",
      title: "Meta title & description",
      type: "object",
      group: "seo",
      fields: [
        defineField({ name: "home", title: "Beranda", type: "seoEntry" }),
        defineField({ name: "about", title: "Tentang Kami", type: "seoEntry" }),
        defineField({ name: "programs", title: "Program", type: "seoEntry" }),
        defineField({ name: "publications", title: "Publikasi", type: "seoEntry" }),
        defineField({ name: "map", title: "Wilayah Kerja", type: "seoEntry" }),
        defineField({ name: "partnership", title: "Kemitraan", type: "seoEntry" }),
        defineField({ name: "contact", title: "Kontak", type: "seoEntry" }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: "Konten & pengaturan situs GAHARU" }) },
});

const program = defineType({
  name: "program",
  title: "Program",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Nama program ID / EN", type: "localizedString", validation: (Rule) => Rule.required() }),
    defineField({ name: "slug", title: "Slug URL", type: "slug", options: { source: "title.id" }, validation: (Rule) => Rule.required() }),
    defineField({ name: "order", title: "Urutan tampil", type: "number", initialValue: 99 }),
    defineField({ name: "featured", title: "Tampilkan di beranda", type: "boolean", initialValue: false }),
    defineField({ name: "category", title: "Kategori", type: "localizedString", validation: (Rule) => Rule.required() }),
    defineField({ name: "summary", title: "Ringkasan", type: "localizedText", validation: (Rule) => Rule.required() }),
    defineField({ name: "body", title: "Isi program (pisah paragraf dengan baris kosong)", type: "localizedText", validation: (Rule) => Rule.required() }),
    defineField({ name: "cover", title: "Foto utama", type: "editorialImage", validation: (Rule) => Rule.required() }),
    defineField({ name: "gallery", title: "Galeri foto", type: "array", of: [{ type: "editorialImage" }] }),
    defineField({ name: "galleryVideos", title: "Galeri video", type: "array", of: [{ type: "editorialVideo" }] }),
    defineField({ name: "location", title: "Lokasi", type: "localizedString" }),
    defineField({ name: "period", title: "Periode", type: "localizedString" }),
    defineField({ name: "partner", title: "Mitra", type: "localizedString" }),
    defineField({ name: "status", title: "Status informasi", type: "localizedString" }),
    defineField({ name: "metrics", title: "Angka program", type: "array", of: [{ type: "metric" }] }),
    defineField({
      name: "growthData",
      title: "Grafik persen tumbuh (opsional)",
      type: "object",
      fields: [
        defineField({ name: "title", title: "Judul grafik", type: "localizedString" }),
        defineField({ name: "intro", title: "Pengantar grafik", type: "localizedText" }),
        defineField({ name: "initial", title: "Persen tumbuh penilaian awal", type: "number", validation: (Rule) => Rule.required().min(0).max(100) }),
        defineField({ name: "followupMin", title: "Batas bawah rentang P1", type: "number", validation: (Rule) => Rule.required().min(0).max(100) }),
        defineField({ name: "followupMax", title: "Batas atas rentang P1", type: "number", validation: (Rule) => Rule.required().min(0).max(100) }),
        defineField({ name: "standard", title: "Standar minimal", type: "number", validation: (Rule) => Rule.required().min(0).max(100) }),
        defineField({ name: "source", title: "Sumber data", type: "localizedText" }),
        defineField({ name: "note", title: "Catatan metodologi", type: "localizedText" }),
      ],
    }),
    defineField({ name: "metaTitle", title: "Meta title khusus (opsional)", type: "localizedString" }),
    defineField({ name: "metaDescription", title: "Meta description khusus (opsional)", type: "localizedText" }),
  ],
  preview: { select: { title: "title.id", subtitle: "category.id", media: "cover.image" } },
});

const article = defineType({
  name: "article",
  title: "Artikel",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Judul ID / EN", type: "localizedString", validation: (Rule) => Rule.required() }),
    defineField({ name: "slug", title: "Slug URL", type: "slug", options: { source: "title.id" }, validation: (Rule) => Rule.required() }),
    defineField({
      name: "category",
      title: "Kategori",
      type: "string",
      options: { list: [{ title: "Edukasi", value: "edukasi" }, { title: "Riset", value: "riset" }, { title: "Kabar program", value: "kabar" }, { title: "Opini", value: "opini" }] },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "publishedAt", title: "Tanggal terbit (kosongkan jika belum diketahui)", type: "date" }),
    defineField({ name: "readTime", title: "Perkiraan menit baca", type: "number", validation: (Rule) => Rule.min(1).max(120) }),
    defineField({ name: "excerpt", title: "Ringkasan", type: "localizedText", validation: (Rule) => Rule.required() }),
    defineField({ name: "body", title: "Isi artikel (gunakan ## untuk subjudul)", type: "localizedText", validation: (Rule) => Rule.required() }),
    defineField({ name: "cover", title: "Foto utama", type: "editorialImage", validation: (Rule) => Rule.required() }),
    defineField({ name: "authorName", title: "Nama penulis ID / EN", type: "localizedString" }),
    defineField({ name: "authorRole", title: "Jabatan / afiliasi penulis ID / EN", type: "localizedString" }),
    defineField({ name: "authorBio", title: "Biografi singkat penulis ID / EN", type: "localizedText" }),
    defineField({ name: "editorialNote", title: "Catatan editorial ID / EN", type: "localizedText" }),
    defineField({ name: "metaTitle", title: "Meta title khusus (opsional)", type: "localizedString" }),
    defineField({ name: "metaDescription", title: "Meta description khusus (opsional)", type: "localizedText" }),
  ],
  preview: { select: { title: "title.id", subtitle: "category", media: "cover.image" } },
});

export const schemaTypes = [
  localizedString,
  localizedText,
  localizedMissionList,
  editorialImage,
  editorialVideo,
  metric,
  contentSection,
  seoEntry,
  teamMember,
  legalDocument,
  siteSettings,
  program,
  article,
];