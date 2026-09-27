import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./studio/schemaTypes";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.VITE_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.VITE_SANITY_DATASET || "production";

if (!projectId) {
  throw new Error("Set SANITY_STUDIO_PROJECT_ID before starting or deploying GAHARU Studio.");
}

export default defineConfig({
  name: "default",
  title: "GAHARU Studio",
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Konten GAHARU")
          .items([
            S.listItem()
              .title("Pengaturan & halaman utama")
              .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
            S.divider(),
            S.documentTypeListItem("program").title("Program"),
            S.documentTypeListItem("article").title("Artikel"),
          ]),
    }),
  ],
  schema: { types: schemaTypes },
});