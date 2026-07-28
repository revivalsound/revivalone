import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://yvahpzbkxpgjufnxrisc.supabase.co";

export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2YWhwemJreHBnanVmbnhyaXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNTQxMzEsImV4cCI6MjEwMDgzMDEzMX0.7lEP0fOch69ByjcKIWeMwU-Bv9uC947RibSaxk-y-W8";

let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}

export function createSupabaseServerClient(accessToken?: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
}
