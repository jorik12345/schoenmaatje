/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}

declare namespace App {
  interface Locals {
    /** Supabase-client met de inlogsessie van de bezoeker. Alleen gezet op accountroutes (zie src/middleware.ts). */
    supabase: import('@supabase/supabase-js').SupabaseClient | null;
    user: import('@supabase/supabase-js').User | null;
  }
}
