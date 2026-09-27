import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// SECURITY NOTE: Only the `anon` key is used in this frontend. It is designed to be
// public; data protection is enforced by Row Level Security policies on Supabase.
// The `service_role` secret must NEVER be referenced here or in any VITE_ variable,
// because Vite inlines such values into the public bundle.
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey, { auth: { persistSession: false } }) : null;

export const messagesTable =
  (import.meta.env.VITE_SUPABASE_MESSAGES_TABLE as string | undefined) || "contact_messages";
