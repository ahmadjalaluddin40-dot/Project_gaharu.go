/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SANITY_PROJECT_ID?: string;
  readonly VITE_SANITY_DATASET?: string;
  readonly VITE_PUBLIC_SITE_URL?: string;
  readonly VITE_NETLIFY_FORMS_ENABLED?: string;
  readonly VITE_GOOGLE_MAPS_EMBED_KEY?: string;
  readonly VITE_GAHARU_LOGO_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_MESSAGES_TABLE?: string;
}