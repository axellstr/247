/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly RESEND_API_KEY: string;
  readonly EMAIL_FROM: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

